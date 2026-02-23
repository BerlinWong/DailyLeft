import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Home, BarChart2, Settings, Mic, MicOff, X, Menu } from 'lucide-react'
import { useVoiceSubmit } from '../hooks/useVoiceSubmit'

const tabs = [
  { key: '/',         title: 'Today',     icon: <Home size={20} /> },
  { key: '/stats',    title: 'Analytics', icon: <BarChart2 size={20} /> },
  { key: '/settings', title: 'System',    icon: <Settings size={20} /> },
]

const BALL  = 52
const THRESH = 8

const loadPos = (key, def) => {
  try {
    const s = localStorage.getItem(key)
    if (s) return JSON.parse(s)
  } catch {}
  return def
}

/** Shared logic for a draggable fixed ball. Returns pos + pointer handlers. */
const useDraggableBall = (storageKey, defaultPos) => {
  const [pos, setPos]   = useState(() => loadPos(storageKey, defaultPos))
  const posRef          = useRef(pos)
  useEffect(() => { posRef.current = pos }, [pos])

  const drag = useRef({ on: false, moved: false, cx0: 0, cy0: 0, bx0: 0, by0: 0 })

  const onDown = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { on: true, moved: false, cx0: e.clientX, cy0: e.clientY, bx0: posRef.current.x, by0: posRef.current.y }
  }, [])

  const onMove = useCallback((e) => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.cx0
    const dy = e.clientY - drag.current.cy0
    if (!drag.current.moved && (Math.abs(dx) > THRESH || Math.abs(dy) > THRESH)) drag.current.moved = true
    if (drag.current.moved) {
      setPos({
        x: Math.max(8, Math.min(window.innerWidth  - BALL - 8, drag.current.bx0 + dx)),
        y: Math.max(8, Math.min(window.innerHeight - BALL - 8, drag.current.by0 + dy)),
      })
    }
  }, [])

  // Returns whether this pointer-up was a tap (not a drag)
  const onUp = useCallback((e) => {
    drag.current.on = false
    const wasDrag = drag.current.moved
    if (wasDrag) {
      const snapX = posRef.current.x < window.innerWidth / 2 - BALL / 2
        ? 16 : window.innerWidth - BALL - 16
      const snapped = { x: snapX, y: posRef.current.y }
      setPos(snapped)
      localStorage.setItem(storageKey, JSON.stringify(snapped))
    }
    return !wasDrag // true = was a tap
  }, [storageKey])

  return { pos, onDown, onMove, onUp }
}

// ─────────────────────────────────────────────

const Layout = () => {
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isListening, isProcessing, toggleListening } = useVoiceSubmit()

  // Close menu on nav
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Voice ball: bottom-right, Menu ball: bottom-left — diagonal prevents overlap when menu expands
  const voice = useDraggableBall('ball-voice', {
    x: window.innerWidth - BALL - 20,
    y: window.innerHeight - BALL - 24,
  })
  const menu = useDraggableBall('ball-menu', {
    x: 20,
    y: window.innerHeight - BALL - 24,
  })

  const noCtx = useCallback((e) => e.preventDefault(), [])

  const handleVoiceUp = useCallback((e) => {
    const isTap = voice.onUp(e)
    if (isTap && !isProcessing) toggleListening()
  }, [voice, isProcessing, toggleListening])

  const handleMenuUp = useCallback((e) => {
    const isTap = menu.onUp(e)
    if (isTap) setMenuOpen((p) => !p)
  }, [menu])

  const menuOnRight = menu.pos.x >= window.innerWidth / 2 - BALL

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Scrollable main content — min-h-0 critical for iOS Safari */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </div>

      {/* Backdrop closes menu (conditional render — no invisible fixed layer when closed) */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
        />
      )}

      {/* ── Voice Ball ── */}
      <div
        className="fixed z-50"
        style={{ left: voice.pos.x, top: voice.pos.y, width: BALL, height: BALL }}
      >
        {/* Ripple when active */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#ff3b30]/30 animate-ping pointer-events-none" />
            <div className="absolute -inset-3 rounded-full bg-[#ff3b30]/10 animate-ping [animation-delay:220ms] pointer-events-none" />
          </>
        )}

        <button
          onPointerDown={voice.onDown}
          onPointerMove={voice.onMove}
          onPointerUp={handleVoiceUp}
          onPointerCancel={voice.onUp}
          onContextMenu={noCtx}
          disabled={isProcessing}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'grab' }}
          className={`relative w-full h-full rounded-full flex items-center justify-center select-none
            transition-all duration-300 shadow-[0_6px_24px_rgba(0,0,0,0.2)]
            ${isListening
              ? 'bg-[#ff3b30] shadow-[0_6px_24px_rgba(255,59,48,0.4)] scale-110'
              : isProcessing
                ? 'bg-[#8e8e93] opacity-70'
                : 'bg-[#007aff] shadow-[0_6px_24px_rgba(0,122,255,0.35)]'}`}
        >
          {isProcessing
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : isListening
              ? <MicOff size={22} className="text-white" strokeWidth={2.5} />
              : <Mic    size={22} className="text-white" strokeWidth={2.5} />}
        </button>

        {isListening && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
            <span className="text-[9px] font-black text-[#ff3b30] uppercase tracking-[0.2em] animate-pulse">
              录音中…
            </span>
          </div>
        )}
      </div>

      {/* ── Menu Ball ── */}
      <div
        className="fixed z-50"
        style={{ left: menu.pos.x, top: menu.pos.y, width: BALL, height: BALL }}
      >
        {/* Expanded nav panel — above ball */}
        {menuOpen && (
          <div
            className={`absolute bottom-[calc(100%+12px)] flex flex-col gap-2.5 animate-fluid
              ${menuOnRight ? 'right-0 items-end' : 'left-0 items-start'}`}
          >
            {[...tabs].reverse().map((tab) => {
              const active = pathname === tab.key
              return (
                <div
                  key={tab.key}
                  className={`flex items-center gap-3 ${menuOnRight ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap
                    ${active ? 'text-[#007aff]' : 'text-ios-secondary'}`}>
                    {tab.title}
                  </span>
                  <button
                    onClick={() => navigate(tab.key)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center
                      shadow-md active:scale-90 transition-all duration-200
                      ${active
                        ? 'bg-[#007aff] text-white shadow-[0_6px_20px_rgba(0,122,255,0.35)]'
                        : 'liquid-glass text-ios-secondary'}`}
                  >
                    {React.cloneElement(tab.icon, { strokeWidth: active ? 2.5 : 2 })}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <button
          onPointerDown={menu.onDown}
          onPointerMove={menu.onMove}
          onPointerUp={handleMenuUp}
          onPointerCancel={menu.onUp}
          onContextMenu={noCtx}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'grab' }}
          className={`w-full h-full rounded-full flex items-center justify-center select-none
            transition-all duration-500 shadow-[0_6px_24px_rgba(0,0,0,0.15)]
            ${menuOpen ? 'liquid-glass' : 'bg-white/90 dark:bg-[#2c2c2e]'}`}
        >
          {menuOpen
            ? <X    size={20} strokeWidth={2.5} className="text-ios-primary" />
            : React.cloneElement(
                tabs.find(t => t.key === pathname)?.icon || tabs[0].icon,
                { strokeWidth: 2.5, className: 'text-ios-primary dark:text-white' }
              )}
        </button>
      </div>
    </div>
  )
}

export default Layout
