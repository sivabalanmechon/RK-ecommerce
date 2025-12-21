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
  const { bookId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    
    // Check if already in cart
    const exists = user.cart.find((item) => item.book == bookId);

    if (exists) {
      return res.status(400).json({ message: 'Item already in cart' });
    }

    user.cart.push({ book: bookId });
    await user.save();
    
    const updatedUser = await user.populate('cart.book');
    res.json(updatedUser.cart);
  } catch (error) {
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