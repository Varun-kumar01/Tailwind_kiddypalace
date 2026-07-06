import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from "./config";

const ProductsPage = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');    
  const [highlightedProduct, setHighlightedProduct] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileFilterTop, setMobileFilterTop] = useState(0);
  const [cartQuantities, setCartQuantities] = useState({});
  const productRefs = useRef({});

  // 🔹 New state for sorting
  const [sortOrder, setSortOrder] = useState('none');

  // Filters state (synced with URL)
  const [filters, setFilters] = useState({
    priceRange: 'all',
    ageRange: 'all',
    brand: 'all',
  });

  // 🔹 Restore filters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const price = params.get('price') || 'all';
    const age = params.get('age') || 'all';
    const brand = params.get('brand') || 'all';

    const reverseAgeMap = {
      '0-18 Months': '0-18-months',
      '18-36 Months': '18-36-months',
      '3-5 Years': '3-5-years',
      '5-7 Years': '5-7-years',
      '7-9 Years': '7-9-years',
      '9-12 Years': '9-12-years',
      '12+ Years': '12+',
    };

    setFilters({
      priceRange: price,
      ageRange: reverseAgeMap[age] || age,
      brand: brand,
    });
  }, [location.search]);

  // 🔹 Extract URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const { categoryId, subcategory: subcategoryParam } = useParams();
  const subcategory = subcategoryParam?.toLowerCase() || '';
  const searchTerm = searchParams.get('search')?.toLowerCase() || '';
  const tagId = searchParams.get('tag') || '';
  const age = searchParams.get('age') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const price = searchParams.get('price') || '';
  const isNewArrivalsPage = searchParams.get("new") === "true";
  const discount = searchParams.get("discount") || "";
  const hasTag = searchParams.get("hasTag") === "true";


  useEffect(() => {
    fetchProducts();

    if (location.state?.selectedProductId) {
      const productId = location.state.selectedProductId;
      setHighlightedProduct(productId);

      setTimeout(() => {
        const element = productRefs.current[productId];
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);

      setTimeout(() => setHighlightedProduct(null), 2500);
    }
  }, [location.search, location.pathname, subcategory, categoryId]);

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

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;

    const updateDrawerTop = () => {
      const header = document.querySelector('header');
      const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
      setMobileFilterTop(headerHeight);
    };

    updateDrawerTop();
    window.addEventListener('resize', updateDrawerTop);

    return () => {
      window.removeEventListener('resize', updateDrawerTop);
    };
  }, [isMobileFiltersOpen]);


  // useEffect(() => {

  //   fetchProducts();

  //   if (location.state?.selectedProductId) {
  //     const productId = location.state.selectedProductId;
  //     setHighlightedProduct(productId);

  //     setTimeout(() => {
  //       const element = productRefs.current[productId];
  //       if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }, 0);

  //     setTimeout(() => setHighlightedProduct(null), 2500);
  //   }
  // }, [location.search, location.pathname, subcategory, categoryId]);

  //   useEffect(() => {
  //   const loadProducts = async () => {
  //     if (isCharactersPage) {
  //       try {
  //         const res = await fetch(`${API_BASE_URL}/api/products?hasTag=true`);
  //         const data = await res.json();
  //         setProducts(data.products || []);
  //       } catch (err) {
  //         console.error("Error loading Characters & Themes:", err);
  //         setMessage("Error loading Characters & Themes");
  //       } finally {
  //         setLoading(false);
  //       }
  //       return;
  //     }

  //     await fetchProducts();
  //   };

  //   loadProducts();

  //   if (location.state?.selectedProductId) {
  //     const productId = location.state.selectedProductId;
  //     setHighlightedProduct(productId);

  //     setTimeout(() => {
  //       const element = productRefs.current[productId];
  //       if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }, 0);

  //     setTimeout(() => setHighlightedProduct(null), 2500);
  //   }
  // }, [location.search, location.pathname, subcategory, categoryId, isCharactersPage]);


  //   const fetchProducts = async () => {
  //     try {
  //                         // 🎭 Characters & Themes (ALL tagged products)
  //                   // if (searchParams.get("hasTag") === "true") {
  //                   //   const res = await fetch(`${API_BASE_URL}/api/products?hasTag=true`);
  //                   //   const data = await res.json();
  //                   //   setProducts(data.products || []);
  //                   //   return;
  //                   // }

  //                   // if (searchParams.get("hasTag") === "true") {
  //                   //   const res = await fetch(`${API_BASE_URL}/api/products?hasTag=true`);
  //                   //   const data = await res.json();
  //                   //   setProducts(data.products || []);
  //                   //   return;
  //                   // }







  //       if (searchParams.get("customized") === "true") {
  //         const res = await fetch(`${API_BASE_URL}/api/products/customized`);
  //         const data = await res.json();
  //         setProducts(data.products || []);
  //         return;
  //       }

  //       // ⭐ If fers page
  //       if (searchParams.get("offers") === "true") {
  //         const res = await fetch(`${API_BASE_URL}/api/products/offers`);
  //         const data = await res.json();
  //         setProducts(data.products || []);
  //         return;
  //       }

  //       // ⭐ If new=true, fetch NEW ARRIVALS
  //       if (isNewArrivalsPage) {
  //       const res = await fetch(`${API_BASE_URL}/api/new-arrivals?time=` + Date.now());
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //       }


  //       let url = `${API_BASE_URL}/api/products`;
  //       if(discount === "high"){
  //         url = `${API_BASE_URL}/api/discount/high`;
  //       }  else if(tagId){
  //         url = `${API_BASE_URL}/api/products/by-tag/${tagId}`;
  //       } else if (subcategory) {
  //         url = `${API_BASE_URL}/api/products/by-subcategory/${encodeURIComponent(subcategory)}`;
  //       } else if(categoryId){
  //         url = `${API_BASE_URL}/api/products/by-category/${categoryId}`;
  //       }

  //       const response = await fetch(url);
  //       const data = await response.json();

  //       // if (data.success) {
  //       //   setProducts(data.products);
  //       // } else {
  //       //   setMessage('No products found.');
  //       // }
  //       if (data.success === true || data.success === "true") {
  //   setProducts(data.products);
  // } else {
  //   setMessage("No products found.");
  // }

  //     } catch (error) {
  //       console.error('Error fetching products:', error);
  //       setMessage('Error loading products');
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  // const fetchProducts = async () => {
  //   try {
  //     // ✅ 1. If Home page character clicked → specific tag
  //     if (tagId) {
  //       const res = await fetch(`${API_BASE_URL}/api/products/by-tag/${tagId}`);
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //     }

  //     // ✅ 2. If Header "Characters & Themes" → all tagged products
  //     if (hasTag) {
  //       const res = await fetch(`${API_BASE_URL}/api/products?hasTag=true`);
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //     }


  const fetchProducts = async () => {
    try {
      setLoading(true);
      setMessage(""); // ✅ clear old "No products" message

      // Cache buster to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`;

      // 🥇 PRIORITY 1: Specific tag (Marvel, DC, etc.)
      if (tagId) {
        const res = await fetch(`${API_BASE_URL}/api/products/by-tag/${tagId}${cacheBuster}`);
        const data = await res.json();
        setProducts(data.products || []);
        return;
      }

      // 🥈 PRIORITY 2: All tagged products (Characters & Themes page)
      if (hasTag) {
        const res = await fetch(`${API_BASE_URL}/api/products/with-tags${cacheBuster}`);
        const data = await res.json();
        setProducts(data.products || []);
        return;
      }

      // ⭐ Customized
      if (searchParams.get("customized") === "true") {
        const res = await fetch(`${API_BASE_URL}/api/products/customized${cacheBuster}`);
        const data = await res.json();
        setProducts(data.products || []);
        return;
      }

      // 🔥 Offers
      if (searchParams.get("offers") === "true") {
        const res = await fetch(`${API_BASE_URL}/api/products/offers${cacheBuster}`);
        const data = await res.json();
        setProducts(data.products || []);
        return;
      }

      // 🆕 New Arrivals
      if (isNewArrivalsPage) {
        const res = await fetch(`${API_BASE_URL}/api/new-arrivals?time=${Date.now()}`);
        const data = await res.json();
        setProducts(data.products || []);
        return;
      }

      // 📦 Default / category / subcategory / discount
      let url = `${API_BASE_URL}/api/products${cacheBuster}`;

      if (discount === "high") {
        url = `${API_BASE_URL}/api/discount/high${cacheBuster}`;
      } else if (subcategory) {
        url = `${API_BASE_URL}/api/products/by-subcategory/${encodeURIComponent(subcategory)}${cacheBuster}`;
      } else if (categoryId) {
        url = `${API_BASE_URL}/api/products/by-category/${categoryId}${cacheBuster}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setMessage("Error loading products");
    } finally {
      setLoading(false);
    }
  };



  //     // ⭐ Customized products
  //     if (searchParams.get("customized") === "true") {
  //       const res = await fetch(`${API_BASE_URL}/api/products/customized`);
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //     }

  //     // ⭐ Special offers
  //     if (searchParams.get("offers") === "true") {
  //       const res = await fetch(`${API_BASE_URL}/api/products/offers`);
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //     }

  //     // ⭐ New arrivals
  //     if (isNewArrivalsPage) {
  //       const res = await fetch(`${API_BASE_URL}/api/new-arrivals?time=` + Date.now());
  //       const data = await res.json();
  //       setProducts(data.products || []);
  //       return;
  //     }

  //     // 🔹 Default / category / subcategory / discount
  //     let url = `${API_BASE_URL}/api/products`;

  //     if (discount === "high") {
  //       url = `${API_BASE_URL}/api/discount/high`;
  //     } else if (subcategory) {
  //       url = `${API_BASE_URL}/api/products/by-subcategory/${encodeURIComponent(subcategory)}`;
  //     } else if (categoryId) {
  //       url = `${API_BASE_URL}/api/products/by-category/${categoryId}`;
  //     }

  //     const response = await fetch(url);
  //     const data = await response.json();

  //     if (data.success === true || data.success === "true") {
  //       setProducts(data.products || []);
  //     } else {
  //       setMessage("No products found.");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching products:", error);
  //     setMessage("Error loading products");
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      setMessage('This product is out of stock');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    addToCart({ ...product, original_price: product.mrp || product.price }, 1);
  };

  const handleProductClick = (product) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // 🔹 Filter change handler (sync to URL)
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));

    const params = new URLSearchParams(location.search);

    if (name === 'priceRange') {
      if (value === 'all') params.delete('price');
      else params.set('price', value);
    }

    if (name === 'brand') {
      if (value === 'all') params.delete('brand');
      else params.set('brand', value);
    }

    if (name === 'ageRange') {
      if (value === 'all') params.delete('age');
      else {
        const labelMap = {
          '0-18-months': '0-18 Months',
          '18-36-months': '18-36 Months',
          '3-5-years': '3-5 Years',
          '5-7-years': '5-7 Years',
          '7-9-years': '7-9 Years',
          '9-12-years': '9-12 Years',
          '12+': '12+ Years',
        };
        params.set('age', labelMap[value] || value);
      }
    }

    navigate({ pathname: location.pathname, search: params.toString() });
  };

  const parseAgeToMonths = (str) => {
    if (!str) return null;
    const s = String(str).toLowerCase().replace(/\s+/g, '');
    const monthsMatch = s.match(/^(\d+)-(\d+)months$/);
    if (monthsMatch)
      return [parseInt(monthsMatch[1], 10), parseInt(monthsMatch[2], 10)];
    const yearsMatch = s.match(/^(\d+)-(\d+)years$/);
    if (yearsMatch)
      return [parseInt(yearsMatch[1], 10) * 12, parseInt(yearsMatch[2], 10) * 12];
    const plusYears = s.match(/^(\d+)\+years$/);
    if (plusYears) return [parseInt(plusYears[1], 10) * 12, Infinity];
    const plusMonths = s.match(/^(\d+)\months\+$/) || s.match(/^(\d+)\+months$/);
    if (plusMonths) return [parseInt(plusMonths[1], 10), Infinity];
    return null;
  };

  const rangesOverlap = (a, b) => {
    if (!a || !b) return false;
    const [aStart, aEnd] = a;
    const [bStart, bEnd] = b;
    const aE = Number.isFinite(aEnd) ? aEnd : Number.MAX_SAFE_INTEGER;
    const bE = Number.isFinite(bEnd) ? bEnd : Number.MAX_SAFE_INTEGER;
    return aStart <= bE && bStart <= aE;
  };

  const parsePriceRange = (str) => {
    if (!str) return null;
    const s = String(str).toLowerCase().replace(/\s+/g, '');
    const range = s.match(/^(\d+)-(\d+)$/);
    if (range) return [parseInt(range[1], 10), parseInt(range[2], 10)];
    const plus = s.match(/^(\d+)\+$/);
    if (plus) return [parseInt(plus[1], 10), Infinity];
    return null;
  };

  const selectedAgeRangeURL = age ? parseAgeToMonths(age) : null;
  const selectedPriceRangeURL = price ? parsePriceRange(price) : null;
  const selectedBrandURL = brand ? brand.toLowerCase() : '';

  const selectedAgeRangeLocal =
    filters.ageRange !== 'all'
      ? parseAgeToMonths(filters.ageRange.replace(/$/, ' years'))
      : null;
  const selectedPriceRangeLocal =
    filters.priceRange !== 'all' ? parsePriceRange(filters.priceRange) : null;
  const selectedBrandLocal =
    filters.brand !== 'all' ? filters.brand.toLowerCase() : '';

  // const filteredProducts = products.filter((p) => {
  //   let ok = true;

  //   // 🎭Characters & Themes filter
  //   // if (hasTag) {
  //   //   ok =
  //   //     ok &&
  //   //     (
  //   //       p.tag_id ||
  //   //       (Array.isArray(p.tags) && p.tags.length > 0)
  //   //     );
  //   // }

  //   // 🔍 Search filter
  //   if (searchTerm) {
  //     const hay = `${p.name || ''} ${p.description || ''}`.toLowerCase();
  //     ok = ok && hay.includes(searchTerm);
  //   }

  //   // 🎂 Age filter (URL)
  //   const prodRange = parseAgeToMonths(p.age_range || "");
  //   if (selectedAgeRangeURL && prodRange) {
  //     ok = ok && rangesOverlap(prodRange, selectedAgeRangeURL);
  //   }

  //   // 🎂 Age filter (sidebar)
  //   if (ok && selectedAgeRangeLocal) {
  //     const prodRangeLocal = parseAgeToMonths(p.age_range || '');
  //     ok = ok && rangesOverlap(prodRangeLocal, selectedAgeRangeLocal);
  //   }

  //   // 🏷 Brand filter (URL)
  //   if (ok && selectedBrandURL) {
  //     ok = ok && (p.brand_name || "").toLowerCase() === selectedBrandURL;
  //   }

  //   // 🏷 Brand filter (sidebar)
  //   if (ok && selectedBrandLocal) {
  //     ok = ok && p.brand_name?.toLowerCase() === selectedBrandLocal;
  //   }

  //   // 💰 Price filter (URL)
  //   if (ok && selectedPriceRangeURL) {
  //     const [minP, maxP] = selectedPriceRangeURL;
  //     const priceNum = Number(p.price) || 0;
  //     ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
  //   }

  //   // 💰 Price filter (sidebar)
  //   if (ok && selectedPriceRangeLocal) {
  //     const [minP, maxP] = selectedPriceRangeLocal;
  //     const priceNum = Number(p.price) || 0;
  //     ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
  //   }

  //   return ok;
  // });

  const filteredProducts = products.filter((p) => {
    // ✅ VERY IMPORTANT:
    // If coming from Characters/Tag page, DO NOT apply brand/price/age filters
    if (tagId) return true;

    let ok = true;

    // 🔍 Search filter
    if (searchTerm) {
      const hay = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      ok = ok && hay.includes(searchTerm);
    }

    // 🎂 Age filter (URL)
    const prodRange = parseAgeToMonths(p.age_range || "");
    if (selectedAgeRangeURL && prodRange) {
      ok = ok && rangesOverlap(prodRange, selectedAgeRangeURL);
    }

    // 🎂 Age filter (sidebar)
    if (ok && selectedAgeRangeLocal) {
      const prodRangeLocal = parseAgeToMonths(p.age_range || "");
      ok = ok && rangesOverlap(prodRangeLocal, selectedAgeRangeLocal);
    }

    // 🏷 Brand filter (URL)
    if (ok && selectedBrandURL) {
      ok = ok && (p.brand_name || "").toLowerCase() === selectedBrandURL;
    }

    // 🏷 Brand filter (sidebar)
    if (ok && selectedBrandLocal) {
      ok = ok && p.brand_name?.toLowerCase() === selectedBrandLocal;
    }

    // � Price filter (URL)
    if (ok && selectedPriceRangeURL) {
      const [minP, maxP] = selectedPriceRangeURL;
      const priceNum = Number(p.price) || 0;
      ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
    }

    // 💰 Price filter (sidebar)
    if (ok && selectedPriceRangeLocal) {
      const [minP, maxP] = selectedPriceRangeLocal;
      const priceNum = Number(p.price) || 0;
      ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
    }

    return ok;
  });


  useEffect(() => {
    if (products.length > 0) {
      console.log("Sample product:", products[0]);
    }
  }, [products]);



  // 🔹 Apply sorting to filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'lowToHigh') return a.price - b.price;
    if (sortOrder === 'highToLow') return b.price - a.price;
    return 0;
  });

  const pageTitle = discount === 'high'
    ? 'Special Offers'
    : searchParams.get('customized') === 'true'
      ? 'Customized Products'
      : isNewArrivalsPage
        ? 'Fresh In Store'
        : hasTag || tagId
          ? 'Characters & Themes'
          : age
            ? `Products for ${age}`
            : subcategory
              ? subcategory.toUpperCase()
              : category
                ? 'Category Products'
                : 'All Products';

  const clearAllFilters = () => {
    setFilters({ priceRange: 'all', ageRange: 'all', brand: 'all' });
    navigate('/products');
  };

  const ageChipMap = {
    '0-18-months': '0-18 Months',
    '18-36-months': '18-36 Months',
    '3-5-years': '3-5 Years',
    '5-7-years': '5-7 Years',
    '7-9-years': '7-9 Years',
    '9-12-years': '9-12 Years',
    '12+': '12+ Years',
  };

  const activeFilterChips = [
    filters.priceRange !== 'all'
      ? { key: 'priceRange', label: `Price: ${filters.priceRange}` }
      : null,
    filters.ageRange !== 'all'
      ? { key: 'ageRange', label: `Age: ${ageChipMap[filters.ageRange] || filters.ageRange}` }
      : null,
    filters.brand !== 'all' ? { key: 'brand', label: `Brand: ${filters.brand}` } : null,
  ].filter(Boolean);

  const renderFilters = (isMobile = false) => (
    <div className={isMobile ? 'space-y-3' : ''}>
      <h3 className="mb-4 text-xl font-extrabold text-[#104f58]">Filter Toys</h3>

      <div className={isMobile ? 'mb-3' : 'mb-4'}>
        <h4 className="mb-2 text-base font-semibold text-[#1b3137] sm:text-lg">Price Range</h4>
        <select
          name="priceRange"
          value={filters.priceRange}
          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          className="w-full rounded-xl border border-[#bdd0d3] bg-white px-3 py-2 text-sm text-[#1b3137] transition focus:outline-none focus:ring-4 focus:ring-[#0f6a73]/20"
        >
          <option value="all">All Prices</option>
          <option value="0-25">₹0 – ₹25</option>
          <option value="26-50">₹26 – ₹50</option>
          <option value="51-100">₹51 – ₹100</option>
          <option value="101-250">₹101 – ₹250</option>
          <option value="251-500">₹251 – ₹500</option>
          <option value="501-1000">₹501 – ₹1000</option>
          <option value="1001-1500">₹1001 – ₹1500</option>
          <option value="1500+">₹1500+</option>
        </select>
      </div>

      <div className={isMobile ? 'mb-3' : 'mb-4'}>
        <h4 className="mb-2 text-base font-semibold text-[#1b3137] sm:text-lg">Age Range</h4>
        <select
          name="ageRange"
          value={filters.ageRange}
          onChange={(e) => handleFilterChange('ageRange', e.target.value)}
          className="w-full rounded-xl border border-[#bdd0d3] bg-white px-3 py-2 text-sm text-[#1b3137] transition focus:outline-none focus:ring-4 focus:ring-[#0f6a73]/20"
        >
          <option value="all">All Age Ranges</option>
          <option value="0-18-months">0–18 Months</option>
          <option value="18-36-months">18–36 Months</option>
          <option value="3-5-years">3–5 Years</option>
          <option value="5-7-years">5–7 Years</option>
          <option value="7-9-years">7–9 Years</option>
          <option value="9-12-years">9–12 Years</option>
          <option value="12+">12+ Years</option>
        </select>
      </div>

      <div className={isMobile ? 'mb-3' : 'mb-4'}>
        <h4 className="mb-2 text-base font-semibold text-[#1b3137] sm:text-lg">Brand</h4>
        <select
          name="brand"
          value={filters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          className="w-full rounded-xl border border-[#bdd0d3] bg-white px-3 py-2 text-sm text-[#1b3137] transition focus:outline-none focus:ring-4 focus:ring-[#0f6a73]/20"
        >
          <option value="all">All Brands</option>
          {[...new Set(products.map((p) => p.brand_name))]
            .filter(Boolean)
            .sort()
            .map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
        </select>
      </div>

      <button
        className="mt-1 w-full rounded-xl border border-[#] bg-[#f01c71] px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(244,111,86,0.3)]"
        onClick={() => {
          clearAllFilters();
          if (isMobile) setIsMobileFiltersOpen(false);
        }}
      >
        Clear Filters
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8f5ee] text-[#1b3137]">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1b3137] ring-1 ring-[#1b3137]/10 shadow-[0_8px_22px_rgba(27,49,55,0.08)]">
            Loading products...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f5ee] text-[#1b3137]">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 md:px-5 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Sidebar Filters */}
          <aside className="hidden h-fit rounded-2xl border border-[#d8e5e7] bg-[#eaf2f3 ] p-4 shadow-[0_8px_24px_rgba(27,49,55,0.08)] lg:sticky lg:top-32 lg:block lg:w-[270px]">
            <div>{renderFilters(false)}</div>
          </aside>

          {/* Products Section */}
          <section className="min-h-[600px] flex-1">
            <div className="sticky top-32 z-50 mb-8 rounded-2xl border border-[#d8e5e7] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(27,49,55,0.06)] sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1b3137] sm:text-3xl">
                  {pageTitle}
                </h2>
                {/* 🔹 Sort By Dropdown  */}
                <div className="flex items-center gap-2 text-base font-semibold text-[#1b3137] sm:text-lg">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="inline-flex rounded-xl border border-[#0f6a73] bg-white px-3 py-2 text-sm font-semibold text-[#0f6a73] transition hover:bg-[#0f6a73] hover:text-white lg:hidden"
                  >
                    Filters
                  </button>
                  <label>Sort by:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="rounded-xl border border-[#bdd0d3] bg-[#f8f5ee] px-3 py-2 text-sm text-[#1b3137] transition focus:outline-none focus:ring-4 focus:ring-[#0f6a73]/20"
                  >
                    <option value="none">Default</option>
                    <option value="lowToHigh">Price: Low to High</option>
                    <option value="highToLow">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {activeFilterChips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => handleFilterChange(chip.key, 'all')}
                      className="inline-flex items-center gap-2 rounded-full border border-[#bdd0d3] bg-[#f7fafb] px-3 py-1.5 text-xs font-semibold text-[#1b3137] transition hover:border-[#0f6a73] hover:text-[#0f6a73]"
                      title="Remove filter"
                    >
                      <span>{chip.label}</span>
                      <span className="text-sm leading-none">×</span>
                    </button>
                  ))}

                  {activeFilterChips.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center rounded-full border border-[#f46f56] bg-[#fff0ec] px-3 py-1.5 text-xs font-semibold text-[#8b2d1a] transition hover:bg-[#ffe3db]"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {message && (
              <div className="mb-4 rounded-xl border border-[#ffd1c8] bg-[#fff0ec] px-4 py-3 text-sm font-medium text-[#8b2d1a]">
                {message}
              </div>
            )}

            {sortedProducts.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-12 text-center text-[#5f6f72] ring-1 ring-[#d8e5e7]">
                <p>No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-28 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    ref={(el) => (productRefs.current[product.id] = el)}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_6px_20px_rgba(27,49,55,0.09)] transition hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(27,49,55,0.16)] min-h-[420px] ${highlightedProduct === product.id ? 'border-[#0f6a73] ring-2 ring-[#0f6a73]/35' : 'border-[#d8e5e7]'
                      }`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* <div className="product-image-container">
          {product.image_url ? (
            <img
  src={
    product.image_url
      ? `${API_BASE_URL}${product.image_url}`
      : "/placeholder-product.png"
  }
  alt={product.name}
  loading="lazy"
  className="product-image"
/>

          ) : (
            <div className="no-product-image">
              <span>📦</span>
              <p>No Image</p>
            </div>
          )}
        </div> */}

                    <div className="relative m-2 flex h-[160px] items-center justify-center rounded-xl border border-[#e2ebec] bg-[#f7fafb] p-2 sm:h-[180px]">

                      {/* 🔥 Discount badge from DB */}
                      {product.discount_percent > 0 && (
                        <div className="absolute right-2 top-2 z-[6] rounded-full bg-gradient-to-r from-[#f01c71] to-[#ff4b92] px-2 py-1 text-[11px] font-bold leading-none text-white shadow-[0_6px_16px_rgba(240,28,113,0.28)]">
                          {product.discount_percent}% OFF
                        </div>
                      )}

                      {/* Normalize image source: accept absolute URLs, data URIs, or server paths */}
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
                              className="h-full w-full rounded-lg object-contain"
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



                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="line-clamp-2 min-h-[2.6rem] text-[0.98rem] font-semibold leading-5 text-[#213d43] sm:text-[1rem]">{product.name}</h3>
                      <p className="h-[44px] overflow-hidden text-ellipsis text-[0.875rem] text-[#666]">
                        {product.description}
                      </p>
                      <div className=" pt-2.5">
                        <div className="flex items-end gap-1.5">

                          {product.mrp && product.price && Number(product.mrp) > Number(product.price) ? (
                            <>
                              {/* Final Price */}
                              <span className="text-[1.25rem] font-black tracking-tight text-[#1b3137]">
                                ₹{product.price}
                              </span>

                              {/* MRP Strike */}
                              <span className="pb-0.5 text-[0.8rem] text-[#888] line-through">
                                ₹{product.mrp}
                              </span>
                            </>
                          ) : (
                            /* No Discount → Show Only One Price */
                            <span className="text-[1.25rem] font-black tracking-tight text-[#1b3137]">
                              ₹{product.price || product.mrp}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                          <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.stock_quantity > 0 ? 'bg-[#e8f1ff] text-[#2e79e3]' : 'bg-rose-50 text-rose-700'}`}>
                            {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </p>
                          {product.age_range && (
                            <p className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-[#fef3c7] text-[#b45309]">
                              {product.age_range}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 w-full h-[44px] flex items-center justify-center">
                          {cartQuantities[product.id] ? (
                            <div className="w-full flex items-center justify-between gap-2">
                              <div className="w-[45%] flex items-center justify-between gap-1.5 rounded-lg border border-[#2e79e3] px-2 py-1 hover:bg-slate-100 transition">
                                <button
                                  className="text-base font-bold text-[#2e79e3] transition leading-none"
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
                                <span className="text-center text-sm font-bold text-[#2e79e3] min-w-[25px]">
                                  {cartQuantities[product.id]}
                                </span>
                                <button
                                  className="text-base font-bold text-[#2e79e3] transition disabled:text-[#ccc] disabled:cursor-not-allowed leading-none"
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
                              className={`w-full h-full inline-flex items-center justify-center rounded-xl border-2 px-4 py-2 text-[0.95rem] font-semibold transition ${product.stock_quantity <= 0
                                  ? 'cursor-not-allowed border-[#ccc] bg-[#ccc] text-white'
                                  : 'border-[#2e79e3] bg-white text-[#2e79e3] hover:bg-[#2e79e3] hover:text-white hover:shadow-[0_8px_18px_rgba(46,121,227,0.3)]'
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

          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-[1100] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter products">
              <button
                type="button"
                aria-label="Close filters"
                className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
                onClick={() => setIsMobileFiltersOpen(false)}
              />

              <div
                className="absolute left-0 w-[74vw] max-w-[250px] overflow-y-auto overscroll-contain border-r border-[#d8e5e7] bg-[#eaf2f3 ] p-3 shadow-[0_18px_40px_rgba(27,49,55,0.25)] rounded-tr-2xl rounded-br-2xl sm:w-[68vw] sm:max-w-[280px] sm:p-4"
                style={{ top: `${mobileFilterTop}px`, height: `calc(100dvh - ${mobileFilterTop}px)` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#0f6a73]">Filters</p>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="rounded-lg border border-[#bdd0d3] bg-white px-3 py-1.5 text-sm font-semibold text-[#1b3137]"
                  >
                    Close
                  </button>
                </div>
                {renderFilters(true)}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
