const express = require('express');
const router = express.Router();
const { verifySmsPayment, submitManualPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Both routes must be protected (User must be logged in to pay)
// router.post('/create-order', protect, createOrder);
// router.post('/verify', protect, verifyPayment);

router.post('/verify-sms', verifySmsPayment);

// Route for Web Frontend (User must be logged in to submit UTR)
router.put('/:id/pay', protect, submitManualPayment);

module.exports = router;