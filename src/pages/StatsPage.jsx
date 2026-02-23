import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { SafeArea } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { BarChart3, Wallet, PieChart as PieIcon, LineChart, Activity } from 'lucide-react'

const COLORS = [
  '#1a73e8', // Google Blue
  '#ea4335', // Google Red
  '#fbbc04', // Google Yellow
  '#34a853', // Google Green
  '#fa7b17', // Orange
  '#9334e6', // Purple
  '#12b5cb', // Cyan
  '#5f6368'  // Gray
]

const StatsPage = () => {
  const { transactions, loading, totalExpenses, monthlySettings } = useApp()

  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount)
      return acc
    }, {})

    if (monthlySettings.initial_spent > 0) {
      grouped['Offset'] = (grouped['Offset'] || 0) + Number(monthlySettings.initial_spent)
    }

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, monthlySettings.initial_spent])

  const dailyData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()

    const expensesByDay = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const date = curr.date.split('T')[0]
        acc[date] = (acc[date] || 0) + Number(curr.amount)
        return acc
      }, {})

    return last7Days.map(date => ({
      date: date.split('-').slice(2).join('/'),
      amount: expensesByDay[date] || 0
    }))
  }, [transactions])

  if (loading) return (
    <div className="p-10 space-y-8 bg-[#f8f9fa] min-h-screen animate-pulse">
      <div className="h-8 w-48 bg-[#eeeeee] rounded-full" />
      <div className="h-4 w-32 bg-[#eeeeee] rounded-full" />
      <div className="h-64 bg-white rounded-[28px] shadow-sm" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white rounded-2xl shadow-sm" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 animate-m3 font-sans">
      <SafeArea position='top' />
      
      <header className="px-6 pt-10 mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-[#202124]">Activity</h1>
        <p className="text-[#5f6368] text-sm mt-1 flex items-center gap-2">
          <Activity size={16} className="text-[#1a73e8]" /> Monthly usage overview
        </p>
      </header>

      <section className="px-4 space-y-6">
        {/* Total Surface */}
        <div className="bg-[#e8f0fe] p-6 rounded-[28px] border border-[#d2e3fc]">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl text-[#1a73e8] shadow-sm">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1967d2] uppercase tracking-widest">Spent this month</p>
              <p className="text-2xl font-medium text-[#1a73e8]">¥{totalExpenses.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="m3-card">
          <h3 className="text-sm font-medium text-[#202124] mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-[#1a73e8]" /> Breakdown
          </h3>
          <div className="h-[240px] w-full">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    stroke="none"
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 8px 24px rgba(60,64,67,0.15)',
                      padding: '12px 16px',
                      fontFamily: 'Google Sans, sans-serif'
                    }}
                    itemStyle={{ color: '#202124', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#5f6368]/30 italic text-sm">No records logged</div>
            )}
          </div>
        </div>

        <div className="m3-card">
          <h3 className="text-sm font-medium text-[#202124] mb-6 flex items-center gap-2">
            <LineChart size={18} className="text-[#34a853]" /> 7-Day Trend
          </h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#5f6368', fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f1f3f4', radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 8px 24px rgba(60,64,67,0.15)',
                    padding: '12px 16px'
                  }}
                />
                <Bar dataKey="amount" fill="#1a73e8" radius={[6, 6, 6, 6]} barSize={24} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Table Style */}
        <div className="mt-8 px-2 pb-10">
          <h4 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest mb-4">Categories</h4>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between p-4 bg-white rounded-[20px] shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[15px] font-medium text-[#202124]">{item.name}</span>
                </div>
                <div className="flex items-center gap-6">
                   <div className="bg-[#f1f3f4] px-2 py-0.5 rounded-full">
                     <span className="text-[#5f6368] text-[10px] font-bold tracking-tight">{((item.value / data.reduce((s, i) => s + i.value, 0)) * 100).toFixed(0)}%</span>
                   </div>
                   <span className="text-[16px] font-medium text-[#202124] w-20 text-right">¥{item.value.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default StatsPage
