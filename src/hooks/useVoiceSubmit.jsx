import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Toast } from 'antd-mobile'
import { parseTransaction } from '../services/aiService'
import { supabase } from '../utils/supabase'
import { useApp } from '../context/AppContext'

export const useVoiceSubmit = () => {
  const { refresh, user } = useApp()
  const navigate = useNavigate()
  const [isListening, setIsListening]   = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef  = useRef(null)
  const transcriptRef   = useRef('')

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      Toast.show({ content: '当前浏览器不支持语音识别' })
      return
    }
    transcriptRef.current = ''

    const rec = new SpeechRecognition()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = true

    rec.onstart  = () => setIsListening(true)
    rec.onerror  = (e) => {
      if (e.error !== 'aborted') Toast.show({ content: `麦克风: ${e.error}` })
      setIsListening(false)
    }
    rec.onresult = (e) => {
      transcriptRef.current = Array.from(e.results).map((r) => r[0].transcript).join('')
    }
    rec.onend = () => setIsListening(false)

    recognitionRef.current = rec
    rec.start()
  }, [])

  const stopAndSubmit = useCallback(async () => {
    recognitionRef.current?.stop()
    setIsListening(false)

    // Give browser a moment to fire the last onresult before we read it
    await new Promise((r) => setTimeout(r, 200))

    const text = transcriptRef.current.trim()
    if (!text) {
      Toast.show({ content: '没有听到内容，再试试 🎤' })
      return
    }

    setIsProcessing(true)
    const toast = Toast.show({ icon: 'loading', content: '解析中…', duration: 0, maskClickable: false })

    try {
      const parsed = await parseTransaction(text)
      toast.close()

      if (!parsed.amount || parsed.amount <= 0) {
        Toast.show({ content: '🤔 没找到金额，试试「外卖花了35」', duration: 3000 })
        return
      }

      Modal.confirm({
        title: <span className="text-ios-primary font-bold">确认记账？</span>,
        content: (
          <div className="py-4">
            <div className="liquid-glass p-6 rounded-[28px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#007aff]/10 rounded-full blur-2xl -mr-6 -mt-6" />
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">金额</span>
                <span className="text-4xl font-bold text-[#007aff] tracking-tight">¥{parsed.amount}</span>
              </div>
              <div className="mt-5 flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">分类 / 描述</span>
                <span className="text-base font-medium text-ios-primary/80">{parsed.description || parsed.category}</span>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">原始语音</span>
                <p className="text-sm text-ios-secondary mt-1 italic">"{text}"</p>
              </div>
            </div>
          </div>
        ),
        confirmText: <span className="font-bold">保存</span>,
        cancelText: '取消',
        onConfirm: async () => {
          if (!user) {
            Toast.show({ content: '请先登录' })
            return
          }
          const { error } = await supabase.from('transactions').insert([{
            user_id: user.id,
            amount: parsed.amount,
            category: parsed.category,
            description: parsed.description,
            original_text: text,
            type: 'expense',
            date: parsed.date,
          }])
          if (error) throw error
          Toast.show({ content: '已记录 ✓', icon: 'success' })
          refresh()
          navigate('/')
        },
      })
    } catch {
      toast.close()
      Toast.show({ content: '解析失败，再试一次', icon: 'fail' })
    } finally {
      setIsProcessing(false)
    }
  }, [refresh, navigate, user])

  /** Single-tap toggle: first tap = start, second tap = stop + submit */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopAndSubmit()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopAndSubmit])

  return { isListening, isProcessing, toggleListening }
}
