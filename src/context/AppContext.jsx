import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../utils/supabase'
import { getCurrentCycleKey, getCycleStart, getNextCycleStart, getRemainingDaysInCycle } from '../utils/date'
import { calculateDailyAllowanceSnapshot, calculateMonthlyAvailable, calculateCycleDailyAllowance } from '../utils/budget'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  // custom user object returned from our own `users` table
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [monthlySettings, setMonthlySettings] = useState({ income: 0, savings_goal: 0 })
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true) // 专门用于初次启动的阻塞
  // 用一个“日戳”来保证跨 0 点会触发一次刷新/重算（不需要时时刷新）
  const [dayStamp, setDayStamp] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    let timeoutId
    const scheduleNextMidnight = () => {
      const now = dayjs()
      const nextMidnight = now.add(1, 'day').startOf('day').add(5, 'second') // 过 0 点后刷新一次即可，留少量缓冲避免边界抖动
      const ms = Math.max(nextMidnight.diff(now, 'millisecond'), 1_000)
      timeoutId = setTimeout(() => {
        setDayStamp(dayjs().format('YYYY-MM-DD'))
        scheduleNextMidnight()
      }, ms)
    }
    scheduleNextMidnight()
    return () => clearTimeout(timeoutId)
  }, [])

  // load user from localStorage on startup and mark ready
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('failed to parse stored user', e)
    }
    setAuthReady(true)
  }, [])

  // keep `user` from state, not derived from session

  // 这些值必须稳定，否则会导致 fetchData useCallback 每次 render 都变化 -> effect 反复触发 -> 页面抖动/空白
  const today = useMemo(() => dayjs(dayStamp), [dayStamp]) // 解析为当天 00:00
  // determine cycle start day (configurable per user via settings)
  const cycleStartDay = useMemo(() => {
    const d = Number(monthlySettings.cycle_start_day || 11)
    return d >= 1 && d <= 28 ? d : 11
  }, [monthlySettings.cycle_start_day])

  const cycleStart = useMemo(() => getCycleStart(today, cycleStartDay), [today, cycleStartDay])
  const nextCycleStart = useMemo(() => getNextCycleStart(today, cycleStartDay), [today, cycleStartDay])
  const cycleKey = useMemo(() => getCurrentCycleKey(today, cycleStartDay), [today, cycleStartDay])
  const remainingDays = useMemo(() => getRemainingDaysInCycle(today, cycleStartDay), [today, cycleStartDay])
  const cycleStartISO = useMemo(() => cycleStart.toISOString(), [cycleStart])
  const nextCycleStartISO = useMemo(() => nextCycleStart.toISOString(), [nextCycleStart])
  const cycleTotalDays = useMemo(() => Math.max(nextCycleStart.diff(cycleStart, 'day'), 0), [nextCycleStart, cycleStart])

  const fetchData = useCallback(async () => {
    if (!user) {
      setTransactions([])
      setRecentTransactions([])
      setMonthlySettings({ income: 0, savings_goal: 0, initial_spent: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch current cycle transactions (no limit)
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', cycleStartISO)
        .lt('date', nextCycleStartISO)
        .order('date', { ascending: false })

      if (transData) setTransactions(transData)

      // Fetch last 90 days for stats charts
      const since90 = dayjs().subtract(90, 'day').format('YYYY-MM-DD')
      const { data: recentData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', since90)
        .order('date', { ascending: false })

      if (recentData) setRecentTransactions(recentData)

      // Fetch monthly settings
      // try to load settings row; maybeSingle avoids 406 when no rows exist
      const { data: settingsData, error: settingsError } = await supabase
        .from('monthly_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', cycleKey)
        .maybeSingle()
      if (settingsError) {
        // if there are duplicate rows or other issue, surface it
        throw settingsError
      }

      if (settingsData) {
        setMonthlySettings(settingsData)
      } else {
        // Initialize for current cycle if not exists, inherit previous cycle_start_day if any
        const defaultStart = monthlySettings.cycle_start_day || 11
        const { data: newData, error: insertError } = await supabase
          .from('monthly_settings')
          .insert([{ user_id: user.id, month: cycleKey, income: 0, savings_goal: 0, initial_spent: 0, cycle_start_day: defaultStart }])
          .select()
          .single()
        if (insertError) throw insertError
        if (newData) setMonthlySettings(newData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setInitializing(false) // 只要完成一次请求，就代表初始化完成
    }
  }, [user, cycleKey, cycleStartISO, nextCycleStartISO])

  useEffect(() => {
    if (!user) return
    fetchData()

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_settings' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, user])

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) + Number(monthlySettings.initial_spent || 0)

  const todayExpenses = transactions
    .filter(t => t.type === 'expense' && dayjs(t.date).format('YYYY-MM-DD') === dayStamp)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expensesBeforeToday = transactions
    .filter(t => t.type === 'expense' && dayjs(t.date).isBefore(today.startOf('day')))
    .reduce((sum, t) => sum + Number(t.amount), 0) + Number(monthlySettings.initial_spent || 0)

  const monthlyAvailable = calculateMonthlyAvailable(
    monthlySettings.income,
    monthlySettings.savings_goal,
    totalExpenses
  )

  // 周期总额度（基准线用）：收入 - 储蓄目标 - 外部已花（initial_spent）
  const cycleTotalBudget = Number(monthlySettings.income || 0)
    - Number(monthlySettings.savings_goal || 0)
    - Number(monthlySettings.initial_spent || 0)

  const baselineDailyAllowance = cycleTotalDays > 0 ? Number((cycleTotalBudget / cycleTotalDays).toFixed(2)) : 0

  const dailyAllowanceSnapshot = calculateDailyAllowanceSnapshot(
    monthlySettings.income,
    monthlySettings.savings_goal,
    expensesBeforeToday,
    remainingDays
  )

  const dailyAvailable = Number((dailyAllowanceSnapshot - todayExpenses).toFixed(2))

  const cycleDailyAllowance = calculateCycleDailyAllowance(
    monthlyAvailable,
    remainingDays
  )

  const cycleDailyDelta = Number((cycleDailyAllowance - baselineDailyAllowance).toFixed(2))

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
  }, [])

  // custom login/register helpers
  const login = useCallback(async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('用户名或密码错误')
    setUser(data)
    localStorage.setItem('user', JSON.stringify(data))
    return data
  }, [])

  const register = useCallback(async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password }])
      .select()
      .single()
    if (error) throw error
    setUser(data)
    localStorage.setItem('user', JSON.stringify(data))
    return data
  }, [])

  return (
    <AppContext.Provider value={{ 
      user,
      authReady,
      login,
      register,
            transactions,
      recentTransactions,
      monthlySettings, 
      totalExpenses, 
      remainingDays, 
      cycleKey,
      cycleStart: cycleStartISO,
      nextCycleStart: nextCycleStartISO,
      monthlyAvailable,
      todayExpenses,
      dailyAllowanceSnapshot,
      dailyAvailable,
      cycleTotalDays,
      cycleTotalBudget,
      baselineDailyAllowance,
      cycleDailyAllowance,
      cycleDailyDelta,
      cycleStartDay,
      loading,
      initializing, // 暴露给页面，用于更精准的白屏/骨架屏控制
      signOut,
      refresh: fetchData
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
