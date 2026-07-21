import React, { useState } from 'react';
import Header from './Header';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[linear-gradient(135deg,#fff7eb_0%,#eef7ff_45%,#fdeaf2_100%)] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tight text-[#273c2e] sm:text-5xl">Get In Touch</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-[#4f6354] sm:text-lg">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#ede6d9] bg-white/95 p-6 shadow-[0_10px_30px_rgba(39,60,46,0.16)] transition hover:-translate-y-1">
                <div className="mb-3 text-4xl">📍</div>
                <h3 className="mb-2 text-xl font-bold text-[#2e79e3]">Address</h3>
                <p className="text-sm leading-7 text-[#666]"> Plot No-96, Muppas Rd, opp. Rajapushpa Provincia<br /> Narsingi, Hyderabad<br />Telangana 500089</p>
              </div>

              <div className="rounded-2xl border border-[#ede6d9] bg-white/95 p-6 shadow-[0_10px_30px_rgba(39,60,46,0.16)] transition hover:-translate-y-1">
                <div className="mb-3 text-4xl">📞</div>
                <h3 className="mb-2 text-xl font-bold text-[#2e79e3]">Phone</h3>
                <p className="text-sm leading-7 text-[#666]">+91 7075004435</p>
              </div>

              <div className="rounded-2xl border border-[#ede6d9] bg-white/95 p-6 shadow-[0_10px_30px_rgba(39,60,46,0.16)] transition hover:-translate-y-1">
                <div className="mb-3 text-4xl">✉️</div>
                <h3 className="mb-2 text-xl font-bold text-[#2e79e3]">Email</h3>
                <p className="text-sm leading-7 text-[#666]">kiddypalace.ind@gmail.com</p>
              </div>

              <div className="rounded-2xl border border-[#ede6d9] bg-white/95 p-6 shadow-[0_10px_30px_rgba(39,60,46,0.16)] transition hover:-translate-y-1">
                <div className="mb-3 text-4xl">🕒</div>
                <h3 className="mb-2 text-xl font-bold text-[#2e79e3]">Working Hours</h3>
                <p className="text-sm leading-7 text-[#666]">Sunday-Saturday: 8:00 AM - 10:00 PM</ 
                p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ede6d9] bg-white/95 p-6 shadow-[0_10px_30px_rgba(39,60,46,0.16)] sm:p-8">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#43e97b] to-[#38f9d7] text-4xl text-white shadow-[0_10px_30px_rgba(67,233,123,0.4)]">✓</div>
                  <h2 className="text-3xl font-bold text-[#333]">Thank You!</h2>
                  <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#666]">Your message has been sent successfully. We'll get back to you soon!</p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#333]">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                        className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#273c2e] transition focus:-translate-y-0.5 focus:border-[#2e79e3] focus:outline-none focus:ring-4 focus:ring-[#2e79e3]/15"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#333]">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                        className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#273c2e] transition focus:-translate-y-0.5 focus:border-[#2e79e3] focus:outline-none focus:ring-4 focus:ring-[#2e79e3]/15"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-[#333]">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#273c2e] transition focus:-translate-y-0.5 focus:border-[#2e79e3] focus:outline-none focus:ring-4 focus:ring-[#2e79e3]/15"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-[#333]">Subject *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this about?"
                        className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#273c2e] transition focus:-translate-y-0.5 focus:border-[#2e79e3] focus:outline-none focus:ring-4 focus:ring-[#2e79e3]/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-semibold text-[#333]">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      placeholder="Write your message here..."
                      className="w-full rounded-xl border-2 border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[#273c2e] transition focus:-translate-y-0.5 focus:border-[#2e79e3] focus:outline-none focus:ring-4 focus:ring-[#2e79e3]/15"
                    />
                  </div>

                  <button type="submit" className="mx-auto mt-1 block rounded-xl bg-[#E74C8B] px-8 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(79,172,254,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(79,172,254,0.5)]">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
