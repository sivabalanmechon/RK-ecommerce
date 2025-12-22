const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SystemSetting = require('../models/Systemsettings');

// Generate JWT Token
// Inside your token generation function
exports.generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // 👇 UPDATE THIS BLOCK
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true, // ✅ Must be true for HTTPS (Render + Netlify)
    sameSite: "None", // ✅ Required for Cross-Site cookies
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
  });
};



// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  // 👇 1. Accept mobile from body
  const { name, email, password, mobile } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 👇 2. Save mobile to database
    const user = await User.create({
      name,
      email,
      mobile, 
      password: hashedPassword,
      cart: [] 
    });

    if (user) {
      // Send Token in HTTP-Only Cookie
      const token = generateToken(user._id);
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', 
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, 
      });

      // 👇 3. Return mobile in response
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile, 
        role: user.role,
        cart: user.cart
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check Global Login Switch
  const settings = await SystemSetting.findOne();
  if (settings && !settings.isLoginEnabled) {
     return res.status(503).json({ message: 'Login is currently disabled by Administrator.' });
  }

  try {
    // Find user
    const user = await User.findOne({ email }).populate('cart.book');

    // Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      
      const token = generateToken(user._id);
      
      // Set Cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile, // <--- Return mobile on login too (optional but useful)
        role: user.role,
        cart: user.cart
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};