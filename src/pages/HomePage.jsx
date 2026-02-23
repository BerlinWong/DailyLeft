import React, { useState, useMemo, useRef } from 'react'
import { Input, Modal, Toast, SafeArea, SwipeAction } from 'antd-mobile'
import dayjs from 'dayjs'
import { useApp } from '../context/AppContext'
import { calculateDailyBudget } from '../utils/budget'
import { parseTransaction } from '../services/aiService'
import { supabase } from '../utils/supabase'
import { ArrowRight, Trash2, Calendar, TrendingUp, DollarSign, ChevronDown } from 'lucide-react'

const HomePage = () => {
  const { monthlySettings, totalExpenses, remainingDays, transactions, loading, refresh } = useApp()
  const [inputText, setInputText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [expandedDates, setExpandedDates] = useState([dayjs().format('YYYY-MM-DD')])
  const [detailTx, setDetailTx] = useState(null)
  const inputRef = useRef(null)

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
    // Sort newest first
    return Object.entries(groups).sort((a, b) => dayjs(b[0]).diff(dayjs(a[0])))
  }, [transactions])

  const toggleDate = (date) => {
    setExpandedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const handleSend = async () => {
    if (!inputText.trim()) return
    const toast = Toast.show({
      icon: 'loading',
      content: 'Processing...',
      duration: 0,
      maskClickable: false,
    })
    setParsing(true)
    try {
      const parsed = await parseTransaction(inputText)
      toast.close()
      
      Modal.confirm({
        title: <span className="text-ios-primary font-bold">Commit Transaction?</span>,
        content: (
          <div className="py-4">
             <div className="liquid-glass p-6 rounded-[28px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-ios-blue/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">Validated Amount</span>
                <span className="text-4xl font-bold text-ios-blue tracking-tight">¥{parsed.amount}</span>
              </div>
              <div className="mt-6 flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">Context</span>
                <span className="text-lg font-medium text-ios-primary/80 leading-snug">{parsed.description || parsed.category}</span>
              </div>
            </div>
          </div>
        ),
        confirmText: <span className="font-bold">Save</span>,
        cancelText: 'Cancel',
        onConfirm: async () => {
          const { error } = await supabase.from('transactions').insert([{
            amount: parsed.amount,
            category: parsed.category,
            description: parsed.description,
            type: 'expense',
            date: parsed.date
          }])
          if (error) throw error
          Toast.show({ content: 'Record Synced', icon: 'success' })
          setInputText('')
          refresh()
        },
      })
    } catch (error) {
      toast.close()
      Toast.show({ content: 'Syntax Error', icon: 'fail' })
    } finally {
      setParsing(false)
    }
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: <span className="text-ios-primary font-bold">Irreversible action</span>,
      content: <span className="text-ios-secondary">Delete this transaction record?</span>,
      confirmText: <span className="font-bold">Delete</span>,
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) {
          Toast.show({ content: 'Sync Error' })
        } else {
          Toast.show({ content: 'Purged' })
          refresh()
        }
      },
    })
  }

  if (loading && transactions.length === 0) return (
    <div className="min-h-screen p-8 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-ios-primary/5 rounded-full" />
      <div className="h-64 bg-ios-primary/5 rounded-[32px]" />
      <div className="h-20 bg-ios-primary/5 rounded-[28px]" />
    </div>
  )

  return (
    <div className="min-h-screen pb-40 animate-fluid">
      <SafeArea position='top' />
      
      <header className="px-8 pt-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-ios-primary">Today</h1>
          <p className="text-ios-secondary text-sm font-semibold mt-1 uppercase tracking-widest">
            {dayjs().format('dddd, MMM D')}
          </p>
        </div>
        <div className="w-14 h-14 liquid-glass rounded-full flex items-center justify-center text-ios-blue shadow-sm">
          <DollarSign size={28} />
        </div>
      </header>

      {/* Hero Liquid Card */}
      <section className="px-6 mt-10">
        <div className="liquid-glass rounded-[40px] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-ios-blue/10 rounded-full blur-[80px] -mr-16 -mt-16" />
          <div className="relative z-10">
            <header className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-ios-secondary uppercase tracking-[0.3em]">Remaining Balance</span>
              <div className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
            </header>
            <div className="flex items-baseline gap-1">
              <span className={`text-7xl font-bold tracking-tighter transition-colors duration-500 ${dailyBudget < 0 ? 'text-[#ff3b30]' : 'text-ios-primary'}`}>
                {dailyBudget < 0 ? '-' : ''}¥{Math.abs(dailyBudget)}
              </span>
            </div>
            {dailyBudget < 0 && (
              <p className="text-[12px] font-bold text-[#ff3b30]/70 mt-1 uppercase tracking-widest">Over Budget</p>
            )}
            
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="bg-ios-primary/5 backdrop-blur-md p-5 rounded-[28px] border border-ios-border">
                <div className="flex items-center gap-2 mb-1.5 opacity-30">
                  <TrendingUp size={14} className="text-ios-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ios-primary">Spent</span>
                </div>
                <span className="text-xl font-bold text-ios-primary/70">¥{totalExpenses.toFixed(0)}</span>
              </div>
              <div className="bg-ios-primary/5 backdrop-blur-md p-5 rounded-[28px] border border-ios-border">
                <div className="flex items-center gap-2 mb-1.5 opacity-30">
                  <Calendar size={14} className="text-ios-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ios-primary">Period</span>
                </div>
                <span className="text-xl font-bold text-ios-primary/70">{remainingDays}d</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-6 mt-12 sticky top-6 z-20">
        {/* 点击容器任意位置聚焦输入框 */}
        <div
          className="input-bar rounded-[32px] border border-ios-border flex items-center p-2.5 pl-5 transition-all duration-500 shadow-2xl"
          onClick={() => inputRef.current?.focus()}
        >
          <Input
            ref={inputRef}
            placeholder="Or type to log..."
            className="flex-1 text-[17px] font-medium custom-input-caret ml-1"
            style={{ color: 'var(--input-bar-text)' }}
            value={inputText}
            onChange={setInputText}
            onEnterPress={handleSend}
          />
          <div className="flex items-center gap-2 pr-0.5">
            <button
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500
                ${parsing ? 'opacity-50 scale-90' : ''}
                ${inputText ? 'input-bar-btn-active shadow-lg' : 'input-bar-btn-idle'}`}
              onClick={handleSend}
              disabled={parsing}
            >
              {parsing ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight size={22} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <section className="mt-14 px-6">
        <div className="flex items-center justify-between mb-8 px-4">
           <h2 className="text-xl font-bold text-ios-primary tracking-tight">Timeline</h2>
           <span className="text-[11px] font-bold text-ios-secondary uppercase tracking-[0.2em]">{transactions.length} Events</span>
        </div>
        
        <div className="space-y-6">
          {groupedTransactions.map(([date, items]) => {
            const isToday = date === dayjs().format('YYYY-MM-DD')
            const displayDate = isToday ? 'Today' : dayjs(date).format('MMM D')
            const dayTotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
            const isExpanded = expandedDates.includes(date)

            return (
              <div key={date} className="relative">
                <button 
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between p-2 mb-2 group active:opacity-50 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-ios-primary text-ios-bg' : 'bg-ios-primary/5 text-ios-secondary'}`}>
                      <ChevronDown 
                        size={16} 
                        strokeWidth={4}
                        className={`transition-transform duration-500 ${isExpanded ? '' : '-rotate-90'}`}
                      />
                    </div>
                    <span className="text-lg font-bold text-ios-primary tracking-tight">{displayDate}</span>
                  </div>
                  <span className="text-lg font-bold text-ios-secondary">¥{dayTotal.toFixed(0)}</span>
                </button>

                <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="space-y-3 px-1">
                    {items.map(t => (
                      <SwipeAction
                        key={t.id}
                        rightActions={[{
                          key: 'delete',
                          text: (
                            <div className="flex items-center justify-center h-full px-2">
                              <div className="flex items-center justify-center w-14 h-14 bg-[#ff3b30] text-white rounded-full shadow-lg border border-white/20">
                                <Trash2 size={24} strokeWidth={2.5} />
                              </div>
                            </div>
                          ),
                          onClick: () => handleDelete(t.id),
                        }]}
                      >
                        <div
                          onClick={() => setDetailTx(t)}
                          className="liquid-glass rounded-[24px] p-5 flex items-center justify-between active:scale-[0.98] transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-ios-primary/5 rounded-2xl flex items-center justify-center text-ios-secondary shadow-sm border border-ios-border">
                              <span className="text-xs font-black uppercase tracking-tighter">{t.category[0]}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[17px] font-semibold text-ios-primary/90 truncate max-w-[150px]">
                                {t.description || t.category}
                              </span>
                              <span className="text-[13px] font-medium text-ios-secondary">{dayjs(t.date).format('h:mm A')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[19px] font-bold text-ios-primary tracking-tight">¥{t.amount}</span>
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-ios-primary/5 text-ios-secondary uppercase tracking-[0.1em]">
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
        </div>
      </section>
      
      <SafeArea position='bottom' />

      {/* ── Transaction Detail Modal (Centered) ── */}
      {detailTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          onClick={() => setDetailTx(null)}
        >
          <div
            className="w-full max-w-sm liquid-glass rounded-[32px] p-8 animate-fluid"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">金额</span>
                <p className="text-5xl font-bold text-[#007aff] tracking-tight mt-1">¥{detailTx.amount}</p>
              </div>
              <button
                onClick={() => setDetailTx(null)}
                className="w-9 h-9 rounded-full bg-ios-primary/8 flex items-center justify-center text-ios-secondary hover:bg-ios-primary/15 transition-colors"
              >
                <span className="text-xl leading-none font-light">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">分类</span>
                <p className="text-base font-semibold text-ios-primary mt-1">{detailTx.category}</p>
              </div>
              {detailTx.description && (
                <div>
                  <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">描述</span>
                  <p className="text-base font-medium text-ios-primary/80 mt-1">{detailTx.description}</p>
                </div>
              )}
              {detailTx.original_text && (
                <div className="bg-ios-primary/5 rounded-[18px] p-4">
                  <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">原始语音</span>
                  <p className="text-sm text-ios-secondary mt-1.5 italic leading-relaxed">"{detailTx.original_text}"</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">记录时间</span>
                <p className="text-sm font-medium text-ios-secondary mt-1">
                  {dayjs(detailTx.date).format('YYYY年MM月DD日 HH:mm')}
                </p>
              </div>
            </div>

            <button
              onClick={() => { handleDelete(detailTx.id); setDetailTx(null) }}
              className="mt-6 w-full py-4 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              删除记录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
