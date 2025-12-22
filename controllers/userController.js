const User = require('../models/User');
const Order = require('../models/Order'); // 👈 1. IMPORT ORDER MODEL

// @desc    Get User Profile (with Order History)
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    // 1. Get User Details (and cart items)
    const user = await User.findById(req.user._id)
      .populate('cart.book'); 

    if (user) {
      // 2. Manual lookup: Find orders belonging to this user
      const orders = await Order.find({ user: user._id });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        cart: user.cart,
        orders: orders // 👈 Attach orders here manually
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error); // Log error to console for debugging
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

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('cart.book')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
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