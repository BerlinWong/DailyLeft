import React, { useEffect, useMemo, useState } from 'react'
import { SafeArea, Form, Input, Toast } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LangContext'
import { t } from '../i18n'

const AuthPage = () => {
  const navigate = useNavigate()
  const { user, authReady, login, register } = useApp()
  const { lang } = useLang()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const inviteCodeEnv = useMemo(() => (import.meta.env.VITE_INVITE_CODE || '').trim(), [])

  useEffect(() => {
    if (authReady && user) navigate('/', { replace: true })
  }, [authReady, user, navigate])

  const onSubmit = async (values) => {
    const username = String(values.username || '').trim()
    const password = String(values.password || '')
    const inviteCode = String(values.invite_code || '').trim()

    if (!username || !password) {
      Toast.show({ content: t(lang,'enter_username_password') })
      return
    }

    // 约束：用户名不允许包含 '@'
    if (username.includes('@')) {
      Toast.show({ content: t(lang,'username_no_at') })
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'register') {
        if (!inviteCodeEnv) {
          Toast.show({ content: t(lang,'invite_code_required') })
          return
        }
        if (inviteCode !== inviteCodeEnv) {
          Toast.show({ content: t(lang,'invite_code_wrong') })
          return
        }

        // attempt to create a record in our own users table
        await register(username.toLowerCase(), password)
        Toast.show({ content: t(lang,'registered_and_logged') })
        navigate('/', { replace: true })
        return
      }

      await login(username.toLowerCase(), password)
      Toast.show({ content: t(lang,'login_success') })
      navigate('/', { replace: true })
    } catch (e) {
      Toast.show({ content: e?.message || t(lang,'operation_failed') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen animate-fluid">
      <SafeArea position="top" />

      <header className="px-8 pt-12 mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-ios-primary">
          {mode === 'login' ? t(lang,'login') : t(lang,'register')}
        </h1>
        <p className="text-ios-secondary text-sm font-semibold mt-1 uppercase tracking-widest">
          {mode === 'login' ? 'Access Gate' : 'Invite Only'}
        </p>
      </header>

      <section className="px-6">
        <Form
          form={form}
          onFinish={onSubmit}
          className="!bg-transparent"
          footer={null}
        >
          <div className="liquid-glass rounded-[40px] p-8 space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[14px] font-bold text-ios-primary/70 pl-1">{t(lang,'username')}</label>
              <div className="bg-black/5 dark:bg-white/5 rounded-[28px] p-5 border border-white/10">
                <Form.Item name="username" noStyle>
                  <Input
                    placeholder={t(lang,'enter_username_password')}
                    className="bg-transparent border-none p-0 text-[17px] font-semibold text-ios-primary w-full"
                  />
                </Form.Item>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[14px] font-bold text-ios-primary/70 pl-1">{t(lang,'password')}</label>
              <div className="bg-black/5 dark:bg-white/5 rounded-[28px] p-5 border border-white/10">
                <Form.Item name="password" noStyle>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-transparent border-none p-0 text-[17px] font-semibold text-ios-primary w-full"
                  />
                </Form.Item>
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex flex-col gap-3">
                <label className="text-[14px] font-bold text-ios-primary/70 pl-1">邀请码</label>
                <div className="bg-black/5 dark:bg-white/5 rounded-[28px] p-5 border border-white/10">
                  <Form.Item name="invite_code" noStyle>
                    <Input
                      placeholder="请输入邀请码"
                      className="bg-transparent border-none p-0 text-[17px] font-semibold text-ios-primary w-full"
                    />
                  </Form.Item>
                </div>
                <p className="text-[12px] font-medium text-ios-secondary px-2">
                  注册需要邀请码（从环境变量 VITE_INVITE_CODE 校验）。
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 rounded-full bg-[#007aff] text-white font-black text-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-500 disabled:opacity-50"
            >
              {submitting ? t(lang,'processing') : mode === 'login' ? t(lang,'login') : t(lang,'register')}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'login' ? 'register' : 'login'))
                form.setFieldsValue({ password: '', invite_code: '' })
              }}
              className="w-full py-4 rounded-full bg-ios-primary/5 text-ios-primary font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </button>
          </div>
        </Form>
      </section>

      <SafeArea position="bottom" />
    </div>
  )
}

export default AuthPage


