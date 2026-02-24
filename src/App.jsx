import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd-mobile'
import enUS from 'antd-mobile/es/locales/en-US'
import { AppProvider } from './context/AppContext'
import { LangProvider } from './context/LangContext'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import AuthPage from './pages/AuthPage'
import './index.css'

function App() {
  return (
    <ConfigProvider locale={enUS}>
      <AppProvider>
        {/* language context wraps the whole app */}
        <LangProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<HomePage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </LangProvider>
      </AppProvider>
    </ConfigProvider>
  )
}

export default App
