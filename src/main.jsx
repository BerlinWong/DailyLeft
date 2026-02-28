import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { SplashScreen } from '@capacitor/splash-screen'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 让开屏页在 Web 层加载完后自动消失（如果配置了自动隐藏，这层是双重保险）
SplashScreen.hide();
