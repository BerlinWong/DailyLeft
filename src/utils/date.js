import dayjs from 'dayjs'

export const getCurrentMonth = () => dayjs().format('YYYY-MM')

export const getDaysInMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  return new Date(year, month, 0).getDate()
}

// export const getRemainingDaysInMonth = () => {
//   const now = dayjs()
//   const endOfMonth = now.endOf('month')
//   return endOfMonth.diff(now, 'day') + 1 // Include today
// }
export const getRemainingDaysInMonth = () => {
  const now = dayjs()
  const cycleStartDay = 10 // 设定每月10号为新周期开始
  
  let endOfCycle

  // 如果今天是10号之前（例如5号），那截止日期是本月9号
  if (now.date() < cycleStartDay) {
    endOfCycle = now.date(cycleStartDay - 1).endOf('day')
  } else {
    // 如果今天是10号之后（含10号），那截止日期是下个月9号
    endOfCycle = now.add(1, 'month').date(cycleStartDay - 1).endOf('day')
  }

  // 计算天数差，+1 代表包含今天
  return endOfCycle.diff(now, 'day') + 1
}

export const formatISO = (date = new Date()) => dayjs(date).toISOString()
