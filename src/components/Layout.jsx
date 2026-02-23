import React from 'react'
import { TabBar } from 'antd-mobile'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Home, PieChart, Settings } from 'lucide-react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location

  const tabs = [
    { key: '/', title: 'Today', icon: <Home size={22} /> },
    { key: '/stats', title: 'Stats', icon: <PieChart size={22} /> },
    { key: '/settings', title: 'Plan', icon: <Settings size={22} /> },
  ]

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 glass pb-safe border-t border-slate-200">
        <TabBar activeKey={pathname} onChange={value => navigate(value)}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  )
}

export default Layout
