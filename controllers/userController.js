const User = require('../models/User');
const Order = require('../models/Order'); // 👈 1. IMPORT ORDER MODEL
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get User Profile (with Order History)
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    // 1. Get User Details
    const user = await User.findById(req.user._id).populate('cart.book');

    if (user) {
      // 2. FIND PAID ORDERS
      const rawOrders = await Order.find({ user: user._id, isPaid: true })
                                   .sort({ createdAt: -1 })
                                   .populate('orderItems.book'); 

      // 3. ✨ TRICK: Flatten the data for the Frontend
      // The frontend expects 'order.book', but DB has 'order.orderItems'
      // We grab the first book from the items and put it at the top.
      const formattedOrders = rawOrders.map(order => {
          const orderObj = order.toObject();
          if (orderObj.orderItems && orderObj.orderItems.length > 0) {
              // Take the book from the first item and make it accessible as 'order.book'
              orderObj.book = orderObj.orderItems[0].book;
          }
          return orderObj;
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        cart: user.cart,
        orders: formattedOrders // 👈 Send the fixed orders
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Item to Cart
// @route   POST /api/users/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    console.log("1. AddToCart Request Body:", req.body); // Check if bookId exists
    const { bookId } = req.body;

    // Check if bookId is valid
    if (!bookId) {
      console.log("❌ Error: bookId is missing from request body");
      return res.status(400).json({ message: "Book ID is required" });
    }

    console.log("2. User from Request (req.user):", req.user);
    // Ensure req.user exists (Middleware should handle this, but let's be safe)
    if (!req.user || !req.user._id) {
       console.log("❌ Error: req.user is missing. Auth Middleware might have failed.");
       return res.status(401).json({ message: "User not authenticated correctly" });
    }

    // Fetch fresh user data
    const user = await User.findById(req.user._id);

    if (!user) {
      console.log("❌ Error: User not found in database with ID:", req.user._id);
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize cart if it doesn't exist (Fixes crash on old users)
    if (!user.cart) {
      user.cart = [];
    }

    // Check if already in cart
    // We use String() to ensure we are comparing strings, not Objects vs Strings
    const exists = user.cart.find((item) => String(item.book) === String(bookId));

    if (exists) {
      console.log("⚠️ Item already in cart");
      return res.status(400).json({ message: 'Item already in cart' });
    }

    // Push new item
    user.cart.push({ book: bookId });
    await user.save();
    
    // Populate and return
    const updatedUser = await user.populate('cart.book');
    console.log("✅ Success! Cart updated.");
    res.json(updatedUser.cart);

  } catch (error) {
    console.error("❌ CRITICAL SERVER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove Item from Cart
// @route   DELETE /api/users/cart/:bookId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.cart = user.cart.filter((item) => item.book != req.params.bookId);
    await user.save();
    
    const updatedUser = await user.populate('cart.book');
    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get user cart (Auto-removes broken items)
// @route   GET /api/users/cart
// @access  Private
exports.getUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const validItems = [];
    const newCart = []; 

    for (const cartItem of user.cart) {
      // Find the book manually
      const book = await mongoose.model('Book').findById(cartItem.book);

      if (book) {
        // 🛠️ PRICE FIX LOGIC:
        // 1. Try 'price' (Standard)
        // 2. Try 'sellingPrice' (If saved differently)
        // 3. Fallback to 'originalPrice' (So it's never 0)
        let finalSellingPrice = book.price || book.sellingPrice || book.originalPrice || 0;

        validItems.push({
          _id: book._id,
          title: book.title,
          coverImage: book.coverImage,
          
          // Force send a value, even if it falls back to originalPrice
          sellingPrice: finalSellingPrice, 
          
          originalPrice: book.originalPrice || (finalSellingPrice * 1.2),
          author: book.author || "RK Success",
          qty: 1
        });
        
        newCart.push(cartItem);
      }
    }

    // Clean DB if needed
    if (newCart.length !== user.cart.length) {
      user.cart = newCart;
      await user.save();
    }

    res.json(validItems);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')        // 1. Hide passwords
      .sort({ createdAt: -1 })    // 2. Newest users first
      .populate('cart.book')      // 3. Fill Book details in Cart
      .populate('sampleDownloads'); // 4. Fill the Download History (Virtual Field)

    res.json(users);
  } catch (error) {
    console.error(error); // Helpful to see the error in terminal
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (For Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    // 1. Fetch User (Populate Cart)
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('cart.book');
      
    if (user) {
      // 2. Fetch Orders for this user manually
      const orders = await Order.find({ user: req.params.id });

      // 3. Convert Mongoose Object to JS Object so we can append orders
      const userObj = user.toObject(); 
      userObj.orders = orders; // 👈 Attach orders

      res.json(userObj);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};