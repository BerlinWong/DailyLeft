import dayjs from 'dayjs'

export const getCurrentMonth = () => dayjs().format('YYYY-MM')

export const getDaysInMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  return new Date(year, month, 0).getDate()
}

export const getRemainingDaysInMonth = () => {
  const now = dayjs()
  const endOfMonth = now.endOf('month')
  return endOfMonth.diff(now, 'day') + 1 // Include today
}

export const formatISO = (date = new Date()) => dayjs(date).toISOString()
