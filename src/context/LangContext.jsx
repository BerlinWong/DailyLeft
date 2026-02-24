import React, { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext()

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('zh') // default Chinese

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'en' || stored === 'zh') {
      setLang(stored)
    }
  }, [])

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh'
      localStorage.setItem('lang', next)
      return next
    })
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
