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
    // ✨ FIX: Added { isPaid: true } to count ONLY successful orders
    const totalOrders = await Order.countDocuments({ isPaid: true }); 
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments(); 
    const totalSampleDownloads = await SampleDownload.countDocuments(); 

    // 2. Cart Items Calculation
    let totalCartItems = 0;
    try {
        const cartStats = await User.aggregate([
            { 
                $project: {
                    activeCart: { 
                        $ifNull: [ "$cart", { $ifNull: ["$cartItems", []] } ] 
                    }
                } 
            },
            { $unwind: "$activeCart" },
            { 
                $group: { 
                    _id: null, 
                    totalItems: { $sum: "$activeCart.qty" }
                } 
            }
        ]);
        totalCartItems = cartStats.length > 0 ? cartStats[0].totalItems : 0;
    } catch (err) {
        console.log("Cart Calc Error:", err.message);
    }

    // 3. Revenue Calculations (STRICTLY PAID ONLY)
    const totalRevenueResult = await Order.aggregate([
      { $match: { isPaid: true } }, 
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // 4. Yearly / Monthly Revenue
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

    // 5. Monthly Sales Chart (PAID ONLY)
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

    // 6. Book Analytics (PAID ONLY)
    let bookAnalytics = [];
    try {
        bookAnalytics = await Order.aggregate([
            { $match: { isPaid: true } },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.book',
                    count: { $sum: 1 }, 
                    revenue: { $sum: '$orderItems.price' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);
        
        await Book.populate(bookAnalytics, { path: '_id', select: 'title' });

    } catch (err) {
        console.log("Analytics Error:", err.message);
    }

    // 7. Unpaid Count (Kept separate so you can still see them in the "Pending" card)
    const totalUnpaidOrders = await Order.countDocuments({
        $or: [
            { isPaid: false },
            { isPaid: { $exists: false } },
            { isPaid: null }
        ]
    });

    // 8. SEND RESPONSE
    res.status(200).json({
      totalOrders, // Now strictly PAID orders
      totalUsers,
      totalBooks,
      totalSampleDownloads,
      totalCartItems,
      totalRevenue,
      yearlyRevenue,
      monthlyRevenue,
      monthlySales,
      bookAnalytics,
      totalUnpaidOrders
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

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