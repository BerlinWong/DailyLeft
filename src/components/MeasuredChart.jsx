import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Recharts v3 在某些布局/首次渲染时可能拿到 width/height = -1，导致直接抛错并白屏。
 * 这里用 ResizeObserver 先拿到真实尺寸 (>0) 后再渲染图表，从根源避免该问题。
 */
const MeasuredChart = ({ className = '', style, children }) => {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }

    update()

    // ResizeObserver (preferred)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => update())
      ro.observe(el)
      return () => ro.disconnect()
    }

    // Fallback: window resize
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div ref={ref} className={className} style={style}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  )
}

export default MeasuredChart


