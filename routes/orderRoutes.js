const express = require('express');
const router = express.Router();
const {
  createOrder, // ✨ ADDED THIS IMPORT
  getOrders,
  getMyOrders,
  getOrderById,
  handleSmsWebhook,
  updateOrderToPaid
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/webhook/sms').post(handleSmsWebhook);

// Route: /api/orders
router.route('/')
  .post(protect, createOrder)       // ✨ ADDED: Allows logged-in users to create an order
  .get(protect, admin, getOrders);  // Allows admin to view all orders

// Route: /api/orders/myorders
router.route('/myorders').get(protect, getMyOrders);

// Route: /api/orders/:id
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);


module.exports = router;