const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/userAuth');
const cartController = require('../controllers/cartController');

router.get('/', authenticateUser, cartController.getCart);
router.post('/', authenticateUser, cartController.saveCart);
router.delete('/', authenticateUser, cartController.clearCart);

module.exports = router;
