import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Toast, SafeArea } from 'antd-mobile'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'
import { supabase } from '../utils/supabase'
import { Settings, CreditCard, PiggyBank, History, Info } from 'lucide-react'

const SettingsPage = () => {
  const { monthlySettings, refresh, cycleKey, user, signOut } = useApp()
  const { lang, toggleLang } = useLang()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (monthlySettings && monthlySettings.income !== undefined) {
      form.setFieldsValue({
        income: monthlySettings.income,
        savings_goal: monthlySettings.savings_goal,
        initial_spent: monthlySettings.initial_spent || 0,
        cycle_start_day: monthlySettings.cycle_start_day || 11
      })
    }
  }, [monthlySettings, form])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      if (!user) {
        Toast.show({ content: '请先登录' })
        return
      }
      const { error } = await supabase
        .from('monthly_settings')
        .upsert({ 
          user_id: user.id,
          month: cycleKey, 
          income: parseFloat(values.income) || 0, 
          savings_goal: parseFloat(values.savings_goal) || 0,
          initial_spent: parseFloat(values.initial_spent) || 0,
          cycle_start_day: parseInt(values.cycle_start_day, 10) || 11
        }, { onConflict: 'user_id,month' })
      
      if (error) throw error
      
      Toast.show({ content: t(lang,'policy_updated') })
      refresh()
      navigate('/', { replace: true })
    } catch (error) {
      Toast.show({ content: t(lang,'sync_failed') })
    } finally {
      setLoading(false)
    }
  }

  if (!monthlySettings) return null;

  return (
    <div className="min-h-screen pb-10 animate-fluid font-sans">
      <SafeArea position='top' />
      
      <header className="px-8 pt-12 mb-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-ios-primary">{t(lang,'control')}</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-ios-secondary text-sm">{user.username}</span>
                <button
                  onClick={signOut}
                  className="text-xs font-semibold text-[#ff3b30]"
                >
                  {t(lang,'logout')}
                </button>
              </div>
            )}
            <button
              onClick={toggleLang}
              className="text-xs px-2 py-1 border rounded"
            >
              {lang === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </div>
        <p className="text-ios-secondary text-sm font-semibold mt-1 uppercase tracking-widest flex items-center gap-2">
          <Settings size={14} className="text-[#007aff]" /> {t(lang,'systemCalibration')}
        </p>
      </header>

      <section className="px-6">
        <Form 
          form={form} 
          onFinish={onFinish}
          className="!bg-transparent"
        >
          <div className="space-y-8">
            <div className="liquid-glass rounded-[40px] p-8 space-y-8">
              <h4 className="text-[11px] font-black text-ios-secondary uppercase tracking-[0.3em] px-1">Economy Settings</h4>
              
              <div className="space-y-8">
                <div className="flex flex-col gap-3">
                  <label className="text-[17px] font-bold text-ios-primary/70 flex items-center gap-2 pl-1">
                    <CreditCard size={20} className="text-[#007aff]" /> Monthly Fuel (Income)
                  </label>
                  <div className="bg-black/5 dark:bg-white/5 focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-xl rounded-[28px] p-6 border border-white/10 transition-all duration-500">
                    <div className="flex items-center">
                      <span className="text-2xl font-black text-ios-primary/10 mr-3">¥</span>
                      <Form.Item name="income" noStyle>
                        <Input 
                          type="number" 
                          placeholder="Current Settings" 
                          className="bg-transparent border-none p-0 text-3xl font-bold text-ios-primary w-full" 
                        />
                      </Form.Item>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[17px] font-bold text-ios-primary/70 flex items-center gap-2 pl-1">
                    <Settings size={20} className="text-[#007aff]" /> {t(lang,'cycle_start_day')}
                  </label>
                  <div className="bg-black/5 dark:bg-white/5 focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-xl rounded-[28px] p-6 border border-white/10 transition-all duration-500">
                    <Form.Item name="cycle_start_day" noStyle>
                      <Input
                        type="number"
                        placeholder="11"
                        min={1}
                        max={28}
                        className="bg-transparent border-none p-0 text-3xl font-bold text-ios-primary w-full" 
                      />
                    </Form.Item>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[17px] font-bold text-ios-primary/70 flex items-center gap-2 pl-1">
                    <PiggyBank size={20} className="text-[#34c759]" /> Savings Goal
                  </label>
                  <div className="bg-black/5 dark:bg-white/5 focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-xl rounded-[28px] p-6 border border-white/10 transition-all duration-500">
                    <div className="flex items-center">
                      <span className="text-2xl font-black text-ios-primary/10 mr-3">¥</span>
                      <Form.Item name="savings_goal" noStyle>
                        <Input 
                          type="number" 
                          placeholder="Efficiency Target" 
                          className="bg-transparent border-none p-0 text-3xl font-bold text-ios-primary w-full" 
                        />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="liquid-glass rounded-[40px] p-8">
              <h4 className="text-[11px] font-black text-ios-secondary uppercase tracking-[0.3em] mb-6 px-1">Data Correction</h4>
              <div className="flex flex-col gap-3">
                <label className="text-[17px] font-bold text-ios-primary/70 flex items-center gap-2 pl-1">
                  <History size={20} className="text-[#ff3b30]" /> Spent Elsewhere
                </label>
                <div className="bg-black/5 dark:bg-white/5 focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-xl rounded-[28px] p-6 border border-white/10 transition-all duration-500">
                  <div className="flex items-center">
                    <span className="text-2xl font-black text-ios-primary/10 mr-3">¥</span>
                    <Form.Item name="initial_spent" noStyle>
                      <Input 
                        type="number" 
                        placeholder="Offset Balance" 
                        className="bg-transparent border-none p-0 text-3xl font-bold text-ios-primary w-full" 
                      />
                    </Form.Item>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-ios-secondary px-4 mt-2 leading-relaxed">Adjust your remaining budget if you spent money outside this ledger.</p>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-full bg-[#007aff] text-white font-black text-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-500 disabled:opacity-50 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? 'CALIBRATING...' : 'APPLY POLICY'}
              </button>
            </div>
          </div>
        </Form>

        <div className="mt-16 p-8 liquid-glass rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#007aff]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-150" />
          <div className="flex gap-6 relative z-10">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 h-fit rounded-[22px] text-[#007aff] shadow-sm border border-white/20">
              <Info size={26} />
            </div>
            <div>
              <h5 className="text-[18px] font-black text-ios-primary/80 mb-2">Liquid Engine</h5>
              <p className="text-[14px] font-medium text-ios-secondary leading-relaxed">
                Settings are synced instantly across your account. Changes to income or goals will immediately recalculate your remaining daily burn rate.
              </p>
            </div>
            
          </div>
        </div>

        <div className="mt-2 p-8 liquid-glass rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#007aff]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-150" />
          <div className="flex gap-6 relative z-10">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 h-fit rounded-[22px] text-[#007aff] shadow-sm border border-white/20">
              <Info size={26} />
            </div>
            <div>
              <h5 className="text-[18px] font-black text-ios-primary/80 mb-2">计划</h5>
              <p className="text-[14px] font-medium text-ios-secondary leading-relaxed">
                对于每个月11号，你需要往里面输入当月的收入和储蓄目标，目标里需要加上房租预留，剩下的就是你可以自由支配的钱了。
              </p>
            </div>
            
          </div>
        </div>

        <div className="mt-24 pb-12 flex flex-col items-center gap-2 opacity-10">
           <div className="h-0.5 w-12 bg-ios-primary rounded-full mb-2" />
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ios-primary">System OS 2.0.4</span>
        </div>

      </section>
      
      <SafeArea position='bottom' />
    </div>
  )
}

export default SettingsPage
