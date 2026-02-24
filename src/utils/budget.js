/**
 * 预算工具
 */

export const calculateMonthlyAvailable = (income, savingsGoal, totalExpenses) => {
  return Number(income || 0) - Number(savingsGoal || 0) - Number(totalExpenses || 0)
}

/**
 * 今日“固定日均额度”：只用“截至昨天的支出”来计算，所以不会被今天的交易实时重算
 */
export const calculateDailyAllowanceSnapshot = (income, savingsGoal, expensesBeforeToday, remainingDaysIncludingToday) => {
  const days = Number(remainingDaysIncludingToday || 0)
  if (days <= 0) return 0
  const surplusAtStartOfDay = Number(income || 0) - Number(savingsGoal || 0) - Number(expensesBeforeToday || 0)
  return Number((surplusAtStartOfDay / days).toFixed(2))
}

/**
 * 周期日均额度（从明天开始）：用“包含今日全部支出后的剩余金额”均分剩余天数（不含今天）
 */
export const calculateCycleDailyAllowance = (monthlyAvailable, remainingDaysIncludingToday) => {
  const days = Number(remainingDaysIncludingToday || 0)
  if (days <= 1) return 0
  return Number((Number(monthlyAvailable || 0) / (days - 1)).toFixed(2))
}
