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

(async () => {
  try {
    const [rows] = await promisePool.query('SELECT sno, category_name FROM category ORDER BY sno');
    const normalizedMap = new Map();

    for (const row of rows) {
      const name = (row.category_name || '').trim();
      if (!name) continue;

      const key = name.toLowerCase();
      if (!normalizedMap.has(key)) {
        normalizedMap.set(key, row.sno);
        await promisePool.query('UPDATE category SET category_name = ? WHERE sno = ?', [name, row.sno]);
        continue;
      }

      const masterId = normalizedMap.get(key);
      const [subcats] = await promisePool.query('SELECT sno, subcategory_name FROM subcategory WHERE category_id = ?', [row.sno]);

      for (const sub of subcats) {
        const [existing] = await promisePool.query(
          'SELECT sno FROM subcategory WHERE category_id = ? AND TRIM(subcategory_name) = ? LIMIT 1',
          [masterId, sub.subcategory_name.trim()]
        );

        if (existing.length === 0) {
          await promisePool.query('UPDATE subcategory SET category_id = ? WHERE sno = ?', [masterId, sub.sno]);
        } else {
          await promisePool.query('DELETE FROM subcategory WHERE sno = ?', [sub.sno]);
        }
      }

      await promisePool.query('UPDATE products SET category_id = ? WHERE category_id = ?', [masterId, row.sno]);
      await promisePool.query('DELETE FROM category WHERE sno = ?', [row.sno]);
      console.log(`Merged duplicate category "${name}" into category ${masterId}`);
    }

    const [finalRows] = await promisePool.query('SELECT sno, category_name FROM category ORDER BY sno');
    console.log('Final categories:', JSON.stringify(finalRows, null, 2));
  } catch (error) {
    console.error('Category normalization failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
