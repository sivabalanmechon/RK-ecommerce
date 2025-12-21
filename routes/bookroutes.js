const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getTopBooks,
  getRelatedBooks
} = require('../controllers/bookController');

const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getBooks).post(protect, admin, createBook);
router.route('/top').get(getTopBooks);
router.route('/related/:id').get(getRelatedBooks);

router.route('/:id')
  .get(getBookById)
  .put(protect, admin, updateBook) // <--- Add this PUT line
  .delete(protect, admin, deleteBook);

module.exports = router;