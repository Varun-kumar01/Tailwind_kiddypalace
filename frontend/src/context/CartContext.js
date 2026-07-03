import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback, 
  useRef // ✅ <-- add this import
} from 'react';


const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [cartToast, setCartToast] = useState({ show: false, message: '' });
  const toastTimeoutRef = useRef(null);
  const prevUserIdRef = useRef(null);
  const hasLoadedCartRef = useRef(false);

  const getUserIdFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Prefer stable id field; fallback to email
      return parsed?.id ?? parsed?.userId ?? parsed?.email ?? null;
    } catch {
      return null;
    }
  };

  const getCartStorageKey = (userId) => {
    return userId ? `cart:${String(userId)}` : 'cart:guest';
  };

  // Determine current user at startup
  useEffect(() => {
    const userId = getUserIdFromLocalStorage();
    setCurrentUserId(userId);
  }, []);

  // Respond to user changes (custom event + storage event)
  useEffect(() => {
    const onUserChanged = () => {
      const userId = getUserIdFromLocalStorage();
      setCurrentUserId(userId);
    };

    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        onUserChanged();
      }
    };

    window.addEventListener('user-changed', onUserChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('user-changed', onUserChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Load cart when user changes
  useEffect(() => {
    if (prevUserIdRef.current === currentUserId) return;
    prevUserIdRef.current = currentUserId;

    const normalizeCart = (cartArray) => {
      return cartArray.map(item => ({
        id: item.id,
        name: item.name || '',
        price: Number(item.price) || 0,
        original_price: Number(item.original_price) || Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || item.image_url || item.imageUrl || '',
        image_url: item.image_url || item.image || item.imageUrl || '',
        description: item.description || '',
        age_range: item.age_range || '',
        stock_quantity: item.stock_quantity || 999,
      }));
    };

    const loadLocalCart = (key) => {
      try {
        const savedCart = localStorage.getItem(key);
        if (!savedCart) return [];
        const parsedCart = JSON.parse(savedCart);
        const cartArray = Array.isArray(parsedCart) ? parsedCart : [];
        return normalizeCart(cartArray);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return [];
      }
    };

    const mergeCarts = (baseCart, incomingCart) => {
      const merged = [...baseCart];
      incomingCart.forEach((item) => {
        const existing = merged.find((cartItem) => String(cartItem.id) === String(item.id));
        if (existing) {
          existing.quantity = Number(existing.quantity || 0) + Number(item.quantity || 0);
        } else {
          merged.push(item);
        }
      });
      return merged;
    };

    const loadCartForUser = async () => {
      if (!currentUserId) {
        setCartItems(loadLocalCart('cart:guest'));
        hasLoadedCartRef.current = true;
        return;
      }

      const userKey = getCartStorageKey(currentUserId);
      const localUserCart = loadLocalCart(userKey);
      const guestCart = loadLocalCart('cart:guest');
      const token = localStorage.getItem('token');

      if (!token) {
        setCartItems(localUserCart.length ? localUserCart : guestCart);
        hasLoadedCartRef.current = true;
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load cart from server');
        }

        const result = await response.json();
        const serverCart = Array.isArray(result.cart) ? result.cart : [];

        if (localUserCart.length && serverCart.length) {
          const mergedCart = mergeCarts(serverCart, localUserCart);
          setCartItems(mergedCart);
          await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cartItems: mergedCart }),
          }).catch((err) => console.error('Error syncing merged cart to server:', err));
          localStorage.setItem(userKey, JSON.stringify(mergedCart));
        } else if (serverCart.length) {
          const mergedCart = guestCart.length ? mergeCarts(serverCart, guestCart) : serverCart;
          setCartItems(mergedCart);
          if (guestCart.length) {
            await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ cartItems: mergedCart }),
            }).catch((err) => console.error('Error syncing merged guest cart to server:', err));
            localStorage.setItem(userKey, JSON.stringify(mergedCart));
            localStorage.removeItem('cart:guest');
          }
        } else if (localUserCart.length) {
          setCartItems(localUserCart);
        } else if (guestCart.length) {
          setCartItems(guestCart);
          await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cartItems: guestCart }),
          }).catch((err) => console.error('Error saving guest cart to server:', err));
          localStorage.setItem(userKey, JSON.stringify(guestCart));
          localStorage.removeItem('cart:guest');
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error fetching server cart:', error);
        setCartItems(localUserCart.length ? localUserCart : guestCart);
      }

      hasLoadedCartRef.current = true;
    };

    loadCartForUser();
  }, [currentUserId]);

  // Save cart to localStorage whenever it changes for the current user key
  useEffect(() => {
    try {
      const key = getCartStorageKey(currentUserId);
      const safeItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        original_price: item.original_price || item.price,
        quantity: item.quantity,
        image: item.image || item.image_url || '',
        image_url: item.image_url || item.image || '',
        description: item.description || '',
        age_range: item.age_range || '',
        stock_quantity: item.stock_quantity || 999,
        mrp: item.mrp,
      }));
      localStorage.setItem(key, JSON.stringify(safeItems));

      const token = localStorage.getItem('token');
      if (currentUserId && token && hasLoadedCartRef.current) {
        fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cartItems: safeItems }),
        }).catch((err) => {
          console.error('Error syncing cart to server:', err);
        });
      }
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cartItems, currentUserId]);


  const getFirstValidImage = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && value.trim()) return value;

    if (Array.isArray(value)) {
      for (const entry of value) {
        const candidate = getFirstValidImage(entry);
        if (candidate) return candidate;
      }
      return '';
    }

    if (typeof value === 'object') {
      return (
        getFirstValidImage(value.image_url) ||
        getFirstValidImage(value.imageUrl) ||
        getFirstValidImage(value.url) ||
        getFirstValidImage(value.image) ||
        ''
      );
    }

    return '';
  };

  // ✅ Normalize product structure for consistent cart data
  const normalizeProduct = (p) => {
    const id = p.id ?? p.sno ?? p.product_id ?? `${Date.now()}-${Math.random()}`;
    const price = Number(p.price ?? p.mrp ?? 0) || 0;
    const originalPrice = Number(p.original_price ?? p.mrp ?? 0) || 0;
    const resolvedImage =
      getFirstValidImage(p.image) ||
      getFirstValidImage(p.image_url) ||
      getFirstValidImage(p.imageUrl) ||
      getFirstValidImage(p.product_images) ||
      getFirstValidImage(p.images) ||
      '';
    // If original_price is not set but we have a higher price value, use that
    const finalOriginalPrice = originalPrice > price ? originalPrice : price;
    return {
      id,
      name: p.name ?? p.product_name ?? '',
      price,
      original_price: finalOriginalPrice,
      image: resolvedImage,
      image_url: resolvedImage,
      stock_quantity: p.stock_quantity ?? p.stock_qty ?? p.stock ?? 999,
      description: p.description ?? '',
      age_range: p.age_range ?? '',
    };
  };

  
  const showCartToast = (message, duration = 1200) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setCartToast({ show: true, message });
    toastTimeoutRef.current = window.setTimeout(() => {
      setCartToast({ show: false, message: '' });
      toastTimeoutRef.current = null;
    }, duration);
  };

  // ✅ Add to Cart
  const addToCart = (product, quantity = 1) => {
    if (!currentUserId) {
      showCartToast('Please login before adding items to cart.');
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
      return;
    }

    const normalizedProduct = normalizeProduct(product);
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === normalizedProduct.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === normalizedProduct.id
            ? { ...item, quantity: item.quantity + Number(quantity) }
            : item
        );
      } else {
        return [...prevItems, { ...normalizedProduct, quantity: Number(quantity) }];
      }
    });
    showCartToast(`${normalizedProduct.name} added to cart!`);
  };

  // ✅ Remove item
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // ✅ Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // ✅ Clear cart (memoized)
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(getCartStorageKey(currentUserId));
    const token = localStorage.getItem('token');
    if (currentUserId && token) {
      fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch((err) => {
        console.error('Error clearing cart on server:', err);
      });
    }
  }, [currentUserId]);

  // ✅ Cart total and count helpers
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  };

  const getCartItemCount = () => {
    return cartItems.length;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartItemCount,
    showCartToast,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {cartToast.show && (
        <div className="fixed left-1/2 top-1/2 z-[2000] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#0f6a73] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,106,115,0.25)]">
          {cartToast.message}
        </div>
      )}
    </CartContext.Provider>
  );
};
