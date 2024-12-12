// Function to format USD amount
export const formatUSD = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

export const isSignificantTrade = (trade: { amount: string; priceUsd: string }): boolean => {
  const amount = parseFloat(trade.amount);
  const price = parseFloat(trade.priceUsd);
  const totalValue = amount * price;
  return totalValue >= 1000;
};
