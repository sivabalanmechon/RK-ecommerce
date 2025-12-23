const Book = require('../models/Book');
const SampleDownload = require('../models/SampleDownload'); // Import tracking model

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
            $options: 'i',
          },
        }
      : {};

    // 2. Category Filter
    const category = req.query.category ? { category: req.query.category } : {};

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
  try {
    const { 
      title, 
      author, 
      description, 
      detailedDescription, // ✨ New Field
      originalPrice, 
      sellingPrice, 
      discountPercent, 
      category, 
      coverImage, 
      bookImages,         // ✨ New Field (Array of Cloudinary URLs)
      googleDriveFileId,
      samplePdfUrl        // ✨ New Field (Cloudinary PDF URL)
    } = req.body;

    // Optional: Validate max 7 images logic here if not handled in Joi/Frontend
    if (bookImages && bookImages.length > 7) {
      return res.status(400).json({ message: 'You can only upload up to 7 inside images.' });
    }

    const book = new Book({
      user: req.user._id,
      title,
      author,
      description,
      detailedDescription,
      originalPrice,
      sellingPrice,
      discountPercent,
      category,
      coverImage,
      bookImages,         // Save the array of URLs
      googleDriveFileId,
      samplePdfUrl        // Save the PDF URL
    });

    const createdBook = await book.save();
    res.status(201).json(createdBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
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
    detailedDescription, // ✨ New Field
    originalPrice,
    sellingPrice,
    discountPercent,
    category,
    coverImage,
    bookImages,         // ✨ New Field
    googleDriveFileId,
    samplePdfUrl        // ✨ New Field
  } = req.body;

  const book = await Book.findById(req.params.id);

  if (book) {
    book.title = title || book.title;
    book.author = author || book.author;
    book.description = description || book.description;
    book.detailedDescription = detailedDescription || book.detailedDescription;
    book.originalPrice = originalPrice || book.originalPrice;
    book.sellingPrice = sellingPrice || book.sellingPrice;
    book.discountPercent = discountPercent || book.discountPercent;
    book.category = category || book.category;
    book.coverImage = coverImage || book.coverImage;
    book.bookImages = bookImages || book.bookImages; // Update array
    book.googleDriveFileId = googleDriveFileId || book.googleDriveFileId;
    book.samplePdfUrl = samplePdfUrl || book.samplePdfUrl;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
};

// @desc    Get related books
// @route   GET /api/books/:id/related
exports.getRelatedBooks = async (req, res) => {
  try {
    const product = await Book.findById(req.params.id);
    if (product) {
      const related = await Book.find({
        _id: { $ne: product._id },
        category: product.category,
      }).limit(4); // Changed to 4 to match your UI grid
      res.json(related);
    } else {
      res.status(404);
      throw new Error('Book not found');
    }
  } catch (error) {
    res.status(404).json({ message: 'Book not found' });
  }
};

// @desc    Get top books (e.g. for Home slider)
exports.getTopBooks = async (req, res) => {
  const books = await Book.find({}).limit(3); 
  res.json(books);
};

// @desc    Track user and redirect to Sample PDF
// @route   GET /api/books/:id/sample
// @access  Private
exports.downloadSample = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!book.samplePdfUrl) {
      return res.status(404).json({ message: 'No sample PDF available' });
    }

    // 1. Log the download
    await SampleDownload.create({
      user: req.user._id,
      book: book._id,
      bookTitle: book.title
    });

    // 2. Return the Cloudinary URL
    res.json({ downloadUrl: book.samplePdfUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};