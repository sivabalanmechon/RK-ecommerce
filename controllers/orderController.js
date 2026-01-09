const Order = require('../models/Order');
const asyncHandler = require('express-async-handler'); // Ensure you have this installed: npm i express-async-handler
const Transaction = require('../models/transactionalModel');
const Book = require('../models/Book'); // 1. Import Book Model
const { grantAccess } = require('../utils/driveService'); // 2. Import Drive Service

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// backend/controllers/orderController.js
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  // 1. Log what the frontend sent (Check your VS Code Terminal!)
  console.log("🔹 Received Order Items:", JSON.stringify(orderItems, null, 2));

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    
    // 2. Robust Mapping: Handles ANY variation of data
    const dbOrderItems = orderItems.map((item) => {
        // Try every possible field name for price
        const finalPrice = item.price || item.sellingPrice || 0;

        // Try every possible field name for ID
        const finalId = item.product || item.book || item._id;

        return {
            book: finalId, // Mongoose expects 'book' for the reference
            title: item.title || item.name || 'Untitled Book',
            price: Number(finalPrice), // Ensure it is a Number
            coverImage: item.coverImage || item.image
        };
    });

    // 3. Log what we are saving to DB
    console.log("🔸 Mapped for DB:", JSON.stringify(dbOrderItems, null, 2));

    const order = new Order({
      orderItems: dbOrderItems, 
      user: req.user._id,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 }); 
  res.json(orders);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {

  if (!req.params.id || req.params.id === 'undefined') {
      res.status(400);
      throw new Error('Invalid Order ID');
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email mobile');

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});


// @desc    Update order to paid (Manual or Auto-Verify)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  // 1. Populate user to ensure we have the email
  const order = await Order.findById(req.params.id).populate('user', 'email name');

  if (order) {
    const userInput = req.body.paymentProof ? req.body.paymentProof.trim() : '';
    
    if (userInput.length < 6) {
        res.status(400);
        throw new Error('Please enter at least the last 6 digits of the UTR.');
    }

    const matchedTransaction = await Transaction.findOne({
      utr: { $regex: userInput + '$' }, 
      amount: order.totalPrice,         
      isUsed: false                     
    });

    if (matchedTransaction) {
        // ✅ SUCCESS
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentMethod = 'UPI_AUTO_VERIFIED';
        order.paymentResult = {
            id: matchedTransaction.utr,
            status: 'verified_via_sms_match',
            update_time: String(Date.now()),
            email_address: order.user.email,
        };

        matchedTransaction.isUsed = true;
        matchedTransaction.orderId = order._id;
        await matchedTransaction.save();
        
        // 🚀 AUTOMATION: GRANT ACCESS
        console.log(`🔄 Automation Starting for Order #${order._id}`);
        
        if (order.orderItems && order.orderItems.length > 0) {
             for (const item of order.orderItems) {
                 try {
                     const book = await Book.findById(item.product || item.book);

                     // ✨ FIX: Using the correct field name 'googleDriveFileId'
                     if (book && book.googleDriveFileId) {
                         console.log(`📂 Found Drive ID: ${book.googleDriveFileId}. Granting to: ${order.user.email}`);
                         
                         await grantAccess(book.googleDriveFileId, order.user.email);
                         
                         console.log(`✅ Access Granted successfully for ${book.title}`);
                     } else {
                         console.log(`⚠️ Skipping item: No 'googleDriveFileId' found for "${book ? book.title : 'Unknown Book'}"`);
                         // Debug log to help if it happens again
                         if(book) console.log("   (Available fields in DB:", Object.keys(book.toObject()), ")");
                     }
                 } catch (err) {
                     console.error(`❌ Failed to grant access for item:`, err.message);
                 }
             }
        }

        console.log(`✅ Order verified & processed.`);
    } else {
        // ❌ FAIL
        order.paymentProof = userInput;
        order.paymentMethod = 'UPI_MANUAL_PENDING';
        console.log(`⚠️ User entered ${userInput}, but no matching SMS found yet.`);
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
    
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Receive SMS from Android Bot and Save to DB
// @route   POST /api/orders/webhook/sms
// @access  Public (Protected by secretKey)
const handleSmsWebhook = asyncHandler(async (req, res) => {
    const { utr, amount, secretKey } = req.body;

    console.log("📩 SMS Webhook Received:", req.body);

    // 1. Security Check
    if (secretKey !== 'rkenotes6394') {
        res.status(401);
        throw new Error('Unauthorized Bot');
    }

    console.log(`🔔 Webhook: Received ₹${amount} with UTR ${utr}`);

    // 2. SAVE THE TRANSACTION (The new "Memory" Step)
    // We check if we already have this UTR to avoid duplicates
    const transactionExists = await Transaction.findOne({ utr });

    if (!transactionExists) {
        await Transaction.create({
            utr,
            amount,
            isUsed: false // Initially false, becomes true when user claims it
        });
        console.log(`💾 SMS Saved to Database: ₹${amount} | UTR: ${utr}`);
        
        res.status(200).json({ message: 'SMS Logged Successfully' });
    } else {
        console.log(`⚠️ Duplicate SMS ignored: ${utr}`);
        res.status(200).json({ message: 'Duplicate ignored' });
    }

    // NOTE: We removed the "Auto-Approve" logic from here.
    // Why? Because now the User will enter the "Last 6 Digits" on the frontend,
    // and the 'updateOrderToPaid' controller will search this saved data to approve it.
    // This prevents the "Guessing" errors you had before.
});

module.exports = {
  createOrder,     
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  handleSmsWebhook 
};