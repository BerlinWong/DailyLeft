/**
 * Calculate the daily available budget.
 * Formula: (Income - Savings Goal - Total Expenses) / Remaining Days in Month.
 * Returns a negative number when over-budget.
 */
export const calculateDailyBudget = (income, savingsGoal, totalExpenses, remainingDays) => {
  if (remainingDays <= 0) return 0
  const surplus = income - savingsGoal - totalExpenses
  return parseFloat((surplus / remainingDays).toFixed(2))
}
