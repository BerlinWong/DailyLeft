import React from 'react'
import { TabBar } from 'antd-mobile'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Home, BarChart, Settings } from 'lucide-react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location

  const tabs = [
    { key: '/', title: 'Home', icon: <Home size={22} /> },
    { key: '/stats', title: 'Activity', icon: <BarChart size={22} /> },
    { key: '/settings', title: 'Plan', icon: <Settings size={22} /> },
  ]

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#f1f3f4] pb-safe z-50">
        <TabBar activeKey={pathname} onChange={value => navigate(value)}>
          {tabs.map(item => (
            <TabBar.Item 
              key={item.key} 
              icon={active => (
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'scale-110' : ''}`}>
                  <div className={`px-5 py-1.5 rounded-full transition-colors ${active ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                    {React.cloneElement(item.icon, { 
                      size: 22, 
                      strokeWidth: active ? 2.5 : 2,
                    })}
                  </div>
                </div>
              )} 
              title={<span className={`text-[11px] font-medium tracking-tight ${pathname === item.key ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                {item.title}
              </span>} 
            />
          ))}
        </TabBar>
      </div>
    </div>
  )
}

export default Layout
