import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, Skeleton, SafeArea, Tag } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { BarChart3, Wallet } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4']

const StatsPage = () => {
  const { transactions, loading, totalExpenses } = useApp()

  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  if (loading) return (
    <div className="p-10 space-y-8 animate-pulse bg-white min-h-screen">
      <Skeleton.Title />
      <div className="h-64 bg-slate-100 rounded-[32px]" />
      <Skeleton.Paragraph lineCount={5} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-24 animate-fade-in">
      <SafeArea position='top' />
      
      <header className="px-6 pt-12 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Insights</h1>
          <p className="text-slate-500 font-medium italic text-sm">Review your spending patterns</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <BarChart3 size={24} />
        </div>
      </header>

      <section className="px-6 space-y-8">
        {/* Total Summary Mini Card */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-slate-100 p-4 rounded-2xl">
            <Wallet size={24} className="text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Total Month Spend</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1">¥{totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white p-6 rounded-[40px] shadow-lg border border-slate-50 relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            Expense Distribution
          </h3>
          
          <div className="h-[280px] w-full flex items-center justify-center">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    strokeWidth={0}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px 20px' }}
                    itemStyle={{ fontWeight: '800', fontSize: '14px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-300 font-medium italic py-10">No expenses recorded yet.</div>
            )}
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Top One</span>
              <span className="text-xl font-black text-slate-800">{data[0]?.name || '-'}</span>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-slate-800">Categories Breakdown</h2>
            <Tag color='primary' fill='outline' className="rounded-full text-[10px] px-3">Top {data.length}</Tag>
          </div>
          
          <div className="grid gap-3">
            {data.map((item, index) => (
              <div 
                key={item.name} 
                className="bg-white p-5 rounded-[24px] border border-slate-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  >
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight mb-0.5">{item.name}</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {((item.value / data.reduce((s, i) => s + i.value, 0)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">¥{item.value.toFixed(2)}</p>
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
