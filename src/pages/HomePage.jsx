import React, { useState, useMemo } from 'react'
import { Input, Modal, Toast, SafeArea, SwipeAction } from 'antd-mobile'
import dayjs from 'dayjs'
import { useApp } from '../context/AppContext'
import { calculateDailyBudget } from '../utils/budget'
import { parseTransaction } from '../services/aiService'
import { supabase } from '../utils/supabase'
import { Search, Plus, Trash2, Calendar, TrendingUp, DollarSign, ChevronDown } from 'lucide-react'

const HomePage = () => {
  const { monthlySettings, totalExpenses, remainingDays, transactions, loading, refresh } = useApp()
  const [inputText, setInputText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [expandedDates, setExpandedDates] = useState([dayjs().format('YYYY-MM-DD')])

  const dailyBudget = calculateDailyBudget(
    monthlySettings.income,
    monthlySettings.savings_goal,
    totalExpenses,
    remainingDays
  )

  const groupedTransactions = useMemo(() => {
    const groups = transactions.reduce((acc, t) => {
      const dateKey = dayjs(t.date).format('YYYY-MM-DD')
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(t)
      return acc
    }, {})
    return Object.entries(groups).sort((a, b) => dayjs(b[0]).isBefore(dayjs(a[0])) ? 1 : -1).reverse()
  }, [transactions])

  const toggleDate = (date) => {
    setExpandedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const handleSend = async () => {
    if (!inputText.trim()) return
    setParsing(true)
    try {
      const parsed = await parseTransaction(inputText)
      
      Modal.confirm({
        title: 'Save Transaction?',
        content: (
          <div className="py-4 space-y-4 font-sans text-[#202124]">
             <div className="bg-[#f8f9fa] p-4 rounded-2xl border border-[#dadce0]">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#5f6368]">AMOUNT</span>
                <span className="text-2xl font-medium text-[#1a73e8]">¥{parsed.amount}</span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-xs font-medium text-[#5f6368]">DESCRIPTION</span>
                <span className="text-sm font-medium">{parsed.description}</span>
              </div>
            </div>
          </div>
        ),
        confirmText: 'Save',
        onConfirm: async () => {
          const { error } = await supabase.from('transactions').insert([{
            amount: parsed.amount,
            category: parsed.category,
            description: parsed.description,
            type: 'expense',
            date: parsed.date
          }])
          if (error) throw error
          Toast.show({ content: 'Saved' })
          setInputText('')
          refresh()
        },
      })
    } catch (error) {
      Toast.show({ content: 'Format error' })
    } finally {
      setParsing(false)
    }
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete record?',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) {
          Toast.show({ content: 'Error' })
        } else {
          Toast.show({ content: 'Deleted' })
          refresh()
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 animate-m3 font-sans">
      <SafeArea position='top' />
      
      <header className="px-6 pt-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-[#202124]">Allowance</h1>
          <p className="text-[#5f6368] text-sm mt-1">{dayjs().format('dddd, MMM D')}</p>
        </div>
        <div className="w-12 h-12 bg-[#e8f0fe] rounded-full flex items-center justify-center text-[#1a73e8]">
          <DollarSign size={24} />
        </div>
      </header>

      <section className="px-4 mt-8">
        <div className="m3-card bg-white">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wider mb-2">Available for Today</span>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-medium text-[#1a73e8] tracking-tighter">¥{dailyBudget}</span>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-[#f8f9fa] p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-[#1a73e8]" />
                  <span className="text-[10px] font-bold text-[#5f6368] uppercase">Spent</span>
                </div>
                <span className="text-lg font-medium text-[#202124]">¥{totalExpenses.toFixed(1)}</span>
              </div>
              <div className="bg-[#f8f9fa] p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-[#1a73e8]" />
                  <span className="text-[10px] font-bold text-[#5f6368] uppercase">Days</span>
                </div>
                <span className="text-lg font-medium text-[#202124]">{remainingDays}d</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 mt-8">
        <div className="google-input flex items-center shadow-sm">
          <Search size={20} className="text-[#5f6368]" />
          <Input
            placeholder="Log expense (e.g. Lunch 40)"
            className="flex-1 ml-3 text-[16px] placeholder:text-[#5f6368]/50"
            value={inputText}
            onChange={setInputText}
            onEnterPress={handleSend}
          />
          {inputText && (
            <button 
              className="ml-2 w-10 h-10 bg-[#1a73e8] rounded-full flex items-center justify-center text-white"
              onClick={handleSend}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <section className="mt-10 px-4">
        <h2 className="text-sm font-medium text-[#5f6368] mb-4 px-2">Recent Activity</h2>
        
        <div className="space-y-4">
          {groupedTransactions.map(([date, items]) => {
            const isToday = date === dayjs().format('YYYY-MM-DD')
            const displayDate = isToday ? 'Today' : dayjs(date).format('MMM D, dddd')
            const dayTotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
            const isExpanded = expandedDates.includes(date)

            return (
              <div key={date} className="bg-white rounded-[28px] overflow-hidden shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
                <button 
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between p-5 group active:bg-[#f8f9fa] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full transition-colors ${isExpanded ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                      <ChevronDown 
                        size={18} 
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#202124]">{displayDate}</span>
                  </div>
                  <span className="text-sm font-medium text-[#1a73e8]">¥{dayTotal.toFixed(1)}</span>
                </button>

                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="divide-y divide-[#f1f3f4]">
                    {items.map(t => (
                      <SwipeAction
                        key={t.id}
                        rightActions={[
                          {
                            key: 'delete',
                            text: (
                              <div className="flex flex-col items-center justify-center h-full w-20 text-white gap-1">
                                <Trash2 size={22} strokeWidth={2.5} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Delete</span>
                              </div>
                            ),
                            onClick: () => handleDelete(t.id),
                          }
                        ]}
                      >
                        <div className="flex items-center justify-between p-5 bg-white active:bg-[#f8f9fa] transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#f1f3f4] rounded-2xl flex items-center justify-center text-[#5f6368] group-active:bg-[#e8eaed] transition-colors">
                              <span className="text-xs font-bold uppercase">{t.category[0]}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-medium text-[#202124] truncate max-w-[150px]">
                                {t.description || t.category}
                              </span>
                              <span className="text-[12px] text-[#5f6368]">{dayjs(t.date).format('h:mm A')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[16px] font-medium text-[#202124]">¥{t.amount}</span>
                            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] tracking-tight">
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </SwipeAction>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
          
          {transactions.length === 0 && !loading && (
            <div className="py-20 text-center text-[#5f6368]/40">
              <p className="text-sm">No activity recorded yet</p>
            </div>
          )}
        </div>
      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default HomePage
