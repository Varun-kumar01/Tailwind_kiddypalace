export const compareProductsForListing = (a, b) => {
  const aInStock = Number(a.stock_quantity) > 0;
  const bInStock = Number(b.stock_quantity) > 0;
  const stockOrder = Number(bInStock) - Number(aInStock);
  if (stockOrder !== 0) return stockOrder;

  const aHasAge = !['', '0'].includes(String(a.age_range || '').trim());
  const bHasAge = !['', '0'].includes(String(b.age_range || '').trim());
  return Number(bHasAge) - Number(aHasAge);
};

export const sortProductsForListing = (products) => [...products].sort(compareProductsForListing);
