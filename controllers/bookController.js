const Book = require('../models/Book');

// @desc    Fetch all books (with Search & Filter)
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
  try {
    // 1. Search Keyword
    const keyword = req.query.keyword
      ? {
          title: {
            $regex: req.query.keyword,
            $options: 'i', // Case insensitive
          },
        }
      : {};

    // 2. Category Filter
    const category = req.query.category ? { category: req.query.category } : {};

    // Combine queries
    const books = await Book.find({ ...keyword, ...category });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single book
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res) => {
  // We take the data directly from the User's form
  const { 
    title, author, description, 
    originalPrice, sellingPrice, discountPercent, 
    category, coverImage, googleDriveFileId 
  } = req.body;

  const book = new Book({
    user: req.user._id, // The Admin who created it
    title,
    author,
    description,
    originalPrice,
    sellingPrice,
    discountPercent,
    category,
    coverImage,
    googleDriveFileId,
  });

  const createdBook = await book.save();
  res.status(201).json(createdBook);
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (book) {
      await book.deleteOne();
      res.json({ message: 'Book removed' });
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res) => {
  const {
    title,
    author,
    description,
    originalPrice,
    sellingPrice,
    discountPercent,
    category,
    coverImage,
    googleDriveFileId,
  } = req.body;

  const book = await Book.findById(req.params.id);

  if (book) {
    book.title = title;
    book.author = author;
    book.description = description;
    book.originalPrice = originalPrice;
    book.sellingPrice = sellingPrice;
    book.discountPercent = discountPercent;
    book.category = category;
    book.coverImage = coverImage;
    book.googleDriveFileId = googleDriveFileId;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
};

exports.getRelatedBooks = async (req, res) => {
  try {
    const product = await Book.findById(req.params.id);
    if (product) {
      const related = await Book.find({
        _id: { $ne: product._id }, // Exclude current book
        category: product.category,
      }).limit(3);
      res.json(related);
    } else {
      res.status(404);
      throw new Error('Book not found');
    }
  } catch (error) {
    res.status(404).json({ message: 'Book not found' });
  }
};

exports.getTopBooks = async (req, res) => {
  // Fetches 3 books. If you add a 'rating' field later, 
  // you can change this to: .sort({ rating: -1 }).limit(3)
  const books = await Book.find({}).limit(3); 
  res.json(books);
};