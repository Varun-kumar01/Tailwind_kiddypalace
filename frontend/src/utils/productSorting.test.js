import { compareProductsForListing, sortProductsForListing } from './productSorting';

describe('product listing order', () => {
  it('orders in-stock products with ages, then those without ages, then out-of-stock products', () => {
    const products = [
      { id: 1, stock_quantity: 0, age_range: '3-5 Years' },
      { id: 2, stock_quantity: '4', age_range: '' },
      { id: 3, stock_quantity: null, age_range: null },
      { id: 4, stock_quantity: 2, age_range: '5-7 Years' },
      { id: 5, stock_quantity: 1, age_range: '0' },
    ];

    expect(sortProductsForListing(products).map(({ id }) => id)).toEqual([4, 2, 5, 1, 3]);
    expect(products.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
    expect(compareProductsForListing(products[1], products[4])).toBe(0);
  });
});
