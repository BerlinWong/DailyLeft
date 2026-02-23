import { useRef, useState, useCallback } from 'react'
import { Modal, Toast } from 'antd-mobile'
import { parseTransaction } from '../services/aiService'
import { supabase } from '../utils/supabase'
import { useApp } from '../context/AppContext'

/**
 * Encapsulates the press-and-hold voice → AI parse → confirm → save flow.
 */
export const useVoiceSubmit = () => {
  const { refresh } = useApp()
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const releaseCalledRef = useRef(false)

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      Toast.show({ content: 'Speech recognition not supported on this browser' })
      return
    }

    releaseCalledRef.current = false
    transcriptRef.current = ''

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      transcriptRef.current = transcript
    }

    recognition.onerror = (e) => {
      // 'aborted' is expected when we call stop() ourselves
      if (e.error !== 'aborted') {
        Toast.show({ content: `Mic error: ${e.error}` })
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // If the recognition ended by itself (silence timeout) before user released,
      // still trigger the submit if we have a transcript.
      if (!releaseCalledRef.current && transcriptRef.current.trim()) {
        handleSubmit()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    const text = transcriptRef.current.trim()
    if (!text) {
      Toast.show({ content: 'Nothing captured — try again', icon: 'fail' })
      return
    }

    setIsProcessing(true)
    const toast = Toast.show({
      icon: 'loading',
      content: 'Processing...',
      duration: 0,
      maskClickable: false,
    })

    try {
      const parsed = await parseTransaction(text)
      toast.close()

      Modal.confirm({
        title: <span className="text-ios-primary font-bold">Commit Transaction?</span>,
        content: (
          <div className="py-4">
            <div className="liquid-glass p-6 rounded-[28px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#007aff]/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">
                  Validated Amount
                </span>
                <span className="text-4xl font-bold text-[#007aff] tracking-tight">
                  ¥{parsed.amount}
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">
                  Context
                </span>
                <span className="text-lg font-medium text-ios-primary/80 leading-snug">
                  {parsed.description || parsed.category}
                </span>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-[10px] font-bold text-ios-secondary uppercase tracking-[0.2em]">
                  Original
                </span>
                <p className="text-sm text-ios-secondary mt-1 italic">"{text}"</p>
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
            date: parsed.date,
          }])
          if (error) throw error
          Toast.show({ content: 'Record Synced', icon: 'success' })
          refresh()
        },
      })
    } catch {
      toast.close()
      Toast.show({ content: 'Parse failed — try again', icon: 'fail' })
    } finally {
      setIsProcessing(false)
    }
  }, [refresh])

  const stopAndSubmit = useCallback(() => {
    releaseCalledRef.current = true
    recognitionRef.current?.stop()
    setIsListening(false)
    // Small delay to let the onresult fire before we read transcriptRef
    setTimeout(() => handleSubmit(), 150)
  }, [handleSubmit])

  return { isListening, isProcessing, startListening, stopAndSubmit }
}
