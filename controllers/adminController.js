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
    const totalOrders = await Order.countDocuments({ isPaid: true });
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    
    // 2. Count Sample Downloads
    const totalSampleDownloads = await SampleDownload.countDocuments(); 

    // 3. Cart Items Aggregation
    let totalCartItems = 0;
    try {
        const cartStats = await User.aggregate([
            { $unwind: "$cart" },
            { $group: { _id: null, totalItems: { $sum: "$cart.qty" } } }
        ]);
        totalCartItems = cartStats.length > 0 ? cartStats[0].totalItems : 0;
    } catch (err) {
        console.log("Cart Calc Error:", err.message);
    }

    // 4. Revenue Calculations
    const totalRevenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Yearly / Monthly Revenue
    const currentYear = new Date().getFullYear();
    const yearlyRevenueResult = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: new Date(currentYear, 0, 1) } }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const yearlyRevenue = yearlyRevenueResult.length > 0 ? yearlyRevenueResult[0].total : 0;

    const currentMonth = new Date().getMonth();
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: new Date(currentYear, currentMonth, 1) } }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    // 5. Monthly Sales Chart
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

    // 6. Book Analytics
    let bookAnalytics = [];
    try {
        bookAnalytics = await Order.aggregate([
            { $match: { isPaid: true } },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.book',
                    count: { $sum: '$orderItems.qty' },
                    revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        await Book.populate(bookAnalytics, { path: '_id', select: 'title' });
    } catch (err) {
        console.log("Analytics Error:", err.message);
    }

    // 👇 ✨ ROBUST UNPAID COUNT ✨
    // This checks for: isPaid is FALSE OR isPaid DOES NOT EXIST OR isPaid is NULL
    const totalUnpaidOrders = await Order.countDocuments({
        $or: [
            { isPaid: false },
            { isPaid: { $exists: false } },
            { isPaid: null }
        ]
    });

    res.status(200).json({
      totalOrders,
      totalUsers,
      totalBooks,
      totalCartItems,
      totalSampleDownloads,
      totalRevenue,
      yearlyRevenue,
      monthlyRevenue,
      monthlySales,
      bookAnalytics,
      totalUnpaidOrders // Sending the robust count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of all sample downloads
// @route   GET /api/admin/sample-downloads
// @access  Private/Admin
const getSampleDownloads = async (req, res) => {
  try {
    const downloads = await SampleDownload.find({})
      .populate('user', 'name email mobile profileImage') 
      .populate('book', 'title coverImage') 
      .sort({ downloadedAt: -1 }); 

    res.json(downloads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAdminStats, getSampleDownloads };