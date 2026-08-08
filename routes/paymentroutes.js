const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controller functions
const { createOrder, verifyPayment } = require("../controllers/paymentController");

// ✅ Test route without auth middleware
router.post("/create-order-test", (req, res) => {
  res.json({ msg: "Payment route is alive" });
});

// ✅ Actual routes (temporarily without protect)
router.post("/create-orders", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
