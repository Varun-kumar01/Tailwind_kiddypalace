export const compareInStockFirst = (a, b) => {
  const aInStock = Number(a.stock_quantity) > 0;
  const bInStock = Number(b.stock_quantity) > 0;

  return Number(bInStock) - Number(aInStock);
};

export const sortInStockFirst = (products) => [...products].sort(compareInStockFirst);
