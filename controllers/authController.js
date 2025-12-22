const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SystemSetting = require('../models/Systemsettings');

// 👇 1. Define Helper Function correctly (Internal use)
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set Cookie with Cross-Site settings (Render + Netlify support)
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,       // ✅ Always True for Render/Netlify
    sameSite: "None",   // ✅ Required for Cross-Site
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      mobile, 
      password: hashedPassword,
      cart: [] 
    });

    if (user) {
      // 👇 2. Call the helper function correctly (Pass 'res' and 'id')
      generateToken(res, user._id);

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
    const user = await User.findOne({ email }).populate('cart.book');

    if (user && (await bcrypt.compare(password, user.password))) {
      
      // 👇 3. Call helper here too. No need to duplicate cookie code!
      generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
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
  // Clear cookie with same settings
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: true,      // ✅ Important to match creation settings
    sameSite: "None",  // ✅ Important to match creation settings
  });
  res.status(200).json({ message: 'Logged out successfully' });
};