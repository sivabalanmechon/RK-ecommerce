const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();

    // ---------------------------------------------------------
    // 👇 NEW: Calculate Total Items in All Users' Carts
    // ---------------------------------------------------------
    // We only select the 'cart' field for better performance
    const allUsers = await User.find({}, 'cart'); 
    const totalCartItems = allUsers.reduce((acc, user) => {
        const userCartCount = user.cart ? user.cart.reduce((sum, item) => sum + item.qty, 0) : 0;
        return acc + userCartCount;
    }, 0);
    // ---------------------------------------------------------

    // 2. Calculate TOTAL Revenue
    // (If no orders exist, return 0)
    const totalRevenueResult = await Order.aggregate([
      { $match: { isPaid: true } }, // Ensure we only count PAID orders
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // 3. Calculate YEARLY Revenue (Current Year)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    
    const yearlyRevenueResult = await Order.aggregate([
      { $match: { 
          isPaid: true, 
          createdAt: { $gte: startOfYear } 
      }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const yearlyRevenue = yearlyRevenueResult.length > 0 ? yearlyRevenueResult[0].total : 0;

    // 4. Calculate MONTHLY Revenue (Current Month)
    const currentMonth = new Date().getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { 
          isPaid: true, 
          createdAt: { $gte: startOfMonth } 
      }},
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    // 5. Graph Data (Last 6 Months Revenue)
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

    // 6. Book Analytics (Top Selling Books)
    let bookAnalytics = [];
    try {
      bookAnalytics = await Order.aggregate([
        { $match: { isPaid: true } }, // Filter paid orders
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.book',
            count: { $sum: 1 }, // Count items sold
            revenue: { $sum: '$orderItems.price' } // Revenue per book
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);
      
      if (bookAnalytics.length > 0) {
        await Book.populate(bookAnalytics, { path: '_id', select: 'title category' });
      }
    } catch (analyticsError) {
      console.error("Analytics Error:", analyticsError);
    }

    res.json({
      totalOrders,
      totalUsers,
      totalBooks,
      totalCartItems, // <--- Added here
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

module.exports = { getAdminStats };