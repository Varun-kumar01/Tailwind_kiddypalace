import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import { API_BASE_URL } from "./config";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { orderData } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [paymentOption, setPaymentOption] = useState('online');

  // Razorpay key will be provided by backend create-order API

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (!orderData) {
      navigate('/cart');
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const handlePayment = async () => {
    if (paymentOption === 'cod') {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: orderData.userId,
            items: orderData.items,
            totalAmount: orderData.total,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: 'cod',
            paymentDetails: { method: 'COD' },
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          navigate('/order-confirmation', {
            state: {
              orderId: data.orderId,
              orderData: orderData,
              paymentMethod: 'cod',
            },
          });
        } else {
          alert(data.message || 'Failed to place order. Please try again.');
        }
      } catch (error) {
        console.error('COD order error:', error);
        alert('Error placing order. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setLoading(false);
      alert('Razorpay SDK failed to load. Check your network.');
      return;
    }

    // Ask backend to create a Razorpay order
    let createOrderRes;
    try {
      createOrderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderData.total, currency: 'INR' }),
      });
    } catch (e) {
      setLoading(false);
      alert('Unable to reach payment service.');
      return;
    }

    const createOrderData = await createOrderRes.json();
    if (!createOrderData.success) {
      setLoading(false);
      alert(createOrderData.message || 'Failed to initialize payment');
      return;
    }

    const { order, keyId } = createOrderData;

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Checkout Payment',
      description: 'Order payment',
      order_id: order.id,
      prefill: {
        name: orderData.shippingAddress.fullName,
        email: orderData.shippingAddress.email,
        contact: orderData.shippingAddress.phone,
      },
      notes: {
        itemsCount: String(orderData.items.length),
      },
      theme: { color: '#3399cc' },
      handler: async function (response) {
        try {
          // Verify payment signature on backend first
          const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            alert('Payment verification failed. Your payment will be reversed if debited.');
            setLoading(false);
            return;
          }

          // Create order in backend after successful verification
          const paymentMethod = 'razorpay';
          const res = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: orderData.userId,
              items: orderData.items,
              totalAmount: orderData.total,
              shippingAddress: orderData.shippingAddress,
              paymentMethod,
              paymentDetails: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            }),
          });
          const data = await res.json();
          if (data.success) {
            navigate('/order-confirmation', {
              state: {
                orderId: data.orderId,
                orderData: orderData,
                paymentMethod,
              },
            });
          } else {
            alert(data.message || 'Failed to place order after payment');
          }
        } catch (err) {
          console.error('Order creation error after payment:', err);
          alert('Payment succeeded but order placement failed. Contact support.');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: false,
        emi: false,
      },
      config: {
        display: {
          preferences: {
            show_default_blocks: true,
          },
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white px-3 py-5 text-[#273c2e] sm:px-6 lg:px-8 lg:py-10 overflow-x-hidden">
       <div className="mx-auto w-full max-w-[1400px] px-1 sm:px-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            {/* Left Side - Payment Information */}
            <div>
              <h2 className="mb-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#273c2e]">Select Payment Option</h2>

              <div
                className={`mb-5 cursor-pointer rounded-2xl border bg-white p-4 sm:p-6 shadow-[0_8px_24px_rgba(39,60,46,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(39,60,46,0.2)] ${
                  paymentOption === 'online' ? 'border-[#2e79e3] ring-2 ring-[#2e79e3]/30' : 'border-[#ede6d9]'
                }`}
                onClick={() => setPaymentOption('online')}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">💳</div>
                  <div>
                    <h3 className="text-xl font-bold text-black">Online Payment</h3>
                    <p className="text-sm text-black">UPI, QR, Cards, Netbanking via Razorpay</p>
                  </div>
                </div>
                {paymentOption === 'online' && (
                  <div className="mt-5 border-t-2 border-black pt-5 text-sm text-black">
                    <p className="leading-6">
                      You will be redirected to the Razorpay window. Choose from UPI, Cards, Netbanking,
                      or QR to complete your payment securely.
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      <li className="text-sm">Instant confirmation after payment</li>
                      <li className="text-sm">Supports all major UPI apps and banks</li>
                      <li className="text-sm">Card payments with OTP verification</li>
                    </ul>
                  </div>
                )}
              </div>

              <div
                className={`cursor-pointer rounded-2xl border bg-white p-4 sm:p-6 shadow-[0_8px_24px_rgba(39,60,46,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(39,60,46,0.2)] ${
                  paymentOption === 'cod' ? 'border-[#2e79e3] ring-2 ring-[#2e79e3]/30' : 'border-[#ede6d9]'
                }`}
                onClick={() => setPaymentOption('cod')}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">💵</div>
                  <div>
                    <h3 className="text-xl font-bold text-black">Cash on Delivery</h3>
                    <p className="text-sm text-black">Pay with cash when the order arrives</p>
                  </div>
                </div>
                {paymentOption === 'cod' && (
                  <div className="mt-5 border-t-2 border-black pt-5 text-sm text-black">
                    <p className="leading-6">
                      Confirm your order now and pay the delivery partner in cash once you receive your package.
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      <li className="text-sm">No online payment required</li>
                      <li className="text-sm">Order will move straight to processing</li>
                      <li className="text-sm">Available for eligible pin codes only</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Order Summary */}
            <div>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#273c2e]">Order Summary</h2>
              
              <div className="relative lg:sticky lg:top-24 rounded-2xl border border-[#eee] bg-gradient-to-b from-white to-[#fafafa] p-5 shadow-[0_6px_14px_rgba(0,0,0,0.06)]">
                <div>
                  <h3 className="mb-4 border-b-2 border-black pb-2 text-xl font-bold text-black">Items ({orderData.items.length})</h3>
                  {orderData.items.map((item, index) => {
                    const originalPrice = item.original_price || item.price;
                    const discountAmount = originalPrice - item.price;
                    return (
                      <div key={index} className="flex items-center justify-between border-b border-black py-3">
                       <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate text-sm font-semibold text-black">{item.name}</span>
                          <span className="text-xs text-[#6c7d6e]">Qty: {item.quantity}</span>
                          {discountAmount > 0 && (
                            <span className="mt-1 text-[11px] text-[#10b981]">
                              Save ₹{(discountAmount * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {discountAmount > 0 && (
                            <div className="text-xs text-[#999] line-through">
                              ₹{(originalPrice * item.quantity).toFixed(2)}
                            </div>
                          )}
                          <span className="text-base font-bold text-black">₹{(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="my-5 border-y-2 border-black py-4">
                  <div className="flex items-center justify-between py-1 text-sm text-black">
                    <span>Original Price</span>
                    <span>₹{orderData.items.reduce((sum, item) => sum + ((item.original_price || item.price) * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-sm font-semibold text-[#10b981]">
                    <span>Discount</span>
                    <span>-₹{(orderData.items.reduce((sum, item) => sum + ((item.original_price || item.price) * item.quantity), 0) - Number(orderData.subtotal)).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-sm text-black">
                    <span>Subtotal</span>
                    <span>₹{Number(orderData.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t-2 border-black pt-3 text-xl font-bold text-black">
                    <span>Total Amount</span>
                    <span>₹{Number(orderData.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2e79e3] bg-white p-4">
                  <h3 className="mb-2 text-lg font-bold text-black">Shipping Address</h3>
                  <p className="text-sm leading-6 text-black">{orderData.shippingAddress.fullName}</p>
                  <p className="text-sm leading-6 text-black">{orderData.shippingAddress.address}</p>
                  <p className="text-sm leading-6 text-black">{orderData.shippingAddress.city}, {orderData.shippingAddress.zipCode}</p>
                  <p className="text-sm leading-6 text-black">📞 {orderData.shippingAddress.phone}</p>
                  <p className="text-sm leading-6 text-black">✉️ {orderData.shippingAddress.email}</p>
                </div>

                <button 
                  className="relative mt-5 w-full overflow-hidden rounded-xl bg-[#2e79e3] px-4 py-4 text-base font-bold uppercase tracking-[0.06em] text-white shadow-[0_8px_20px_rgba(182,158,106,0.45)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" 
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading 
  ? '⏳ Processing...' 
  : paymentOption === 'cod' 
    ? `Place Order (COD) ₹${Number(orderData.total).toFixed(2)}`
    : `Pay ₹${Number(orderData.total).toFixed(2)}`}     
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#4f6354]">
                  <span className="text-base">🔒</span>
                  <p className="text-center">
                    {paymentOption === 'online'
                      ? 'Secure Payment - Your information is protected'
                      : 'Order now, pay safely on delivery'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
