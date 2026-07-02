import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import HomePage from './components/HomePage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import AdminLogin from './components/AdminLogin';
import ProductsPage from './components/ProductsPage';
// import TrendingProductsPage from './components/TrendingProductsPage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import PaymentPage from './components/PaymentPage';
import OrderConfirmationPage from './components/OrderConfirmationPage';
import ContactPage from './components/ContactPage';
import ProductDetails from './components/ProductDetails';
import StoreLocator from './components/StoreLocator';
import GiftCardDetails from './components/GiftCardDetails';
import OrdersPage from './components/OrdersPage';
import GiftCardsComingSoon from './pages/GiftCardsComingSoon';
import ShippingAddresses from './components/ShippingAddresses';
import ManageAddresses from './components/ManageAddresses';
import About from './components/About';
import Careers from './components/Careers';
import SpecialOffersPage from './components/SpecialOffersPage';


function App() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return (
    <CartProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/adminpage" element={<AdminPage />} />
            

            <Route path="/products/by-category/:categoryId" element={<ProductsPage />} />
            <Route path="/products/by-subcategory/:subcategory" element={<ProductsPage />} />
            <Route path="/products/tags" element={<ProductsPage />} />
            {/* <Route path="/products/trending" element={<TrendingProductsPage />} /> */}
            <Route path="/special-offers" element={<SpecialOffersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/about" element={<About user={user} />} />
            <Route path="/careers" element={<Careers user={user} />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/stores" element={<StoreLocator />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/manage-addresses" element={<ManageAddresses />} />
            <Route path="/shipping-addresses" element={<ShippingAddresses user={user} />} />
            {/* <Route path="/giftcards/:id" element={<GiftCardDetails />} /> */}
            <Route path="/giftCards" element={<GiftCardsComingSoon />} />
            <Route path="/characters" element={<ProductsPage />} />
            <Route path="/products/subsubcategory/:subsubcategoryId"element={<ProductsPage />}/>

          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
