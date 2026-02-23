import React, { useState } from 'react'
import { Card, Input, Button, Modal, List, Tag, Toast, SafeArea, SwipeAction } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { calculateDailyBudget } from '../utils/budget'
import { parseTransaction } from '../services/aiService'
import { supabase } from '../utils/supabase'
import { Send, Plus, ReceiptText, Sparkles, TrendingUp, Trash2 } from 'lucide-react'

const HomePage = () => {
  const { monthlySettings, totalExpenses, remainingDays, transactions, loading } = useApp()
  const [inputText, setInputText] = useState('')
  const [parsing, setParsing] = useState(false)

  const dailyBudget = calculateDailyBudget(
    monthlySettings.income,
    monthlySettings.savings_goal,
    totalExpenses,
    remainingDays
  )

  const handleSend = async () => {
    if (!inputText.trim()) return
    setParsing(true)
    try {
      const parsed = await parseTransaction(inputText)
      
      Modal.confirm({
        title: (
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} />
            <span>AI Analyzed</span>
          </div>
        ),
        content: (
          <div className="py-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400 text-xs">Amount</span>
                <span className="text-2xl font-black text-slate-900">¥{parsed.amount}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400 text-xs">Category</span>
                <Tag color='primary' fill='outline' className="rounded-md px-2 py-0.5">{parsed.category}</Tag>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-1">Description</span>
                <span className="text-slate-700 font-medium">{parsed.description}</span>
              </div>
            </div>
            <p className="text-xs text-center text-slate-400 italic">Is this correct?</p>
          </div>
        ),
        confirmText: 'Save Transaction',
        cancelText: 'Edit',
        onConfirm: async () => {
          const { error } = await supabase.from('transactions').insert([{
            amount: parsed.amount,
            category: parsed.category,
            description: parsed.description,
            type: 'expense',
            date: parsed.date
          }])
          if (error) throw error
          Toast.show({ icon: 'success', content: 'Success!' })
          setInputText('')
        },
      })
    } catch (error) {
      console.error(error)
      Toast.show({ icon: 'fail', content: 'Parsing failed' })
    } finally {
      setParsing(false)
    }
  }

  const handleDelete = (id) => {
    Modal.confirm({
      content: 'Are you sure you want to delete this record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) {
          Toast.show({ icon: 'fail', content: 'Delete failed' })
        } else {
          Toast.show({ icon: 'success', content: 'Deleted' })
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-24 animate-fade-in font-sans">
      <SafeArea position='top' />
      
      {/* Header / Hero */}
      <section className="px-6 pt-10 pb-12 bg-gradient-to-b from-blue-50/50 to-transparent rounded-b-[40px]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-slate-400 text-sm font-semibold tracking-[0.2em] uppercase mb-1">Left for today</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-400">¥</span>
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                {dailyBudget}
              </h1>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <TrendingUp size={24} className="text-primary" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Month Spent</p>
            <p className="text-lg font-black text-slate-800">¥{totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Days Left</p>
            <p className="text-lg font-black text-slate-800">{remainingDays}d</p>
          </div>
        </div>
      </section>

      {/* Floating Magic Bar */}
      <div className="px-6 -mt-6 sticky top-4 z-10 transition-all duration-300">
        <div className="glass flex items-center p-2 pl-5 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)] border border-primary/10">
          <Input
            placeholder="Tell AI what you spent..."
            className="flex-1 text-slate-700 font-medium placeholder:text-slate-400"
            value={inputText}
            onChange={setInputText}
            onEnterPress={handleSend}
          />
          <Button 
            color='primary' 
            className="ml-2 !h-11 !w-11 !rounded-2xl flex items-center justify-center !p-0 shadow-lg shadow-primary/20 bg-primary hover:scale-105 active:scale-95 transition-transform"
            onClick={handleSend}
            loading={parsing}
          >
            <Sparkles size={20} className="text-white" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="mt-10 px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Records</h2>
          <Button size='mini' fill='none' className="!text-primary !font-bold text-sm">View Archive</Button>
        </div>

        <div className="space-y-3">
          {transactions.slice(0, 10).map(t => (
            <SwipeAction
              key={t.id}
              rightActions={[
                {
                  key: 'delete',
                  text: <div className="flex items-center justify-center h-full px-4"><Trash2 size={20} /></div>,
                  color: 'danger',
                  onClick: () => handleDelete(t.id),
                },
              ]}
              className="rounded-[24px]"
            >
              <div 
                className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-50 flex items-center justify-between hover:border-blue-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-500">
                    <Plus size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight mb-0.5">{t.description || t.category}</p>
                    <p className="text-[10px] font-medium text-slate-400">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">- ¥{t.amount}</p>
                </div>
              </div>
            </SwipeAction>
          ))}
          
          {transactions.length === 0 && (
            <div className="py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
              < ReceiptText size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium italic">Empty yet. Talk to AI to start.</p>
            </div>
          )}
        </div>
      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default HomePage
