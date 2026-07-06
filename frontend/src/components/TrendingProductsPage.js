import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from "./config";

const TrendingProductsPage = () => {
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [cartQuantities, setCartQuantities] = useState({});
  const productRefs = useRef({});

  // Fetch trending products
  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  // Sync cart quantities whenever cartItems changes
  useEffect(() => {
    if (cartItems && Array.isArray(cartItems)) {
      const newQuantities = {};
      cartItems.forEach(item => {
        newQuantities[item.id] = item.quantity;
      });
      setCartQuantities(newQuantities);
    }
  }, [cartItems]);

  const fetchTrendingProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API_BASE_URL}/api/best-selling?limit=100&t=${Date.now()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        console.log("Loaded Trending Products:", data.products);
      } else {
        setMessage("No trending products found");
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching trending products:", err);
      setMessage("Error loading trending products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      setMessage('This product is out of stock');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    addToCart({ ...product, original_price: product.mrp || product.price }, 1);
  };

  // Apply sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === 'lowToHigh') return a.price - b.price;
    if (sortOrder === 'highToLow') return b.price - a.price;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-[#273c2e]">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="rounded-2xl bg-[#fff7eb] px-5 py-3 text-sm font-semibold text-[#273c2e] ring-1 ring-[#dccaaa]/45">
            Loading trending products...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#273c2e]">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 md:px-5">
        {/* Products Section - Full Width */}
        <section className="min-h-[600px]">
          <div className="sticky top-32 z-50 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#273c2e] sm:text-[1.7rem]">🔥 Trending Products (Best Sellers)</h1>

            {/* 🔹 Sort By Dropdown */}
            <div className="flex items-center gap-2 text-sm font-semibold text-[#273c2e]">
              <label>Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-xl border-2 border-[#ede6d9] bg-[#fff7eb] px-3 py-2 text-sm text-[#273c2e] transition focus:outline-none focus:ring-4 focus:ring-[#b69e6a]/20"
              >
                <option value="none">Most Popular</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-[#f5c2c7] bg-[#f8d7da] px-4 py-3 text-sm font-medium text-[#721c24]">
              {message}
            </div>
          )}

          {sortedProducts.length === 0 ? (
            <div className="rounded-2xl bg-[#fff7eb] px-4 py-12 text-center text-[#777] ring-1 ring-[#ede6d9]">
              <p>No trending products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  ref={(el) => (productRefs.current[product.id] = el)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.12)] min-h-[420px] flex flex-col"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative flex h-[180px] items-center justify-center bg-[#f7f7f7]">
                    {product.discount_percent > 0 && (
                      <div className="absolute right-2 top-2 z-[6] rounded-full bg-gradient-to-r from-[#f01c71] to-[#ff4b92] px-2 py-1 text-[11px] font-bold leading-none text-white shadow-[0_6px_16px_rgba(240,28,113,0.28)]">
                        {product.discount_percent}% OFF
                      </div>
                    )}

                    {(() => {
                      const raw = product.image_url || product.image || product.imageUrl || '';
                      let src = '';
                      if (raw && typeof raw === 'string') {
                        const trimmed = raw.trim();
                        if (trimmed.startsWith('http') || trimmed.startsWith('data:')) {
                          src = trimmed;
                        } else if (trimmed.startsWith('/')) {
                          src = `${API_BASE_URL}${trimmed}`;
                        } else if (trimmed !== '') {
                          src = `${API_BASE_URL}/${trimmed}`;
                        }
                      }

                      if (src) {
                        return (
                          <img
                            src={src}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-contain"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                          />
                        );
                      }

                      return (
                        <div className="text-center text-3xl text-[#999]">
                          <span>📦</span>
                          <p className="mt-1 text-xs">No Image</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#333]">{product.name}</h3>
                    <p className="hidden">{product.description}</p>
                    <div className="mt-auto flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {product.mrp && product.price && Number(product.mrp) > Number(product.price) ? (
                          <>
                            <span className="text-base font-bold text-black">
                              ₹{product.price}
                            </span>
                            <span className="text-sm text-[#777] line-through">
                              ₹{product.mrp}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-black">
                            ₹{product.price || product.mrp}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${product.stock_quantity > 0 ? 'bg-[#e8f1ff] text-[#2e79e3]' : 'bg-rose-50 text-rose-700'}`}>
                          {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </p>
                        {product.age_range && (
                          <p className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-[#fef3c7] text-[#b45309]">
                            {product.age_range}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 w-full h-[44px] flex items-center justify-center">
                        {cartQuantities[product.id] ? (
                          <div className="w-full flex items-center justify-between gap-1">
                            <div className="w-[45%] flex items-center justify-between gap-1 rounded-full border border-[#2e79e3] px-2 py-1 hover:bg-slate-100 transition">
                              <button
                                className="text-sm font-bold text-[#2e79e3] transition leading-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cartQuantities[product.id] <= 1) {
                                    removeFromCart(product.id);
                                  } else {
                                    updateQuantity(product.id, cartQuantities[product.id] - 1);
                                  }
                                }}
                              >
                                –
                              </button>
                              <span className="text-center text-xs font-bold text-[#2e79e3] min-w-[25px]">
                                {cartQuantities[product.id]}
                              </span>
                              <button
                                className="text-sm font-bold text-[#2e79e3] transition disabled:text-[#ccc] disabled:cursor-not-allowed leading-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cartQuantities[product.id] < product.stock_quantity) {
                                    updateQuantity(product.id, cartQuantities[product.id] + 1);
                                  }
                                }}
                                disabled={cartQuantities[product.id] >= product.stock_quantity}
                              >
                                +
                              </button>
                            </div>
                            <span className="w-[45%] text-xs font-semibold text-[#999] text-center" title={`Max: ${product.stock_quantity}`}>Max: {product.stock_quantity}</span>
                          </div>
                        ) : (
                          <button
                            className={`w-full h-full rounded-full border-2 px-3 py-2 text-xs font-bold transition sm:text-sm flex items-center justify-center ${
                              product.stock_quantity <= 0
                                ? 'cursor-not-allowed border-[#ccc] bg-[#ccc] text-white'
                                : 'border-[#2e79e3] bg-white text-[#2e79e3] hover:bg-[#2e79e3] hover:text-white hover:shadow-[0_6px_16px_rgba(46,121,227,0.35)]'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={product.stock_quantity <= 0}
                          >
                            {product.stock_quantity <= 0
                              ? 'Out of Stock'
                              : 'Add to Cart'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrendingProductsPage;
