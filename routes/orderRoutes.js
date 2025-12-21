const express = require('express');
const router = express.Router();
const {
  getOrders,
  getMyOrders,
  getOrderById
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin gets all orders
router.route('/').get(protect, admin, getOrders);

// User gets their own orders
router.route('/myorders').get(protect, getMyOrders);

// Get single order details
router.route('/:id').get(protect, getOrderById);

module.exports = router;