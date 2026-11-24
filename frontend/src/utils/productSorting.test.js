import { compareInStockFirst, sortInStockFirst } from './productSorting';

describe('in-stock product ordering', () => {
  it('places in-stock products before out-of-stock products and preserves ties', () => {
    const products = [
      { id: 1, stock_quantity: 0 },
      { id: 2, stock_quantity: '4' },
      { id: 3, stock_quantity: null },
      { id: 4, stock_quantity: 2 },
    ];

    expect(sortInStockFirst(products).map(({ id }) => id)).toEqual([2, 4, 1, 3]);
    expect(products.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
    expect(compareInStockFirst(products[1], products[3])).toBe(0);
  });
});
