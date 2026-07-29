const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

const categorySubcategories = [
  {
    category: 'Writing Instruments',
    subcategories: ['Pens', 'Pencils', 'Markers', 'Highlighters', 'Erasers & Sharpeners'],
  },
  {
    category: 'Paper Products',
    subcategories: ['Notebooks', 'Planners', 'Charts & Paper', 'Drawing Sheets', 'Sticky Notes'],
  },
  {
    category: 'Accessories',
    subcategories: ['Glue & Adhesives', 'Rulers', 'Geometry & Pencil Cases', 'Paper Punches', 'Binder Clips', 'Staplers', 'Calculators', 'Pencil Grips', 'Page Flags', 'Easel Pads', 'Push Pins', 'Magnifying Glasses', 'Paper Clips', 'Desk Organizers', 'Pen Holders', 'Rubber Bands', 'Stamps & Ink', 'Exam Pads', 'Correction Tapes', 'Cutting Tools'],
  },
  {
    category: 'Stationery Sets and Gift Items',
    subcategories: ['Stationery Sets', 'Gift Boxes', 'Gift Wrap', 'Desk Kits', 'Craft Kits'],
  },
  {
    category: 'Games & Toys',
    subcategories: ['Educational Toys', 'Puzzle Games', 'Building Blocks', 'Board Games', 'Outdoor Games'],
  },
  {
    category: 'Art & Craft Supplies',
    subcategories: ['Crayons & Oil Pastels', 'Paints & Brushes', 'Sketch Pads', 'Modeling Supplies', 'Stickers', 'Masking Tapes', 'Craft Tools'],
  },
  {
    category: 'Party  Supplies',
    subcategories: ['Balloons', 'Decorations', 'Candles', 'Cutlery', 'Tableware', 'Birthday Kits'],
  },
  {
    category: 'Educational Materials',
    subcategories: ['Project Materials', 'Flashcards', 'Workbooks', 'Learning Kits', 'Activity Books'],
  },
  {
    category: 'Files & Folders',
    subcategories: ['File Folders', 'Expanding Files', 'Document Wallets', 'Label Tabs', 'Arch Files' ],
  },
];

(async () => {
  try {
    for (const entry of categorySubcategories) {
      const normalizedName = entry.category.trim();
      const [existingCategoryRows] = await promisePool.query(
        'SELECT sno FROM category WHERE TRIM(category_name) = ? LIMIT 1',
        [normalizedName]
      );

      let categoryId;
      if (existingCategoryRows.length > 0) {
        categoryId = existingCategoryRows[0].sno;
      } else {
        const [insertResult] = await promisePool.query(
          'INSERT INTO category (category_name) VALUES (?)',
          [normalizedName]
        );
        categoryId = insertResult.insertId;
        console.log(`Created category: ${normalizedName}`);
      }

      for (const subcategory of entry.subcategories) {
        const trimmedSubcategory = subcategory.trim();
        const [existingSubRows] = await promisePool.query(
          'SELECT sno FROM subcategory WHERE TRIM(subcategory_name) = ? AND category_id = ? LIMIT 1',
          [trimmedSubcategory, categoryId]
        );

        if (existingSubRows.length === 0) {
          await promisePool.query(
            'INSERT INTO subcategory (subcategory_name, category_id) VALUES (?, ?)',
            [trimmedSubcategory, categoryId]
          );
          console.log(`Added subcategory "${trimmedSubcategory}" to "${normalizedName}"`);
        }
      }
    }

    console.log('Subcategory seeding completed.');
  } catch (error) {
    console.error('Subcategory seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
