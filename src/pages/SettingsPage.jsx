import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Toast, SafeArea } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { supabase } from '../utils/supabase'
import { getCurrentMonth } from '../utils/date'
import { PiggyBank, Briefcase, History, ChevronRight } from 'lucide-react'

const SettingsPage = () => {
  const { monthlySettings, refresh } = useApp()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({
      income: monthlySettings.income,
      savings_goal: monthlySettings.savings_goal,
      initial_spent: monthlySettings.initial_spent || 0
    })
  }, [monthlySettings, form])

  const onFinish = async (values) => {
    setLoading(true)
    const currentMonth = getCurrentMonth()
    try {
      const { error } = await supabase
        .from('monthly_settings')
        .upsert({ 
          month: currentMonth, 
          income: parseFloat(values.income) || 0, 
          savings_goal: parseFloat(values.savings_goal) || 0,
          initial_spent: parseFloat(values.initial_spent) || 0
        }, { onConflict: 'month' })
      
      if (error) throw error
      
      Toast.show({ icon: 'success', content: 'Plan Saved' })
      refresh()
    } catch (error) {
      console.error(error)
      Toast.show({ icon: 'fail', content: 'Update failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-24 animate-fade-in">
      <SafeArea position='top' />
      
      <header className="px-6 pt-12 pb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Plan</h1>
        <p className="text-slate-500 font-medium">Budgeting for {getCurrentMonth()}</p>
      </header>

      <section className="px-6 flex-1">
        <Form
          form={form}
          onFinish={onFinish}
          footer={
            <Button 
              block 
              type='submit' 
              color='primary' 
              loading={loading} 
              className="!rounded-[20px] !h-14 font-black text-lg shadow-xl shadow-primary/20 bg-primary mt-6"
            >
              Update Budget Plan
            </Button>
          }
          layout='vertical'
          className="bg-transparent"
        >
          <div className="space-y-4">
            <div className="bg-white p-2 rounded-[28px] shadow-sm border border-slate-100">
              <Form.Item
                name='income'
                label={<div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-2"><Briefcase size={14} className="text-blue-500" /> Total Income</div>}
                rules={[{ required: true, message: 'Missing amount' }]}
                className="!border-none"
              >
                <Input type='number' placeholder='0.00' clearable className="font-black text-xl px-2 text-slate-800" />
              </Form.Item>
            </div>

            <div className="bg-white p-2 rounded-[28px] shadow-sm border border-slate-100">
              <Form.Item
                name='savings_goal'
                label={<div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-2"><PiggyBank size={14} className="text-emerald-500" /> Savings Goal</div>}
                rules={[{ required: true, message: 'Missing amount' }]}
                className="!border-none"
              >
                <Input type='number' placeholder='0.00' clearable className="font-black text-xl px-2 text-slate-800" />
              </Form.Item>
            </div>

            <div className="bg-white p-2 rounded-[28px] shadow-sm border border-slate-100">
              <Form.Item
                name='initial_spent'
                label={<div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-2"><History size={14} className="text-amber-500" /> Spent Already</div>}
                description="Expenses before using this tracker"
                className="!border-none"
              >
                <Input type='number' placeholder='0.00' clearable className="font-black text-xl px-2 text-slate-800" />
              </Form.Item>
            </div>
          </div>
        </Form>

        {/* Info Card */}
        <div className="mt-10 p-6 rounded-[32px] bg-indigo-900 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              How it works
            </h3>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              We take your <span className="text-white">Income</span>, minus <span className="text-white">Savings</span>, minus <span className="text-white">Month Spent</span> (Records + Manual Offset), and divide the rest by <span className="text-white italic">days left</span>.
            </p>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
        </div>

        <div className="mt-8 px-2 flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
          <span>DailyLeft v1.0</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">Documentation <ChevronRight size={12} /></span>
        </div>
      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default SettingsPage
