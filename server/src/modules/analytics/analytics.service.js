const prisma = require('../../config/db');

exports.getCashFlow = async (userId, { startDate, endDate, period = 'month' }) => {
  // Use Prisma's native $queryRaw for optimized grouping by date parts in PostgreSQL
  const periodTrunc = period === 'year' ? 'year' : period === 'quarter' ? 'quarter' : 'month';
  
  const queryStartDate = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const queryEndDate = endDate ? new Date(endDate) : new Date();

  // Validate dates
  if (isNaN(queryStartDate.getTime()) || isNaN(queryEndDate.getTime())) {
    throw new Error('Invalid date parameters');
  }

  const result = await prisma.$queryRaw`
    SELECT 
      date_trunc(${periodTrunc}, "transactionDate") as "period",
      SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END) as "income",
      SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END) as "expense"
    FROM "Transaction"
    WHERE "userId" = ${userId} 
      AND "deletedAt" IS NULL
      AND "transactionDate" >= ${queryStartDate} 
      AND "transactionDate" <= ${queryEndDate}
    GROUP BY date_trunc(${periodTrunc}, "transactionDate")
    ORDER BY "period" ASC;
  `;

  // Prisma queryRaw returns Decimal objects, map them to numbers and strings
  return result.map(row => ({
    period: row.period,
    income: Number(row.income || 0),
    expense: Number(row.expense || 0),
    net: Number(row.income || 0) - Number(row.expense || 0)
  }));
};

exports.getCategoryBreakdown = async (userId, { startDate, endDate, accountId }) => {
  const queryStartDate = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const queryEndDate = endDate ? new Date(endDate) : new Date();

  const where = {
    userId,
    type: 'EXPENSE',
    deletedAt: null,
    transactionDate: {
      gte: queryStartDate,
      lte: queryEndDate
    },
    ...(accountId && { accountId })
  };

  const aggregations = await prisma.transaction.groupBy({
    by: ['categoryId'],
    _sum: { amount: true },
    where
  });

  // Fetch category details
  const categoryIds = aggregations.map(a => a.categoryId).filter(Boolean);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, type: true }
  });

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const breakdown = aggregations
    .filter(a => a.categoryId) // Ensure category exists
    .map(a => ({
      categoryId: a.categoryId,
      amount: Number(a._sum.amount || 0),
      category: categoryMap[a.categoryId]
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by largest expense

  const totalExpense = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // Add percentages
  return breakdown.map(item => ({
    ...item,
    percentage: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0
  }));
};
