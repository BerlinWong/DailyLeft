import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../utils/supabase'
import { getCurrentMonth, getRemainingDaysInMonth } from '../utils/date'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [monthlySettings, setMonthlySettings] = useState({ income: 0, savings_goal: 0 })
  const [loading, setLoading] = useState(true)
  const currentMonth = getCurrentMonth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch current month transactions (no limit)
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', `${currentMonth}-01`)
        .order('date', { ascending: false })

      if (transData) setTransactions(transData)

      // Fetch last 90 days for stats charts
      const since90 = dayjs().subtract(90, 'day').format('YYYY-MM-DD')
      const { data: recentData } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', since90)
        .order('date', { ascending: false })

      if (recentData) setRecentTransactions(recentData)

      // Fetch monthly settings
      const { data: settingsData } = await supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', currentMonth)
        .single()
      
      if (settingsData) {
        setMonthlySettings(settingsData)
      } else {
        // Initialize for current month if not exists
        const { data: newData } = await supabase
          .from('monthly_settings')
          .insert([{ month: currentMonth, income: 0, savings_goal: 0 }])
          .select()
          .single()
        if (newData) setMonthlySettings(newData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
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
  }, [fetchData])

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Number(t.amount), 0) + Number(monthlySettings.initial_spent || 0)

  const remainingDays = getRemainingDaysInMonth()

  return (
    <AppContext.Provider value={{ 
      transactions,
      recentTransactions,
      monthlySettings, 
      totalExpenses, 
      remainingDays, 
      loading,
      refresh: fetchData 
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
