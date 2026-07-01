import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from './config';
import slide1 from '../components/assets/slides/slide1.jpg';
import slide2 from '../components/assets/slides/slide2.jpg';
import slide3 from '../components/assets/slides/slide3.jpg';
import img018 from '../components/assets/slides/0-18.png';
import img1836 from '../components/assets/slides/18-36.png';
import img0305 from '../components/assets/slides/3-5.png';
import img0507 from '../components/assets/slides/5-7.png';
import img0709 from '../components/assets/slides/7-9.png';
import img0912 from '../components/assets/slides/9-12.png';
import img12 from '../components/assets/slides/12+.png';
import barbie from '../components/assets/slides/barbie.jpg';
import cat1 from '../components/assets/slides/wriring.jpeg';
import cat2 from '../components/assets/slides/paper products.jpg';
import cat3 from '../components/assets/slides/accessories.jpeg';
import cat4 from '../components/assets/slides/stationary.jpg';
import cat5 from '../components/assets/slides/games and toys.jpg';
import cat6 from '../components/assets/slides/arts and crafts.jpg';
import cat7 from '../components/assets/slides/party supplies.jpg';
import cat8 from '../components/assets/slides/Educational Meterials.jpg';
import cat9 from '../components/assets/slides/Files   folder.jpg';

const categoryImages = [cat1, cat2, cat3, cat4, cat5, cat6, cat7, cat8, cat9];

const prices = [
  { label: '₹99', maxPrice: 99 },
  { label: '₹299', maxPrice: 299 },
  { label: '₹499', maxPrice: 499 },
  { label: '₹699', maxPrice: 699 },
  { label: '₹999', maxPrice: 999 },
  { label: '₹1200', maxPrice: 1200 },
];

const ageRanges = [
  { label: '0 - 18 Months', age: '0-18 Months', icon: img018, bgClass: 'bg-[#FFB6C1]' },
  { label: '18 - 36 Months', age: '18-36 Months', icon: img1836, bgClass: 'bg-[#87CEEB]' },
  { label: '3 - 5 Years', age: '3-5 Years', icon: img0305, bgClass: 'bg-[#DDA0DD]' },
  { label: '5 - 7 Years', age: '5-7 Years', icon: img0507, bgClass: 'bg-[#F0E68C]' },
  { label: '7 - 9 Years', age: '7-9 Years', icon: img0709, bgClass: 'bg-[#B0E0E6]' },
  { label: '9 - 12 Years', age: '9-12 Years', icon: img0912, bgClass: 'bg-[#98FB98]' },
  { label: '12+ Years', age: '12+ years', icon: img12, bgClass: 'bg-[#FFA07A]' },
];

const HeroSlider = ({ slides = [], interval = 2000 }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if (!slides.length) return undefined;

    timerRef.current = window.setInterval(() => {
      if (!hoveringRef.current) {
        setCurrent((value) => (value + 1) % slides.length);
      }
    }, interval);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [interval, slides.length]);

  const goToSlide = (index) => setCurrent(index);

  if (!slides.length) return null;

  return (
   <div
  className="
    relative overflow-hidden 
    rounded-lg sm:rounded-xl lg:rounded-[26px] 
    bg-[#0f6a73]

    xl:mx-[-30px]
    2xl:mx-[-60px]
    3xl:mx-[-120px]
    [@media(min-width:2560px)]:mx-[-60px]
  "

      onMouseEnter={() => {
        hoveringRef.current = true;
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
      }}
    >
      <div className="relative aspect-[16/9] min-h-[220px] w-full sm:aspect-[16/5] sm:min-h-[260px] lg:min-h-[300px]">
        {slides.map((slide, index) => (
          <div
            key={slide.title || index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              // index === current ? 'opacity-100' : 'opacity-0'
              index === current
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <img src={slide.image} alt={slide.title || slide.subtitle || 'Hero slide'} className="h-full w-full object-cover" />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/50 via-black/25 to-transparent sm:from-[#0f6a73]/20 sm:via-transparent" />
            <div className="absolute inset-0 flex items-end p-3 sm:p-4 lg:p-5">
              <div className="max-w-xl space-y-2 text-white pl-1 pr-3 sm:pl-4 sm:pr-0 lg:pl-6">
                {slide.title ? <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-[2.1rem]">{slide.title}</h1> : null}
                <p className="max-w-[92%] text-[0.8rem] leading-5 text-white/95 sm:max-w-lg sm:text-[0.8rem]">{slide.subtitle}</p>
                {slide.cta ? (
                  <button
                    type="button"
                    onClick={
                      slide.onClick
                    }
                    className="inline-flex items-center rounded-full bg-[#f01c71] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#f46f56]/35 transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff8f72]"
                  >
                    {slide.cta}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCurrent((value) => (value - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 px-2 py-1.5 text-lg font-semibold text-[#1b3137] shadow-lg transition hover:bg-white sm:block"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => setCurrent((value) => (value + 1) % slides.length)}
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 px-2 py-1.5 text-lg font-semibold text-[#1b3137] shadow-lg transition hover:bg-white sm:block"
        aria-label="Next slide"
      >
        ›
      </button>

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
        {slides.map((slide, index) => (
          <button
            key={slide.title || index}
            type="button"
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${index === current ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const SectionShell = ({ id, title, actionLabel, onAction, children, centeredTitle = false, tone = 'soft' }) => (
  <section
    id={id}
    className={` scroll-mt-32 
    rounded-lg sm:rounded-xl lg:rounded-[20px] 
    border-2 
    p-4 sm:p-5 
    shadow-[0_12px_30px_rgba(27,49,55,0.1)]

    xl:mx-[-30px]
    2xl:mx-[-60px]
    3xl:mx-[-120px]
    4xl:mx-[-160px] ${
      tone === 'soft' ? 'border-[#d5dfd7] bg-[#fbfbf6]' : 'border-[#c7d9dc] bg-white'
    }`}
  >
    <div className={`mb-5 flex flex-wrap items-end gap-3 border-b border-[#dfe7e9] pb-3 ${centeredTitle ? 'justify-center' : 'justify-between'}`}>
      <h2
        className={`relative pl-4 text-[1.05rem] font-extrabold tracking-tight text-[#1b3137] sm:text-[1.85rem] ${
          centeredTitle ? 'text-center pl-0 before:hidden' : ''
        } before:absolute before:left-0 before:top-1 before:h-8 before:w-1 before:rounded-full before:bg-[#f46f56] sm:before:top-2 sm:before:h-9`}
      >
        {title}
      </h2>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
    {children}
  </section>
);

const HomePage = () => {
  const navigate = useNavigate();

  const ageScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const brandScrollRef = useRef(null);
  const characterScrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [specialOffers, setSpecialOffers] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading categories', error);
        setCategories([]);
      }
    };

    const fetchNewArrivals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/new-arrivals?time=${Date.now()}`);
        const data = await response.json();
        setNewArrivals(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        console.error('Error loading new arrivals', error);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const data = await response.json();
        const uniqueBrandsMap = new Map();

        (Array.isArray(data) ? data : []).forEach((brand) => {
          const key = `${String(brand.name || '').toLowerCase()}|${brand.logo_url || ''}`;
          if (!uniqueBrandsMap.has(key)) {
            uniqueBrandsMap.set(key, brand);
          }
        });

        setBrands(Array.from(uniqueBrandsMap.values()));
      } catch (error) {
        console.error('Error fetching brands', error);
      }
    };

    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/tags`);
        const data = await response.json();
        setTags(data.success && Array.isArray(data.tags) ? data.tags : []);
      } catch (error) {
        console.error('Error loading tags from database:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    const fetchSpecialOffers = async () => {
      try {
        // const response = await fetch(`${API_BASE_URL}/api/products?discount=high&time=${Date.now()}`);
       const response = await fetch(`${API_BASE_URL}/api/discount/high?t=${Date.now()}`);
        const data = await response.json();
        setSpecialOffers(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        console.error('Error loading special offers', error);
      }
    };

    fetchCategories();
    fetchNewArrivals();
    fetchBrands();
    fetchTags();
    fetchSpecialOffers();
  }, []);

  const slides = useMemo(
    () => [
      {
        image: slide1,
        title: 'New Arrivals!',
        subtitle: 'Check out the latest products in our store.',
        cta: 'Shop Now',
        onClick: () => navigate('/products?new=true'),

      },
      {
        image: slide2,
        title: 'Mega Sale!',
        subtitle: 'Up to 50% off on select items.',
        cta: 'Grab Offers',
        onClick: () => navigate('/special-offers'),
      },
      {
        image: slide3,
        title: 'Delivery',
        subtitle: 'Get your orders delivered within 24 hours.',
        cta: 'Order Now',
        onClick: () => navigate('/products'),
      },
    ],
    [navigate]
  );

  const scrollRefByAmount = (ref, direction) => {
    const track = ref.current;
    if (!track) return;

    const card = track.querySelector('[data-scroll-card="true"]');
    const cardWidth = card ? card.getBoundingClientRect().width : 240;
    const gap = window.innerWidth >= 1024 ? 24 : 16;
    const step = Math.round(cardWidth + gap);

    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f5ee] text-[#1b3137] overflow-x-hidden">
      <Header />

     <main className="flex-1 py-5 lg:py-7 space-y-10 px-3 sm:px-4 lg:px-6 xl:px-10 2xl:px-20 [@media(min-width:2560px)]:px-32">
      <div className="
  mx-auto w-full 
  max-w-[1400px]
  xl:max-w-[1600px]
  2xl:max-w-[1800px]
  3xl:max-w-[2000px]

  [@media(min-width:2560px)]:max-w-[2400px]
">
    
        <HeroSlider slides={slides} />

        <SectionShell title="Shop by Price" tone="soft">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-6">
            {prices.map((price) => (
              <button
                key={price.label}
                type="button"
                onClick={() => navigate(`/products?price=0-${price.maxPrice}`)}
                className="group overflow-hidden rounded-[28px] border border-[#dfe8ed] bg-white p-1">
  <div className="relative flex h-28 flex-col justify-between overflow-hidden rounded-[26px] border border-white/70 bg-white/95 px-4 py-4 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] price-card-image">
                  <div className="absolute -right-4 top-3 h-16 w-16 rounded-full bg-white/70 blur-2xl opacity-80" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#0f6a73]/80">
                      Under
                    </span>
                  </div>
                  <div className="relative z-10">
                    <span className="block text-4xl font-black tracking-[-0.05em] text-[#c20d20] sm:text-[2.3rem]">
                      {price.label}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-[#1f3a43]/85">
                      Shop best selling picks
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Shop by Age">
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollRefByAmount(ageScrollRef, -1)}
              className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-[#1b3137] shadow-md transition hover:bg-white sm:left-2 sm:flex "
              aria-label="Scroll ages left"
            >
              ‹
            </button>

           <div
  ref={ageScrollRef}
  className="
    no-scrollbar 
    flex 
    gap-4 
    overflow-x-auto 
    px-3 pb-2 
    scroll-smooth
    lg:overflow-x-hidden
lg:justify-between

    sm:px-4

    lg:gap-5
    xl:gap-6
    2xl:gap-7
  "
>
              {ageRanges.map((age) => (
              <button
  key={age.age}
  data-scroll-card="true"
  type="button"
  onClick={() => navigate(`/products?age=${age.age}`)}
  className={`min-w-[160px] sm:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px]
flex-shrink-0 snap-start rounded-3xl border-2 border-[#ccdfe2] ${age.bgClass} p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md`}
>
  <div className="flex h-36 sm:h-40 items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl">
  <img
    src={age.icon}
    alt={age.label}
    className="h-full w-full object-cover"
  />
</div>

  <div className="mt-4 min-h-[2.5rem] text-sm font-bold uppercase tracking-wide text-black">
    {age.label}
  </div>
</button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollRefByAmount(ageScrollRef, 1)}
              className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-[#1b3137] shadow-md transition hover:bg-white sm:right-2 sm:flex "
              aria-label="Scroll ages right"
            >
              ›
            </button>
          </div>
        </SectionShell>

        <SectionShell title="Shop by Categories" tone="soft">
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollRefByAmount(categoryScrollRef, -1)}
              className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-[#1b3137] shadow-md transition hover:bg-white sm:left-2 sm:flex"
              aria-label="Scroll categories left"
            >
              ‹
            </button>

            <div
              ref={categoryScrollRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-2 scroll-smooth [scroll-padding-inline:0.125rem] sm:px-4 sm:[scroll-padding-inline:1rem] lg:px-6 lg:[scroll-padding-inline:1.5rem]"
            >
              {(Array.isArray(categories) ? categories : []).slice(0, 9).map((category, index) => (
                <button
                  key={category.sno}
                  data-scroll-card="true"
                  type="button"
                  onClick={() => navigate(`/products/by-category/${category.sno}`)}
                  className="min-w-[176px] sm:min-w-[200px] lg:min-w-[220px] snap-start rounded-3xl border-2 border-[#ccdfe2] bg-white p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <img
                    src={categoryImages[index % categoryImages.length]}
                    alt={category.category_name}
                    className="h-32 w-full rounded-lg sm:rounded-xl lg:rounded-2xl object-cover"
                  />
                  <div className="mt-4 min-h-[2.5rem] text-sm font-bold uppercase tracking-wide text-[#1b3137]">
                    {category.category_name}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollRefByAmount(categoryScrollRef, 1)}
              className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-[#1b3137] shadow-md transition hover:bg-white sm:right-2 sm:flex"
              aria-label="Scroll categories right"
            >
              ›
            </button>
          </div>
        </SectionShell>

        <SectionShell id="new-arrivals" title="New Arrivals" actionLabel="View All" onAction={() => navigate('/products?new=true')}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {newArrivals.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/product/${item.id}`)}
                className="relative flex h-full flex-col rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-[#ccdfe2] bg-white p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {item.discount_percent > 0 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#f01c71] to-[#ff4b92] px-3 py-1 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(240,28,113,0.28)]">
                    {item.discount_percent}% OFF
                  </span>
                ) : null}
               <div className="h-40 w-full flex items-center justify-center bg-white rounded-lg sm:rounded-lg lg:rounded-xl p-2">
  <img
    src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/placeholder-product.png'}
    alt={item.name}
    loading="lazy"
    className="max-h-full max-w-full object-contain"
  />
</div>
                <div className="mt-4 space-y-1.5">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#1b3137]">{item.name}</h3>
                  <p className="text-base font-bold text-[#0f6a73]">₹{item.price}</p>
                </div>
              </button>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Explore by Brand" tone="soft">
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollRefByAmount(brandScrollRef, -1)}
              className="absolute left-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-[#1b3137] shadow-md transition hover:bg-white sm:left-2 sm:flex"
              aria-label="Scroll brands left"
            >
              ‹
            </button>

              <div ref={brandScrollRef} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 scroll-smooth [scroll-padding-inline:0.25rem] sm:px-6 sm:[scroll-padding-inline:1.5rem] lg:px-8 lg:[scroll-padding-inline:2rem]">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  data-scroll-card="true"
                  type="button"
                  onClick={() => navigate(`/products?brand=${brand.name}`)}
                  className="min-w-[158px] snap-start rounded-lg sm:rounded-lg lg:rounded-2xl border-2 border-[#ccdfe2] bg-white p-3 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <img
                    src={`${API_BASE_URL}${brand.logo_url}`}
                    alt={brand.name}
                    onError={(event) => {
                      event.currentTarget.src = '/placeholder-brand.png';
                    }}
                    className="h-24 w-full rounded-lg sm:rounded-lg lg:rounded-xl object-contain bg-white p-3"
                  />
                  <p className="mt-4 min-h-[2.5rem] truncate text-sm font-bold uppercase tracking-wide text-[#1b3137]">{brand.name}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollRefByAmount(brandScrollRef, 1)}
              className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-[#1b3137] shadow-md transition hover:bg-white sm:right-2 sm:flex"
              aria-label="Scroll brands right"
            >
              ›
            </button>
          </div>
        </SectionShell>

        {/* <SectionShell title="Trending Products" actionLabel="View All" onAction={() => navigate('/products?discount=high')}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {specialOffers.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/product/${item.id}`)}
                className="relative flex h-full flex-col rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-[#ccdfe2] bg-white p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {item.discount_percent > 0 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#f01c71] to-[#ff4b92] px-3 py-1 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(240,28,113,0.28)]">
                    {item.discount_percent}% OFF
                  </span>
                ) : null}
               <div className="h-44 w-full flex items-center justify-center bg-white rounded-lg sm:rounded-lg lg:rounded-xl p-2">
  <img
    src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/placeholder-product.png'}
    alt={item.name}
    loading="lazy"
    className="max-h-full max-w-full object-contain"
  />
</div>
                <div className="mt-4 space-y-1.5">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#1b3137]">{item.name}</h3>
                  <p className="text-base font-bold text-[#0f6a73]">₹{item.price}</p>
                </div>
              </button>
            ))}
          </div>
        </SectionShell> */}

        <SectionShell
          title="Special Offers"
          actionLabel="View All"
          onAction={() => navigate('/special-offers')}
        ></SectionShell>

        <SectionShell title="Shop by Character or Themes" tone="soft">
          {tagsLoading ? (
            <p className="py-10 text-center text-sm text-[#666]">Loading characters...</p>
          ) : tags.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollRefByAmount(characterScrollRef, -1)}
                className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-lg text-[#1b3137] shadow-md transition hover:bg-white sm:left-2 sm:flex "
                aria-label="Scroll characters left"
              >
                ‹
              </button>

              <div ref={characterScrollRef} className="  no-scrollbar flex gap-4 sm:gap-5 lg:gap-6 xl:gap-8 2xl:gap-10
  overflow-x-auto px-3 sm:px-4 xl:px-10 2xl:px-16
  scroll-smooth px-3 pb-2 scroll-smooth [scroll-padding-inline:0.125rem] sm:px-4 sm:[scroll-padding-inline:1rem] lg:px-6 lg:[scroll-padding-inline:1.5rem]">
                {tags.map((character) => (
                  <button
                    key={character.id}
                    data-scroll-card="true"
                    type="button"
                    onClick={() => navigate(`/products?tag=${character.id}`)}
                    className="min-w-[160px] sm:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px] 2xl:min-w-[240px] snap-start rounded-3xl border-2 border-[#ccdfe2] bg-white p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    {character.image ? (
                      <img
                        src={`${API_BASE_URL}${character.image}`}
                        alt={character.name}
                        onError={(event) => {
                          event.currentTarget.src = barbie;
                        }}
                        className="h-40 w-full rounded-lg sm:rounded-xl lg:rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#f0f0f0] text-sm text-[#999]">
                        No Image
                      </div>
                    )}
                    <p className="mt-4 min-h-[2.5rem] text-sm font-bold uppercase tracking-wide text-[#1b3137]">{character.name}</p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollRefByAmount(characterScrollRef, 1)}
                className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-[#1b3137] shadow-md transition hover:bg-white sm:right-2 sm:flex "
                aria-label="Scroll characters right"
              >
                ›
              </button>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[#999]">No characters/themes available yet</p>
          )}
        </SectionShell>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;