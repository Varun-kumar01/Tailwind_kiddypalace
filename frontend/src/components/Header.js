import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Search, ShoppingCart, User, Home, MapPin, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import logo from '../components/assets/kp-logo.png';
import { API_BASE_URL } from './config';

const Header = () => {
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [loadingSubSubcategories, setLoadingSubSubcategories] = useState(false);
  const [emptyCategoryIds, setEmptyCategoryIds] = useState(new Set());
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementSettings, setAnnouncementSettings] = useState({ displayDuration: 5000, gapDuration: 1000 });
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [mobileSelectedCategory, setMobileSelectedCategory] = useState(null);
  const [mobileSubcategories, setMobileSubcategories] = useState([]);
  const [mobileSelectedSubcategory, setMobileSelectedSubcategory] = useState(null);
  const [mobileSubSubcategories, setMobileSubSubcategories] = useState([]);
  const [loadingMobileSubSubcategories, setLoadingMobileSubSubcategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const typingTimer = useRef(null);
  const dropdownCloseTimer = useRef(null);
 const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

useEffect(() => {
  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 1024);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 1024);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

useEffect(() => {
  if (!headerRef.current) return undefined;

  const updateHeight = () => {
    const rect = headerRef.current?.getBoundingClientRect();
    setHeaderHeight(rect?.height || 0);
  };

  updateHeight();
  const resizeObserver = new ResizeObserver(() => updateHeight());
  resizeObserver.observe(headerRef.current);

  window.addEventListener('resize', updateHeight);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', updateHeight);
  };
}, [headerRef]);
  const syncUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    const storedAdminUser = localStorage.getItem('adminUser');
    if (storedAdminUser && storedAdminUser !== 'undefined') {
      try {
        setAdminUser(JSON.parse(storedAdminUser));
      } catch (error) {
        console.error('Failed to parse admin user data:', error);
        setAdminUser(null);
      }
    } else {
      setAdminUser(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      setActiveDropdown(null);
      setShowStoresDropdown(false);
      setShowAuthDropdown(false);
      setSearchOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const onUserChanged = () => syncUserFromStorage();
    const onStorageChanged = (event) => {
      if (!event.key || event.key === 'user' || event.key === 'token' || event.key === 'adminToken' || event.key === 'adminUser') {
        syncUserFromStorage();
      }
    };

    syncUserFromStorage();
    window.addEventListener('user-changed', onUserChanged);
    window.addEventListener('storage', onStorageChanged);

    return () => {
      window.removeEventListener('user-changed', onUserChanged);
      window.removeEventListener('storage', onStorageChanged);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = () => {
      fetch(`${API_BASE_URL}/api/categories`)
        .then((response) => response.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []))
        .catch((error) => console.error('Error fetching categories:', error));
    };

    fetchCategories();
    const handler = () => fetchCategories();
    window.addEventListener('categories-updated', handler);
    return () => window.removeEventListener('categories-updated', handler);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/brands`)
      .then((response) => response.json())
      .then((data) => {
        console.log("BRANDS DATA:", data);
        if (Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch((error) => console.error('Error fetching brands:', error));
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings/announcements`);
        const data = await response.json();
        if (!mounted) return;
        setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
        if (data.settings) setAnnouncementSettings(data.settings);
        setCurrentAnnouncementIndex(0);
      } catch (error) {
        console.error('Failed to load announcements', error);
        try {
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/settings/top-announcement`);
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.announcement) {
            setAnnouncements([{ id: Date.now(), text: fallbackData.announcement }]);
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback announcement', fallbackError);
        }
      }
    };

    fetchAnnouncements();
    const handler = () => fetchAnnouncements();
    window.addEventListener('announcements-updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('announcements-updated', handler);
    };
  }, []);

  useEffect(() => {
    if (!announcements.length) return undefined;

    const displayDuration = announcementSettings?.displayDuration || 5000;
    const gapDuration = announcementSettings?.gapDuration || 1000;

    const timer = window.setTimeout(() => {
      setCurrentAnnouncementIndex((previous) => (previous + 1) % announcements.length);
    }, displayDuration + gapDuration);

    return () => window.clearTimeout(timer);
  }, [announcements, announcementSettings, currentAnnouncementIndex]);

  useEffect(() => {
    try {
      const savedQuery = sessionStorage.getItem('header.searchQuery');
      const savedOpen = sessionStorage.getItem('header.searchOpen');
      if (savedQuery) setSearchQuery(savedQuery);
      if (savedOpen === 'true') setSearchOpen(true);
    } catch {
      // ignore session storage issues
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('header.searchQuery', searchQuery || '');
      sessionStorage.setItem('header.searchOpen', searchOpen ? 'true' : 'false');
    } catch {
      // ignore session storage issues
    }
  }, [searchQuery, searchOpen]);

  useEffect(() => () => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
    }
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileSubmenu(null);
      setMobileSelectedCategory(null);
      setMobileSubcategories([]);
    }
  }, [mobileMenuOpen]);

  const cancelDropdownClose = () => {
    if (dropdownCloseTimer.current) {
      window.clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
  };

  const scheduleDropdownClose = (name) => {
    cancelDropdownClose();
    dropdownCloseTimer.current = window.setTimeout(() => {
      setActiveDropdown((previous) => (previous === name ? null : previous));
      dropdownCloseTimer.current = null;
    }, 120);
  };

  const toggleDropdown = (name) => {
    cancelDropdownClose();
    setActiveDropdown((previous) => (previous === name ? null : name));
  };

  const handleLoginClick = () => navigate('/login');
  const handleSignupClick = () => navigate('/signup');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    setUser(null);
    setShowAuthDropdown(false);

    try {
      window.dispatchEvent(new Event('user-changed'));
    } catch {
      // ignore
    }

    setToast({ show: true, message: 'Logged out successfully!' });
    setTimeout(() => setToast({ show: false, message: '' }), 1200);

    navigate('/', { replace: true });
  };

  const handleMouseEnter = async (categoryId) => {
    setHoveredCategory(categoryId);
    setSelectedSubcategory(null);
    setSubSubcategories([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`);
      const data = await response.json();
      const subs = Array.isArray(data) ? data : [];
      setSubcategories(subs);
      if (subs.length === 0) {
        setEmptyCategoryIds(prev => new Set([...prev, categoryId]));
      }
      return subs;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
      return [];
    }
  };

  const handleSelectSubcategory = async (categoryId, subcategory, navigateOnClick = false) => {
    setSelectedSubcategory(subcategory);
    setLoadingSubSubcategories(true);
    setSubSubcategories([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategory.sno}/sub-subcategories`);
      const data = await response.json();
      const nested = Array.isArray(data?.subSubcategories) ? data.subSubcategories : [];
      setSubSubcategories(nested);

      if (navigateOnClick) {
        if (!nested.length) {
          navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
          setHoveredCategory(null);
          setSubcategories([]);
          setSubSubcategories([]);
          setSelectedSubcategory(null);
          setActiveDropdown(null);
        } else {
          navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
        }
      }
    } catch (error) {
      console.error('Error fetching sub-subcategories:', error);
      setSubSubcategories([]);
      if (navigateOnClick) {
        navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
      }
    } finally {
      setLoadingSubSubcategories(false);
    }
  };

  const handleNavigateCategory = (subcategory) => {
    navigate(`/products/by-subcategory/${encodeURIComponent(subcategory)}`);
    setHoveredCategory(null);
    setSubcategories([]);
    setSubSubcategories([]);
    setSelectedSubcategory(null);
    setActiveDropdown(null);
  };

  const handleMobileSelectCategory = async (categoryId, categoryName) => {
    setMobileSelectedCategory({ id: categoryId, name: categoryName });
    setMobileSelectedSubcategory(null);
    setMobileSubSubcategories([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories`);
      const data = await response.json();
      setMobileSubcategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching mobile subcategories:', error);
      setMobileSubcategories([]);
    }
    navigate(`/products/by-category/${categoryId}`);
  };

  const handleMobileSelectSubcategory = async (categoryId, subcategory, navigateOnClick = false) => {
    setMobileSelectedSubcategory(subcategory);
    setLoadingMobileSubSubcategories(true);
    setMobileSubSubcategories([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategory.sno}/sub-subcategories`);
      const data = await response.json();
      const nested = Array.isArray(data?.subSubcategories) ? data.subSubcategories : [];
      setMobileSubSubcategories(nested);
      if (navigateOnClick) {
        if (!nested.length) {
          navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
          setMobileMenuOpen(false);
          setMobileSubmenu(null);
          setMobileSelectedCategory(null);
          setMobileSubcategories([]);
          setMobileSelectedSubcategory(null);
        } else {
          navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
        }
      }
    } catch (error) {
      console.error('Error fetching mobile sub-subcategories:', error);
      setMobileSubSubcategories([]);
      if (navigateOnClick) {
        navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
      }
    } finally {
      setLoadingMobileSubSubcategories(false);
    }
  };

  const capitalizeFirstLetter = (text = '') => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const navItemClass = 'relative cursor-pointer text-sm font-medium text-[#070707]';
  const navButtonClass = 'inline-flex items-center gap-1 border-0 bg-transparent text-sm font-medium text-[#070707] transition hover:-translate-y-px hover:text-black';
  const navDropdownItemClass = 'cursor-pointer px-4 py-2 text-sm font-medium transition hover:bg-[#fff7eb]';

  console.log("Categories:", categories.length);
  console.log("Brands:", brands.length);
  return (
    <>
      <header ref={headerRef} className="fixed top-0 z-[1200] w-full">
        <div className="relative z-[1001] bg-[#2e79e3] px-3 py-2 text-[#fff7eb] sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-shrink-0 text-sm font-semibold sm:text-base">📞 +91 70750 04435</div>

          <div className="hidden overflow-hidden md:block md:flex-1 md:mx-2">
            <div
              className="top-announcement-text inline-block whitespace-nowrap pl-[100%] text-sm font-medium animate-[kpMarquee_8s_linear_infinite] sm:text-base"
              style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {announcements.length > 0 ? announcements[currentAnnouncementIndex].text : ''}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a href="https://www.instagram.com/kdp_hyd/" target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/15 sm:h-8 sm:w-8">
              <i className="fab fa-instagram" />
            </a>
            <a href="https://kiddypalace.in/" target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/15 sm:h-8 sm:w-8">
              <i className="fab fa-facebook-f" />
            </a>

            <div className="relative" onMouseEnter={() => setShowStoresDropdown(true)} onMouseLeave={() => setShowStoresDropdown(false)}>
              <button type="button" onClick={() => setShowStoresDropdown(prev => !prev)} className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-3 sm:py-2 sm:text-sm">
                <Home size={14} className="mr-1 sm:h-4 sm:w-4" />
                Our Stores
              </button>

              {showStoresDropdown && (
                <div className="absolute right-0 top-full z-50 w-72 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5" onClick={(event) => event.stopPropagation()}>
                <a href="https://www.google.com/maps/search/?api=1&query=Kiddy+Palace+Narsingi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#273c2e] transition hover:bg-[#fff7eb]">
                  <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f4f7f5] text-[#2e79e3]"><MapPin size={20} /></span>
                  <span className="text-sm font-medium leading-5">Narsingi - 70750 04435</span>
                </a>
                <a href="https://www.google.com/maps/place/Kiddy+Palace/@17.4027056,78.350412,17z/data=!3m1!4b1!4m6!3m5!1s0x3bcb950f7b8fd4ff:0xe2696e6650b03b81!8m2!3d17.4027056!4d78.350412!16s%2Fg%2F11vyvxg_b4!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDQwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-[#273c2e] transition hover:bg-[#fff7eb]">
                  <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f4f7f5] text-[#2e79e3]"><MapPin size={20} /></span>
                  <span className="text-sm font-medium leading-5">Nanakramguda - 92912 55974</span>
                </a>
                <a href="https://maps.app.goo.gl/F2n5Bmf44XNTkgTG9" target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-[#273c2e] transition hover:bg-[#fff7eb]">
                  <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f4f7f5] text-[#2e79e3]"><MapPin size={20} /></span>
                  <span className="text-sm font-medium leading-5">Nallagandla - 70758 84435</span>
                </a>
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1.5 w-full overflow-hidden md:hidden">
          <div
            className="top-announcement-text inline-block whitespace-nowrap pl-[100%] text-sm font-medium animate-[kpMarquee_8s_linear_infinite] sm:text-base"
            style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            {announcements.length > 0 ? announcements[currentAnnouncementIndex].text : ''}
          </div>
        </div>
      </div>

      <div className="relative z-[1000] flex items-center justify-between bg-white px-2 py-1.5 shadow-[0_4px_10px_rgba(39,60,46,0.1)] sm:px-3 lg:px-4">
        <div className="flex items-center">
          <a href="/"><img src={logo} alt="KP Logo" className="h-12 w-auto cursor-pointer transition hover:scale-105 sm:h-16" /></a>
        </div>
       
       <div className="hidden flex-1 justify-center lg:flex">
          <ul className="m-0 flex list-none items-center gap-3 xl:gap-6 p-0">
            <li className={navItemClass} onClick={() => navigate('/about')}>About</li>
            <li className={navItemClass} onClick={() => navigate('/products')}>All Products</li>

            <li className={navItemClass} onMouseEnter={() => { cancelDropdownClose(); setActiveDropdown('age'); }} onMouseLeave={() => scheduleDropdownClose('age')}>
              <button type="button" className={navButtonClass} onClick={() => toggleDropdown('age')}>
                Age <ChevronDown size={12} strokeWidth={2.2} className={`transition-transform duration-200 ${activeDropdown === 'age' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'age' && (
                <ul className="absolute left-0 top-full z-50 mt-3 flex min-w-40 flex-col rounded-2xl bg-white py-2 shadow-soft ring-1 ring-black/5" onMouseEnter={() => cancelDropdownClose()} onMouseLeave={() => scheduleDropdownClose('age')}>
                  {['0-18 Months', '18-36 Months', '3-5 Years', '5-7 Years', '7-9 Years', '9-12 Years', '12+ Years',].map((age) => (
                    <li key={age} className={navDropdownItemClass} onClick={() => { navigate(`/products?age=${encodeURIComponent(age)}`); setActiveDropdown(null); }}>
                      {age}
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li className={navItemClass} onClick={() => navigate('/products?new=true')}>New Arrivals</li>

            <li className={navItemClass} onMouseEnter={() => { cancelDropdownClose(); setActiveDropdown('categories'); }} onMouseLeave={() => scheduleDropdownClose('categories')}>
              <button type="button" className={navButtonClass} onClick={() => toggleDropdown('categories')}>
                Categories <ChevronDown size={12} strokeWidth={2.2} className={`transition-transform duration-200 ${activeDropdown === 'categories' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'categories' && (
                <div className="absolute left-0 top-full z-50 mt-3 flex w-[min(700px,calc(100vw-1rem))] overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5" onClick={(event) => event.stopPropagation()} onMouseEnter={() => cancelDropdownClose()} onMouseLeave={() => scheduleDropdownClose('categories')}>
                  <div className="w-1/2 max-h-[360px] overflow-y-auto border-r border-[#ede6d9] bg-[#fffdf8] p-5">
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {categories.map((category) => (
                        <li
                          key={category.sno}
                          className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-[#fff7eb] ${hoveredCategory === category.sno ? 'bg-[#fff7eb] text-[#2e79e3]' : ''}`}
                          onMouseEnter={() => handleMouseEnter(category.sno)}
                          onClick={async (event) => {
                            event.stopPropagation();
                            setHoveredCategory(category.sno);
                            setActiveDropdown('categories');
                            const subs = await handleMouseEnter(category.sno);
                            navigate(`/products/by-category/${category.sno}`);
                            if (!subs.length) {
                              setActiveDropdown(null);
                            }
                          }}
                        >
                          {category.category_name}
                          {!emptyCategoryIds.has(category.sno) && (
                            <ChevronRight size={12} className="text-[#2e79e3]" />
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex w-1/2">
                  <div className="w-1/2 max-h-[360px] overflow-y-auto border-r border-[#ede6d9] p-2">
                  <ul className="m-0 list-none p-0">
                    {subcategories.length > 0 ? subcategories.map((subcategory) => (
                      <li
                      key={subcategory.sno}
                      className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[#fff7eb] ${selectedSubcategory?.sno === subcategory.sno ? 'bg-[#fff7eb] text-[#2e79e3]' : ''}`}
                      onMouseEnter={() => handleSelectSubcategory(hoveredCategory, subcategory)}
                      onClick={() => {
                        navigate(`/products/by-subcategory/${encodeURIComponent(subcategory.subcategory_name)}`);
                        setActiveDropdown(null);
                      }}
        >
                      {subcategory.subcategory_name}
                      {selectedSubcategory?.sno === subcategory.sno && subSubcategories.length > 0 && (
                        <ChevronRight size={11} className="text-[#2e79e3]" />
                        )}
                        </li>
                      )) : <li className="px-3 py-6 text-center text-sm text-[#888]">Hover a category to view subcategories</li>}
                      </ul>
                      </div>
                      <div className="w-1/2 max-h-[360px] overflow-y-auto p-2">
                      <ul className="m-0 list-none p-0">
                        {subSubcategories.length > 0 ? subSubcategories.map((item) => (
                          <li
                          key={item.id}
                          className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[#fff7eb]"
                          onClick={() => {
                            navigate(`/products/by-sub-subcategory/${item.id}?name=${encodeURIComponent(item.sub_subcategory_name)}`);
                            setActiveDropdown(null);
                          }}
        >                 
                          {item.sub_subcategory_name}
                          </li>
                        )) : null}
                        </ul>
                        </div>
                        </div>
                </div>
              )}
            </li>

            <li className={navItemClass} onMouseEnter={() => { cancelDropdownClose(); setActiveDropdown('brand'); }} onMouseLeave={() => scheduleDropdownClose('brand')}>
              <button type="button" className={navButtonClass} onClick={() => toggleDropdown('brand')}>
                Brand <ChevronDown size={12} strokeWidth={2.2} className={`transition-transform duration-200 ${activeDropdown === 'brand' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'brand' && (
                <ul className="absolute right-0 top-full z-50 mt-3 flex w-64 max-w-[90vw] max-h-[340px] flex-col overflow-y-auto rounded-2xl bg-white py-2 shadow-soft ring-1 ring-black/5" onMouseEnter={() => cancelDropdownClose()} onMouseLeave={() => scheduleDropdownClose('brand')}>
                  {brands.length > 0 ? brands.map((brand, index) => (
                    <li key={index} className={navDropdownItemClass} onClick={() => { navigate(`/products?brand=${encodeURIComponent(brand.name)}`); setActiveDropdown(null); }}>
                      {capitalizeFirstLetter(brand.name)}
                    </li>
                  )) : <li className="px-3 py-6 text-center text-sm text-[#888]">Loading brands...</li>}
                </ul>
              )}
            </li>

            <li className={navItemClass} onClick={() => navigate('/products?hasTag=true')}>Characters & Themes</li>
            <li className={navItemClass} onClick={() => navigate('/products?customized=true')}>Customized Products</li>
            {/* <li className={navItemClass} onClick={() => navigate('/products?discount=high')}>Special Offers</li> */}
            <li className={navItemClass} onClick={() => navigate('/special-offers')}>Special Offers</li>
            {/* <li className={navItemClass} onClick={() => navigate('/products?offers=true')}>Special Offers</li> */}
            {user?.role === 'super_admin' && <li className={navItemClass} onClick={() => navigate('/admin')}>Admin Dashboard</li>}
          </ul>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
        {isMobile && (
  <button
    type="button"
    className="flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-[#273c2e]"
    onClick={() => setMobileMenuOpen(prev => !prev)}
  >
    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
)}

          <div className="icon search-icon relative inline-flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-[#273c2e] transition hover:bg-[#fff7eb]" onClick={() => setSearchOpen((previous) => !previous)}>
            <Search size={21} />
            {searchOpen && (
              <div className="mini-search absolute right-4 top-[calc(100%+0.5rem)] z-50 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-black/5">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchQuery(value);

                    if (typingTimer.current) clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => {
                      if (value.trim().length >= 2) {
                        navigate(`/products?search=${encodeURIComponent(value.trim())}`);
                      } else if (value.trim().length === 0) {
                        navigate('/products');
                      }
                    }, 300);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.target.value.trim()) {
                      if (typingTimer.current) clearTimeout(typingTimer.current);
                      navigate(`/products?search=${encodeURIComponent(event.target.value.trim())}`);
                    }
                  }}
                  autoFocus
                  className="w-56 rounded-xl border border-[#ede6d9] bg-[#fffdf8] px-4 py-2 text-sm outline-none placeholder:text-[#8e8e8e] focus:border-[#2e79e3]"
                />
              </div>
            )}
          </div>

          <div className="auth-container relative">
            <button type="button" className="icon flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-[#273c2e] transition hover:bg-[#fff7eb]" onClick={() => setShowAuthDropdown((previous) => !previous)}>
              <User size={21} />
            </button>

            <div className={`auth-dropdown absolute right-0 top-full z-50 mt-2 flex min-w-44 flex-col rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5 transition duration-200 ease-out ${showAuthDropdown ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-1'}`}>
              {user ? (
                <>
                  <span className="user-greeting mb-2 block rounded-xl bg-[#f4f7f5] px-3 py-2 text-sm font-semibold text-[#273c2e]">
                    Hi, {user.firstName || user.fullName} {user.role === 'super_admin' && '(Admin)'}
                  </span>
                  <button type="button" className="orders-btn mb-2 rounded-xl bg-[#fff7eb] px-4 py-2 text-sm font-semibold text-[#273c2e] transition hover:bg-[#dccaaa]/40" onClick={() => { navigate('/orders'); setShowAuthDropdown(false); }}>
                    My Orders
                  </button>
                  <button type="button" className="logout-btn mb-2 rounded-xl bg-[#fef2f2] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="login-btn mb-2 rounded-xl bg-[#2e79e3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a5a8d]" onClick={handleLoginClick}>
                    Login
                  </button>
                  <button type="button" className="signup-btn mb-2 rounded-xl bg-[#f01c71] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff4b92]" onClick={handleSignupClick}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          <button type="button" className="cart-icon-wrapper relative cursor-pointer" onClick={() => navigate('/cart')}>
            <span className="cart-icon inline-flex h-10 w-10 items-center justify-center rounded-full text-[#273c2e] transition sm:h-11 sm:w-11">
              <ShoppingCart size={21} color="BLACK" />
            </span>
            {getCartItemCount() > 0 && <span className="cart-badge absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f01c71] px-1 text-[11px] font-bold text-white">{getCartItemCount()}</span>}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu fixed inset-0 z-[1500] bg-black/30 backdrop-blur-[2px] animate-[kpFadeIn_260ms_ease-out] " onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-content absolute right-0 top-0 h-full w-[60vw] max-w-sm overflow-y-auto bg-white p-5 shadow-soft animate-[kpSlideIn_280ms_ease-out]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#273c2e]">Menu</h2>
              <button type="button" className="flex items-center justify-center rounded-xl p-1 text-[#273c2e] transition hover:bg-[#fff7eb]" onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {mobileSubmenu ? (
              <div>
                <button type="button" className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#2e79e3]" onClick={() => setMobileSubmenu(null)}>
                  <ChevronDown size={16} className="rotate-90" /> Back
                </button>
                <h3 className="mb-3 text-sm font-bold text-[#273c2e]">{mobileSubmenu.title}</h3>

                {mobileSubmenu.type === 'age' && (
                  <ul className="flex flex-col gap-1">
                    {['0-18 Months', '18-36 Months', '3-5 Years', '5-7 Years', '7-9 Years', '9-12 Years', '12+ Years'].map((age) => (
                      <li
                        key={age}
                        className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#273c2e] transition hover:bg-[#fff7eb]"
                        onClick={() => {
                          navigate(`/products?age=${encodeURIComponent(age)}`);
                          setMobileMenuOpen(false);
                          setMobileSubmenu(null);
                        }}
                      >
                        {age}
                      </li>
                    ))}
                  </ul>
                )}

                {mobileSubmenu.type === 'categories' && (
                  <div>
                    {!mobileSelectedCategory ? (
                      <ul className="flex flex-col gap-1">
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <li
                              key={category.sno}
                              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#273c2e] transition hover:bg-[#fff7eb]"
                              onClick={() => handleMobileSelectCategory(category.sno, category.category_name)}
                            >
                              <div className="flex items-center justify-between">
                                {category.category_name}
                                <ChevronRight size={16} className="text-[#2e79e3]" />
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-2 text-sm text-[#888]">Loading categories...</li>
                        )}
                      </ul>
                    ) : mobileSelectedSubcategory ? (
                      <div>
                        <button type="button" className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2e79e3]" onClick={() => { setMobileSelectedSubcategory(null); setMobileSubSubcategories([]); }}>
                          <ChevronDown size={16} className="rotate-90" /> Back to Subcategories
                        </button>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#273c2e]">{mobileSelectedSubcategory.subcategory_name}</h4>
                        {loadingMobileSubSubcategories ? (
                          <div className="px-4 py-2 text-sm text-[#888]">Loading options...</div>
                        ) : mobileSubSubcategories.length > 0 ? (
                          <ul className="flex flex-col gap-1">
                            {mobileSubSubcategories.map((subSub) => (
                              <li
                                key={subSub.sno || subSub.id}
                                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#273c2e] transition hover:bg-[#fff7eb]"
                                onClick={() => {
                                  navigate(`/products/by-subcategory/${encodeURIComponent(subSub.subcategory_name || subSub.sub_subcategory_name)}`);
                                  setMobileMenuOpen(false);
                                  setMobileSubmenu(null);
                                  setMobileSelectedCategory(null);
                                  setMobileSubcategories([]);
                                  setMobileSelectedSubcategory(null);
                                  setMobileSubSubcategories([]);
                                }}
                              >
                                {subSub.subcategory_name || subSub.sub_subcategory_name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-2 text-sm text-[#888]">No further subcategories available</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <button type="button" className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2e79e3]" onClick={() => { setMobileSelectedCategory(null); setMobileSubcategories([]); }}>
                          <ChevronDown size={16} className="rotate-90" /> Back to Categories
                        </button>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#273c2e]">{mobileSelectedCategory.name}</h4>
                        <ul className="flex flex-col gap-1">
                          {mobileSubcategories.length > 0 ? (
                            mobileSubcategories.map((subcategory) => (
                              <li
                                key={subcategory.sno}
                                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#273c2e] transition hover:bg-[#fff7eb]"
                                onClick={() => handleMobileSelectSubcategory(mobileSelectedCategory.id, subcategory, true)}
                              >
                                <div className="flex items-center justify-between">
                                  {subcategory.subcategory_name}
                                  <ChevronRight size={16} className="text-[#2e79e3]" />
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-sm text-[#888]">No subcategories available</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {mobileSubmenu.type === 'brands' && (
                  <ul className="flex flex-col gap-1">
                    {brands.length > 0 ? (
                      brands.map((brand, index) => (
                        <li
                          key={index}
                          className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[#273c2e] transition hover:bg-[#fff7eb]"
                          onClick={() => {
                            navigate(`/products?brand=${encodeURIComponent(brand.name)}`);
                            setMobileMenuOpen(false);
                            setMobileSubmenu(null);
                          }}
                        >
                          {capitalizeFirstLetter(brand.name)}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-sm text-[#888]">Loading brands...</li>
                    )}
                  </ul>
                )}
              </div>
            ) : (
              <ul className="mobile-nav-list m-0 flex list-none flex-col gap-1 p-0">
                {[
                  { label: 'About', path: '/about' },
                  { label: 'All Products', path: '/products' },
                  { label: 'Age', submenu: 'age' },
                  { label: 'New Arrivals', path: '/products?sort=new' },
                  { label: 'Categories', submenu: 'categories' },
                  { label: 'Brand', submenu: 'brands' },
                  { label: 'Characters & Themes', path: '/products?hasTag=true' },
                  { label: 'Customized Products', path: '/products?customized=true' },
                  { label: 'Special Offers', path: '/products?discount=high' },
                  { label: 'Gift Cards', path: '/giftCards' },
                ].map(({ label, path, submenu }) => (
                  <li
                    key={label}
                    className="mobile-nav-item cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-[#273c2e] transition hover:bg-[#fff7eb]"
                    onClick={() => {
                      if (submenu) {
                        setMobileSubmenu({ type: submenu, title: label });
                      } else {
                        navigate(path);
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {label}
                      {submenu && <ChevronRight size={16} className="text-[#2e79e3]" />}
                    </div>
                  </li>
                ))}

                {user?.role === 'super_admin' && (
                  <li
                    className="mobile-nav-item cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-[#273c2e] transition hover:bg-[#fff7eb]"
                    onClick={() => {
                      navigate('/admin/adminpage');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Admin Dashboard
                  </li>
                )}
              </ul>
            )}

            <div className="mobile-menu-divider my-4 h-px bg-[#ede6d9]" />

            {user ? (
              <div className="mobile-auth-section flex flex-col gap-2">
                <div className="mobile-user-greeting rounded-xl bg-[#f4f7f5] px-4 py-3 text-sm font-semibold text-[#273c2e]">
                  Hi, {user.firstName || user.fullName}
                </div>
                <button type="button" className="mobile-auth-btn orders-btn w-full rounded-xl bg-[#fff7eb] px-4 py-2 text-sm font-semibold text-[#273c2e] transition hover:bg-[#dccaaa]/40" onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}>
                  My Orders
                </button>
                <button type="button" className="mobile-auth-btn orders-btn w-full rounded-xl bg-[#fff7eb] px-4 py-2 text-sm font-semibold text-[#273c2e] transition hover:bg-[#dccaaa]/40" onClick={() => { navigate('/manage-addresses'); setMobileMenuOpen(false); }}>
                  Manage Addresses
                </button>
                <button type="button" className="mobile-auth-btn logout-btn w-full rounded-xl bg-[#fef2f2] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="mobile-auth-section flex flex-col gap-2">
                <button type="button" className="mobile-auth-btn login-btn w-full rounded-xl bg-[#2e79e3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a5a8d]" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                  Login
                </button>
                <button type="button" className="mobile-auth-btn signup-btn w-full rounded-xl bg-[#f01c71] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff4b92]" onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="relative w-[min(92vw,440px)] rounded-[18px] border border-[rgba(182,158,106,0.35)] bg-[#fff7eb] px-7 py-6 text-center font-bold text-[#273c2e] shadow-[0_18px_40px_rgba(39,60,46,0.18)] animate-[kpScaleIn_240ms_ease-out]">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-2 border-white/55 bg-gradient-to-br from-[#6fbf8c] to-[#4f8f70] text-[#fff7eb] shadow-[0_8px_20px_rgba(111,191,140,0.35)]">✓</div>
            <div className="mb-1 text-lg tracking-[0.2px]">{toast.message}</div>
            <div className="text-sm font-medium text-[#4f6354]">See you soon!</div>
          </div>
        </div>
      )}
    </header>

      <div aria-hidden="true" style={{ height: headerHeight }} className="w-full flex-shrink-0" />
    </>
  );
};

export default Header;
