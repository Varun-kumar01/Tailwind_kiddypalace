const db = require('../config/db');

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query('SELECT cart_data FROM user_carts WHERE user_id = ?', [userId]);

    if (!rows.length) {
      return res.json({ success: true, cart: [] });
    }

    const cart = rows[0].cart_data ? JSON.parse(rows[0].cart_data) : [];
    return res.json({ success: true, cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching cart' });
  }
};

exports.saveCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = Array.isArray(req.body.cartItems) ? req.body.cartItems : [];

    await db.query(
      `INSERT INTO user_carts (user_id, cart_data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cart_data = VALUES(cart_data), updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(cartItems)]
    );

    return res.json({ success: true, message: 'Cart saved successfully' });
  } catch (error) {
    console.error('Save cart error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving cart' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM user_carts WHERE user_id = ?', [userId]);
    return res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error while clearing cart' });
  }
};
