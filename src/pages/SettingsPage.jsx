import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Toast, SafeArea } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { supabase } from '../utils/supabase'
import { getCurrentMonth } from '../utils/date'
import { Settings, CreditCard, PiggyBank, History, Info } from 'lucide-react'

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
      
      Toast.show({ content: 'Preferences updated', position: 'bottom' })
      refresh()
    } catch (error) {
      Toast.show({ content: 'Failed to update' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 animate-m3 font-sans">
      <SafeArea position='top' />
      
      <header className="px-6 pt-10 mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-[#202124]">Configuration</h1>
        <p className="text-[#5f6368] text-sm mt-1 flex items-center gap-2">
          <Settings size={16} /> Budgeting for {getCurrentMonth()}
        </p>
      </header>

      <section className="px-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          form.validateFields().then(values => onFinish(values));
        }}>
          <div className="space-y-6">
            {/* Primary Parameters Card */}
            <div className="bg-white rounded-[28px] p-6 shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
              <h4 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest mb-6 px-1">Primary Parameters</h4>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#202124] flex items-center gap-2">
                    <CreditCard size={18} className="text-[#1a73e8]" /> Monthly Income
                  </label>
                  <div className="flex items-center bg-[#f1f3f4] rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all">
                    <span className="text-[#5f6368] font-medium mr-2">¥</span>
                    <Form.Item name="income" noStyle>
                      <Input type="number" placeholder="0.00" className="bg-transparent border-none p-0 text-lg font-medium w-full focus:outline-none" />
                    </Form.Item>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#202124] flex items-center gap-2">
                    <PiggyBank size={18} className="text-[#34a853]" /> Savings Goal
                  </label>
                  <div className="flex items-center bg-[#f1f3f4] rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all">
                    <span className="text-[#5f6368] font-medium mr-2">¥</span>
                    <Form.Item name="savings_goal" noStyle>
                      <Input type="number" placeholder="0.00" className="bg-transparent border-none p-0 text-lg font-medium w-full focus:outline-none" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjustments Card */}
            <div className="bg-white rounded-[28px] p-6 shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
              <h4 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest mb-6 px-1">Adjustments</h4>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#202124] flex items-center gap-2">
                  <History size={18} className="text-[#ea4335]" /> Previous Expenses
                </label>
                <div className="flex items-center bg-[#f1f3f4] rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1a73e8]/20 transition-all">
                  <span className="text-[#5f6368] font-medium mr-2">¥</span>
                  <Form.Item name="initial_spent" noStyle>
                    <Input type="number" placeholder="0.00" className="bg-transparent border-none p-0 text-lg font-medium w-full focus:outline-none" />
                  </Form.Item>
                </div>
                <p className="text-[11px] text-[#5f6368] mt-1 pl-1">Already spent before creating this budget</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-2 pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-[28px] text-white bg-[#1a73e8] hover:bg-[#1a73e8]/90 active:scale-[0.98] transition-all font-medium disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>

        {/* Info Callout */}
        <div className="mt-10 mx-2 p-6 bg-[#e8f0fe] rounded-[28px] border border-[#d2e3fc]">
          <div className="flex gap-4">
            <div className="bg-white p-2 h-fit rounded-xl text-[#1a73e8]">
              <Info size={20} />
            </div>
            <div>
              <h5 className="text-sm font-medium text-[#1967d2] mb-1 tracking-tight">How it works</h5>
              <p className="text-xs text-[#1967d2]/80 leading-relaxed">
                Daily Budget = (Income - Goal - Total Spent - Offset) / Days Remaining. 
                Keep your parameters updated for accurate precision.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-[#5f6368] font-bold uppercase tracking-[0.2em] opacity-40">
          DailyLeft v1.2.0 • Material Desgin
        </div>
      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default SettingsPage
