const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const aboutRoutes = require('./routes/aboutRoutes');
const careersRoutes = require('./routes/careersRoutes');

const config = require('./config/config');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminAuthRoutes = require('./routes/adminAuth');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes'); // ✅ new
const shippingRoutes = require('./routes/shippingRoutes');
const brandRoutes = require('./routes/brands');
const settingsRoutes = require('./routes/settingRoutes');
const tagRoutes = require('./routes/tags'); // 👈 ADDED
const cartRoutes = require('./routes/cartRoutes');

const ensureAboutTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS about (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ about table is ready');
    
    // Insert default content if table is empty
    const [rows] = await db.query('SELECT * FROM about WHERE id = 1');
    if (!rows || rows.length === 0) {
      await db.query(
        'INSERT INTO about (id, content) VALUES (1, ?)',
        ['Welcome to KiddyPalace - Your Premier Kids Store. We offer a wide range of quality toys, educational materials, and children\'s products.']
      );
      console.log('✅ about table initialized with default content');
    }
  } catch (err) {
    console.error('Error ensuring about table:', err.message);
  }
};

const ensureCareersTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS careers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ careers table is ready');
    
    // Insert default content if table is empty
    const [rows] = await db.query('SELECT * FROM careers WHERE id = 1');
    if (!rows || rows.length === 0) {
      await db.query(
        'INSERT INTO careers (id, content) VALUES (1, ?)',
        ['Join Our Team - We\'re always looking for talented individuals to join KiddyPalace! If you\'re passionate about creating a wonderful experience for children and their families, we\'d love to hear from you.']
      );
      console.log('✅ careers table initialized with default content');
    }
  } catch (err) {
    console.error('Error ensuring careers table:', err.message);
  }
};

const ensureProductImagesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_sort_order (sort_order)
      )
    `);
    console.log('✅ product_images table is ready');
  } catch (err) {
    console.error('Error ensuring product_images table:', err.message);
  }
};

const ensureUserCartsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cart_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ user_carts table is ready');
  } catch (err) {
    console.error('Error ensuring user_carts table:', err.message);
  }
};

ensureAboutTable();
ensureCareersTable();
ensureProductImagesTable();
ensureUserCartsTable();



// const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// ✅ CORS configuration to allow credentials from frontend
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));


app.use("/uploads", express.static("uploads"));


// Serve uploaded images
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', categoryRoutes);
app.use('/api', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/tags', tagRoutes); // 👈 ADDED

// Mount gift cards routes under /api/giftcards
app.use('/api/giftcards', giftCardRoutes);

// Shipping addresses routes
app.use('/api/shipping-addresses', shippingRoutes);

// Settings routes (announcements, etc.)
// app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working correctly', timestamp: new Date().toISOString() });
});

app.use('/api/settings', settingsRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/careers', careersRoutes);

// Stores routes (public + admin)
app.use('/api/stores', require('./routes/storeRoutes'));

// 404 handler for API routes - always return JSON
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
  });
});

// General 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found' 
  });
});

// Error handler middleware - always return JSON
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(config.PORT, () => {
  console.log(`✅ Server is running on port ${config.PORT}`);
  console.log(`📋 Environment: ${config.NODE_ENV}`);
});


