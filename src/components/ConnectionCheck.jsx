import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const ConnectionCheck = () => {
  const [status, setStatus] = useState('Checking connection...')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const check = async () => {
      try {
        const { data, error, status: httpStatus } = await supabase
          .from('monthly_settings')
          .select('*')
          .limit(1)
        
        if (error) {
          setStatus('❌ Connection Failed')
          setDetails(`Error: ${error.message} (HTTP ${httpStatus})`)
          console.error('Supabase error:', error)
        } else {
          setStatus('✅ Connected Successfully')
          setDetails('Successfully reached the database. monthly_settings table is accessible.')
        }
      } catch (err) {
        setStatus('❌ Unexpected Error')
        setDetails(err.message)
      }
    }
    check()
  }, [])

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', margin: '16px', border: '1px solid #eee' }}>
      <h3 style={{ marginTop: 0 }}>Supabase Connection Test</h3>
      <div style={{ fontWeight: 'bold', color: status.includes('✅') ? '#10b981' : '#ef4444' }}>{status}</div>
      <p style={{ fontSize: '13px', color: '#666', wordBreak: 'break-all' }}>{details}</p>
      <div style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
        <strong>Current Config:</strong><br/>
        URL: {import.meta.env.VITE_SUPABASE_URL}<br/>
        Key length: {import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0} chars
      </div>
    </div>
  )
}

export default ConnectionCheck
