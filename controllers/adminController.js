const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');
const SampleDownload = require('../models/SampleDownload');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();

    // 2. Total Items in All Carts (Optimized Aggregation)
    // Instead of loading all users, we let the database sum it up
    const cartStats = await User.aggregate([
      { $unwind: "$cart" },
      { $group: { _id: null, totalItems: { $sum: "$cart.qty" } } }
    ]);
    const totalCartItems = cartStats.length > 0 ? cartStats[0].totalItems : 0;

    // 3. Total Revenue (Paid Orders Only)
    const totalRevenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // 4. Yearly Revenue
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    
    const yearlyRevenueResult = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfYear } }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const yearlyRevenue = yearlyRevenueResult.length > 0 ? yearlyRevenueResult[0].total : 0;

    // 5. Monthly Revenue
    const currentMonth = new Date().getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfMonth } }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    // 6. Monthly Sales Graph Data
    const monthlySales = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // 7. Book Analytics (Top Selling)
    const bookAnalytics = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.book',
          count: { $sum: '$orderItems.qty' }, // Fix: Sum quantity, not just count orders
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      // Lookup book details directly
      {
        $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookDetails'
        }
      },
      { $unwind: '$bookDetails' },
      {
        $project: {
            _id: '$bookDetails', // Matches frontend expectation
            count: 1,
            revenue: 1
        }
      }
    ]);

    // Send Response
    res.json({
      totalOrders,
      totalUsers,
      totalBooks,      // Ensure this matches frontend state
      totalCartItems,  // Ensure this matches frontend state
      totalRevenue,
      yearlyRevenue,
      monthlyRevenue,
      monthlySales,
      bookAnalytics
    });

  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of all sample downloads
// @route   GET /api/admin/sample-downloads
// @access  Private/Admin
const getSampleDownloads = async (req, res) => {
  try {
    const downloads = await SampleDownload.find({})
      // 👇 Key Step: Get User Profile Details
      .populate('user', 'name email mobile profileImage') 
      // Get Book Title (in case book name changed)
      .populate('book', 'title coverImage') 
      .sort({ downloadedAt: -1 }); // Newest first

    res.json(downloads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAdminStats, getSampleDownloads };