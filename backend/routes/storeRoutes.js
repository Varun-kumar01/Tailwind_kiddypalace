const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');

// Public
router.get('/', storeController.getStores);
router.get('/:id', storeController.getStoreById);

// Admin
router.post('/', authenticateAdmin, storeController.createStore);
router.put('/:id', authenticateAdmin, storeController.updateStore);
router.delete('/:id', authenticateAdmin, storeController.deleteStore);

// Upload store image: POST /api/stores/:id/image
const uploadStore = require('../middleware/uploadStore');
router.post('/:id/image', authenticateAdmin, uploadStore.single('image'), storeController.uploadStoreImage);

module.exports = router;

