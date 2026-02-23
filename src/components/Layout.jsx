import React from 'react'
import { TabBar } from 'antd-mobile'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Home, BarChart, Settings } from 'lucide-react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location

  const tabs = [
    { key: '/', title: 'Today', icon: <Home size={22} /> },
    { key: '/stats', title: 'Analytics', icon: <BarChart size={22} /> },
    { key: '/settings', title: 'System', icon: <Settings size={22} /> },
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8">
        {/* The Liquid Container */}
        <div className="relative h-[80px] w-full max-w-lg mx-auto liquid-glass rounded-[32px] flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Subtle Internal Glow */}
          <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none" />
          
          {tabs.map((item) => {
            const active = pathname === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className="relative flex items-center justify-center w-16 h-16 transition-all duration-300 active:scale-90"
              >
                {/* Fluid Active Indicator (The Blob) */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${active ? 'bg-[#007aff] scale-100 opacity-100 rotate-0' : 'bg-[#007aff]/0 scale-0 opacity-0 rotate-45'} shadow-[0_8px_20px_rgba(0,122,255,0.3)]`} />
                
                {/* Icon Container */}
                <div className={`relative z-10 transition-colors duration-500 ${active ? 'text-white' : 'text-ios-secondary'}`}>
                  {React.cloneElement(item.icon, { 
                    size: 28, 
                    strokeWidth: active ? 2.5 : 2 
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Layout
