import React from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const RequireAuth = ({ children }) => {
  const { user, authReady } = useApp()

  if (!authReady) {
    return (
      <div className="min-h-screen p-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-ios-primary/5 rounded-full" />
        <div className="h-64 bg-ios-primary/5 rounded-[32px]" />
        <div className="h-20 bg-ios-primary/5 rounded-[28px]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default RequireAuth


