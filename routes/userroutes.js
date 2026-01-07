const express = require('express');
const router = express.Router();
const { getUserProfile, addToCart, removeFromCart, getUsers, getUserCart } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/authMiddleware');
const { getUserById } = require('../controllers/userController');

router.get('/profile', protect, getUserProfile);
router.get('/users', protect, getUsers);
router.post('/cart', protect, addToCart)
router.get('/cart', protect, getUserCart);
router.delete('/cart/:bookId', protect, removeFromCart);
router.route('/:id').get(protect, admin, getUserById);

module.exports = router;