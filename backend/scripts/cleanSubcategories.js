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
    const [rows] = await promisePool.query('SELECT sno, subcategory_name, category_id FROM subcategory ORDER BY category_id, sno');

    const groups = new Map();

    for (const row of rows) {
      const trimmedName = (row.subcategory_name || '').trim();
      const key = `${row.category_id}::${trimmedName.toLowerCase()}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(row);
    }

    for (const [key, items] of groups.entries()) {
      if (items.length <= 1) {
        const row = items[0];
        if (row && row.subcategory_name !== row.subcategory_name.trim()) {
          await promisePool.query('UPDATE subcategory SET subcategory_name = ? WHERE sno = ?', [row.subcategory_name.trim(), row.sno]);
        }
        continue;
      }

      const keep = items[0];
      const duplicateIds = items.slice(1).map((item) => item.sno);

      if (keep.subcategory_name !== keep.subcategory_name.trim()) {
        await promisePool.query('UPDATE subcategory SET subcategory_name = ? WHERE sno = ?', [keep.subcategory_name.trim(), keep.sno]);
      }

      if (duplicateIds.length > 0) {
        await promisePool.query(
          `UPDATE products SET subcategory_id = ? WHERE subcategory_id IN (${duplicateIds.map(() => '?').join(',')})`,
          [keep.sno, ...duplicateIds]
        );
        await promisePool.query(`DELETE FROM subcategory WHERE sno IN (${duplicateIds.map(() => '?').join(',')})`, duplicateIds);
        console.log(`Merged ${duplicateIds.length} duplicate subcategory rows for ${keep.subcategory_name.trim()} under category ${keep.category_id}`);
      }
    }

    const [finalRows] = await promisePool.query('SELECT sno, subcategory_name, category_id FROM subcategory ORDER BY category_id, sno');
    console.log('Cleaned subcategories:', JSON.stringify(finalRows, null, 2));
  } catch (error) {
    console.error('Subcategory cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
