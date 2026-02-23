/**
 * Calculate the daily available budget.
 * Formula: (Income - Savings Goal - Total Expenses This Month) / Remaining Days in Month.
 */
export const calculateDailyBudget = (income, savingsGoal, totalExpenses, remainingDays) => {
  const surplus = income - savingsGoal - totalExpenses
  if (surplus <= 0) return 0
  return (surplus / remainingDays).toFixed(2)
}
