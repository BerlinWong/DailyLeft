import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Home, BarChart2, Settings, Mic, X } from 'lucide-react'
import { useVoiceSubmit } from '../hooks/useVoiceSubmit'

const tabs = [
  { key: '/',         title: 'Today',     icon: <Home size={22} /> },
  { key: '/stats',    title: 'Analytics', icon: <BarChart2 size={22} /> },
  { key: '/settings', title: 'System',    icon: <Settings size={22} /> },
]

const LONG_PRESS_MS = 250 // threshold to distinguish tap vs long-press

const Layout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { isListening, isProcessing, startListening, stopAndSubmit } = useVoiceSubmit()

  // Long-press detection for toggle button
  const longPressTimerRef = useRef(null)
  const isLongPressRef    = useRef(false)

  // Auto-close when route changes
  useEffect(() => { setIsOpen(false) }, [pathname])

  // ── Mic button inside panel (long press) ──
  const preventCtxMenu = useCallback((e) => e.preventDefault(), [])

  const handleMicPointerDown = useCallback((e) => {
    e.preventDefault()
    startListening()
  }, [startListening])

  const handleMicPointerUp = useCallback((e) => {
    e.preventDefault()
    stopAndSubmit()
  }, [stopAndSubmit])

  const handleMicPointerLeave = useCallback(() => {
    if (isListening) stopAndSubmit()
  }, [isListening, stopAndSubmit])

  // ── Toggle button: short-tap = open/close, long-press = voice ──
  const handleTogglePointerDown = useCallback((e) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      setIsOpen(false) // close panel while recording
      startListening()
    }, LONG_PRESS_MS)
  }, [startListening])

  const handleTogglePointerUp = useCallback((e) => {
    clearTimeout(longPressTimerRef.current)
    if (isLongPressRef.current) {
      // Was a long-press — stop and submit
      stopAndSubmit()
    } else {
      // Was a short tap — toggle nav
      setIsOpen((p) => !p)
    }
  }, [stopAndSubmit])

  const handleTogglePointerLeave = useCallback(() => {
    clearTimeout(longPressTimerRef.current)
    if (isLongPressRef.current && isListening) {
      stopAndSubmit()
    }
  }, [isListening, stopAndSubmit])

  const currentTab = tabs.find((t) => t.key === pathname) || tabs[0]
  const navTabs = [...tabs].reverse()

  // Determine toggle button visual state
  const toggleIsRecording = isListening && isLongPressRef.current

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 transition-all duration-300
          ${isOpen
            ? 'bg-black/10 backdrop-blur-[1px] pointer-events-auto'
            : 'pointer-events-none opacity-0'}`}
      />

      {/* Floating Nav — bottom-right */}
      <div className="fixed bottom-10 right-6 z-50 flex flex-col items-end gap-3">

        {/* ── Expanded Panel ── */}
        <div
          aria-hidden={!isOpen}
          className={`flex flex-col items-end gap-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-6 pointer-events-none'}`}
        >
          {/* Mic button (in panel) */}
          <div className="flex items-center gap-3">
            {isListening && (
              <span className="text-[10px] font-black text-[#ff3b30] uppercase tracking-[0.2em] whitespace-nowrap animate-pulse">
                Listening…
              </span>
            )}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-[#ff3b30]/25 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-[#ff3b30]/10 animate-ping [animation-delay:200ms]" />
                </>
              )}
              <button
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerLeave={handleMicPointerLeave}
                onContextMenu={preventCtxMenu}
                disabled={isProcessing}
                style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center
                  shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 select-none
                  ${isListening   ? 'bg-[#ff3b30] scale-110 shadow-[0_8px_24px_rgba(255,59,48,0.4)]'
                  : isProcessing  ? 'bg-[#8e8e93] scale-95 opacity-70'
                  :                  'bg-[#007aff] hover:scale-105 active:scale-95'}`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mic size={26} className="text-white pointer-events-none" strokeWidth={isListening ? 3 : 2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-8 h-px bg-ios-secondary/20 mr-3" />

          {/* Tab items with stagger */}
          {navTabs.map((tab, i) => {
            const active = pathname === tab.key
            return (
              <div
                key={tab.key}
                className="flex items-center gap-3"
                style={{
                  transitionDelay: isOpen ? `${i * 45}ms` : '0ms',
                  transform: isOpen ? 'translateY(0)' : 'translateY(14px)',
                  opacity: isOpen ? 1 : 0,
                  transition: 'transform 0.45s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease',
                }}
              >
                <span className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-300
                  ${active ? 'text-[#007aff]' : 'text-ios-secondary'}`}>
                  {tab.title}
                </span>
                <button
                  onClick={() => navigate(tab.key)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center
                    shadow-md active:scale-90 transition-all duration-200
                    ${active
                      ? 'bg-[#007aff] text-white shadow-[0_6px_20px_rgba(0,122,255,0.35)]'
                      : 'liquid-glass text-ios-secondary hover:text-ios-primary'}`}
                >
                  {React.cloneElement(tab.icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Toggle Button (tap = open/close | long-press = voice) ── */}
        <div className="relative">
          {/* Recording ripple on toggle */}
          {toggleIsRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-[#ff3b30]/25 animate-ping" />
              <div className="absolute -inset-2 rounded-full bg-[#ff3b30]/10 animate-ping [animation-delay:200ms]" />
            </>
          )}
          <button
            onPointerDown={handleTogglePointerDown}
            onPointerUp={handleTogglePointerUp}
            onPointerLeave={handleTogglePointerLeave}
            onContextMenu={preventCtxMenu}
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center
              shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-all duration-500 active:scale-90 select-none
              ${toggleIsRecording
                ? 'bg-[#ff3b30] scale-110 shadow-[0_8px_24px_rgba(255,59,48,0.4)]'
                : isOpen
                  ? 'liquid-glass text-ios-primary'
                  : 'bg-[#007aff] text-white shadow-[0_8px_24px_rgba(0,122,255,0.35)]'}`}
          >
            {isOpen && !toggleIsRecording
              ? <X size={22} strokeWidth={2.5} className="text-ios-primary" />
              : toggleIsRecording
                ? <Mic size={24} className="text-white pointer-events-none" strokeWidth={3} />
                : React.cloneElement(currentTab.icon, { size: 22, strokeWidth: 2.5, className: 'text-white' })}
          </button>
        </div>

        {/* Long-press hint label under toggle */}
        {toggleIsRecording && (
          <span className="text-[10px] font-black text-[#ff3b30] uppercase tracking-[0.2em] whitespace-nowrap -mt-1 animate-pulse">
            Listening…
          </span>
        )}
      </div>
    </div>
  )
}

export default Layout
