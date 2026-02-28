import React, { useMemo } from 'react'
import { SafeArea } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart as RePieChart, Pie } from 'recharts'
import dayjs from 'dayjs'
import { BarChart3, PieChart, Activity, Target } from 'lucide-react'
import MeasuredChart from '../components/MeasuredChart'

const StatsPage = () => {
  const { transactions, recentTransactions, loading, totalExpenses } = useApp()
  const { lang } = useLang()

  const dailyStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      return dayjs().subtract(6 - i, 'day').format('MM-DD')
    })

    const stats = last7Days.reduce((acc, date) => {
      acc[date] = 0
      return acc
    }, {})

    recentTransactions.forEach(t => {
      if (t.type !== 'expense') return
      const date = dayjs(t.date).format('MM-DD')
      if (stats[date] !== undefined) {
        stats[date] += Number(t.amount)
      }
    })

    return Object.entries(stats).map(([name, amount]) => ({ name, amount }))
  }, [recentTransactions])

  const categoryStats = useMemo(() => {
    // transactions 在 AppContext 里已按“周期”拉取，这里无需再按 YYYY-MM 过滤
    const monthlyTrans = transactions.filter(t => t.type === 'expense')
    const stats = monthlyTrans.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {})

    const total = Object.values(stats).reduce((a, b) => a + b, 0)

    return Object.entries(stats)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percent: total > 0 ? ((value / total) * 100).toFixed(1) : 0 
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const COLORS = ['#007aff', '#34c759', '#af52de', '#ff9500', '#ff3b30', '#5856d6', '#ff2d55']

  if (loading) return (
    <div className="min-h-screen p-8 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-ios-primary/5 rounded-full" />
      <div className="h-80 bg-ios-primary/5 rounded-[32px]" />
      <div className="h-64 bg-ios-primary/5 rounded-[32px]" />
    </div>
  )

  return (
    <div className="min-h-screen pb-40 animate-fluid">
      <SafeArea position='top' />
      
      <header className="px-8 pt-6 mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-ios-primary">{t(lang,'analytics')}</h1>
        <p className="text-ios-secondary text-sm font-semibold mt-1 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-[#34c759]" /> {t(lang,'performance_overview') || 'Performance overview'}
        </p>
      </header>

      <section className="px-6 space-y-8">
        {/* Weekly Chart Card */}
        <div className="liquid-glass rounded-[40px] p-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-ios-blue" />
              <span className="text-sm font-bold text-ios-primary uppercase tracking-widest">Daily Burn Rate</span>
            </div>
            <span className="text-[10px] font-black text-ios-secondary uppercase tracking-widest">7 Day Pulse</span>
          </header>
          
          <MeasuredChart className="h-64 w-full min-w-0">
            {({ width, height }) => (
              <BarChart width={width} height={height} data={dailyStats}>
                <CartesianGrid vertical={false} strokeOpacity={0.1} stroke="var(--text-primary)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="liquid-glass rounded-2xl px-4 py-2 border-none shadow-xl">
                          <p className="text-xs font-black text-ios-primary">¥{payload[0].value}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="amount" radius={[10, 10, 10, 10]} barSize={35}>
                  {dailyStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === dailyStats.length - 1 ? '#007aff' : '#007aff20'} 
                      className="transition-all duration-500"
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </MeasuredChart>
        </div>

        {/* Monthly Percentage Allocation */}
        <div className="liquid-glass rounded-[40px] p-8">
           <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-[#af52de]" />
                <span className="text-sm font-bold text-ios-primary uppercase tracking-widest">Monthly Allocation</span>
              </div>
              <span className="text-[10px] font-black text-ios-secondary uppercase tracking-widest">{dayjs().format('MMMM')}</span>
            </header>

            <div className="flex flex-col items-center">
              <div className="h-64 w-full relative min-w-0">
                <MeasuredChart className="absolute inset-0">
                  {({ width, height }) => (
                    <RePieChart width={width} height={height}>
                    <Pie
                      data={categoryStats}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="liquid-glass rounded-2xl px-4 py-2 border-none shadow-xl">
                              <p className="text-xs font-black text-ios-primary">{payload[0].name}: {payload[0].value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    </RePieChart>
                  )}
                </MeasuredChart>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-ios-secondary uppercase tracking-widest">Total Spent</span>
                  <span className="text-2xl font-black text-ios-primary tracking-tighter">¥{totalExpenses.toFixed(0)}</span>
                </div>
              </div>

              <div className="w-full space-y-3 mt-8">
                {categoryStats.map((cat, idx) => (
                  <div key={cat.name} className="group">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                        />
                        <span className="text-sm font-bold text-ios-primary">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-ios-secondary">¥{cat.value}</span>
                        <span className="text-xs font-black text-ios-primary w-12 text-right">{cat.percent}%</span>
                      </div>
                    </div>
                    {/* Progress Bar Style */}
                    <div className="h-1.5 w-full bg-ios-primary/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${cat.percent}%`, 
                          backgroundColor: COLORS[idx % COLORS.length],
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </section>

      <SafeArea position='bottom' />
    </div>
  )
}

export default StatsPage
