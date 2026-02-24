import dayjs from 'dayjs'

// 预算周期：每月 11 号 00:00 开始，到下个月 11 号 00:00 结束（左闭右开）
export const CYCLE_START_DAY = 11

export const getCurrentMonth = () => dayjs().format('YYYY-MM')

/**
 * 返回当前所属周期的 key（用于 monthly_settings.month），格式 'YYYY-MM'，
 * 取“周期起始日所在月份”，例如 2/24 -> '2026-02'，2/05 -> '2026-01'
 */
export const getCurrentCycleKey = (date = dayjs(), cycleStartDay = CYCLE_START_DAY) => {
  return getCycleStart(date, cycleStartDay).format('YYYY-MM')
}

export const getDaysInMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  return new Date(year, month, 0).getDate()
}

export const getCycleStart = (date = dayjs(), cycleStartDay = CYCLE_START_DAY) => {
  const d = dayjs(date)
  if (d.date() >= cycleStartDay) {
    return d.date(cycleStartDay).startOf('day')
  }
  return d.subtract(1, 'month').date(cycleStartDay).startOf('day')
}

export const getNextCycleStart = (date = dayjs(), cycleStartDay = CYCLE_START_DAY) => {
  return getCycleStart(date, cycleStartDay).add(1, 'month')
}

/**
 * 返回当前周期剩余天数（包含今天），例如 nextCycleStart=明天 00:00，则返回 1
 * 注意：这里使用 startOf('day')，避免“白天时间变化导致天数抖动”
 */
export const getRemainingDaysInCycle = (date = dayjs(), cycleStartDay = CYCLE_START_DAY) => {
  const todayStart = dayjs(date).startOf('day')
  const nextCycleStart = getNextCycleStart(todayStart, cycleStartDay)
  return Math.max(nextCycleStart.diff(todayStart, 'day'), 0)
}

export const formatISO = (date = new Date()) => dayjs(date).toISOString()
