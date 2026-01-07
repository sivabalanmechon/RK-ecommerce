const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js'); // Assuming you have this wrapper

// @desc    User submits Manual UTR for verification
// @route   PUT /api/payment/:id/pay
// @access  Private
const submitManualPayment = asyncHandler(async (req, res) => {
  const { paymentProof } = req.body; // The UTR entered by user
  
  const order = await Order.findById(req.params.id);

  if (order) {
    order.paymentProof = paymentProof;
    order.paymentMethod = 'UPI_MANUAL';
    // We do NOT mark isPaid=true yet. We wait for Admin or SMS verification.
    
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Mobile App sends SMS for Auto-Verification
// @route   POST /api/payment/verify-sms
// @access  Public (Protected by secret logic if needed)
const verifySmsPayment = asyncHandler(async (req, res) => {
  const { smsBody, sender } = req.body;
  console.log(`📩 SMS from ${sender}: ${smsBody}`);

  // 1. EXTRACT DATA via REGEX
  // Pattern to find "Ref 12345678" or "UTR 12345678"
  const utrMatch = smsBody.match(/(?:Ref|UTR|txn|no)[:\s-]*(\d{4,})/i);
  // Pattern to find amount "Rs 500.00" or "INR 500.00"
  const amountMatch = smsBody.match(/(?:Rs\.?|INR)\s*([\d,]+)/i);

  if (!utrMatch || !amountMatch) {
     return res.status(200).send("Not a payment SMS");
  }

  const utr = utrMatch[1]; 
  const amount = parseFloat(amountMatch[1].replace(',', ''));

  // 2. FIND ORDER
  // Logic: Find an UNPAID order with matching Price + Matching UTR (Full or Partial)
  const order = await Order.findOne({
    isPaid: false,
    totalPrice: amount,
    // Checks if the User's entered UTR matches the SMS UTR (or vice versa)
    paymentProof: { $regex: utr, $options: 'i' } 
  });

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: utr,
      status: 'COMPLETED_VIA_SMS',
      update_time: Date.now(),
      email_address: sender
    };
    await order.save();
    console.log(`✅ SMS AUTO-VERIFIED Order: ${order._id}`);
    res.status(200).json({ message: "Order Verified Successfully" });
  } else {
    console.log("❌ Payment received but no matching Pending Order found.");
    res.status(200).json({ message: "No matching order found" });
  }
});

module.exports = { submitManualPayment, verifySmsPayment };


// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// const Order = require('../models/Order');
// const Book = require('../models/Book');
// const User = require('../models/User'); 
// const { grantAccess } = require('../utils/googleDriveService');

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // @desc    Create Razorpay Order (For Cart)
// // @route   POST /api/payment/create-order
// // @access  Private
// exports.createOrder = async (req, res) => {
//   // 1. Accept an Array of items (the Cart)
//   const { cartItems } = req.body; 

//   try {
//     if (!cartItems || cartItems.length === 0) {
//       return res.status(400).json({ message: 'No items in cart' });
//     }

//     // 2. Calculate Total Amount Securely on Backend
//     // (Never trust the price sent from frontend)
//     let totalAmount = 0;
    
//     // We loop through the IDs sent and fetch real prices from DB
//     const bookIds = cartItems.map(item => item._id);
//     const books = await Book.find({ _id: { $in: bookIds } });

//     books.forEach(book => {
//         totalAmount += book.sellingPrice;
//     });

//     // 3. Create Razorpay Order
//     const options = {
//       amount: totalAmount * 100, // Convert to paisa
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     res.json({
//       id: order.id,
//       currency: order.currency,
//       amount: order.amount,
//       cartItems: books // Send back the verified list of books
//     });

//   } catch (error) {
//     console.error("Payment Init Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Verify Payment & Save Order
// // @route   POST /api/payment/verify
// // @access  Private
// exports.verifyPayment = async (req, res) => {
//   const { 
//     razorpay_order_id, 
//     razorpay_payment_id, 
//     razorpay_signature, 
//     cartItems // <--- We now receive the full list of items
//   } = req.body;

//   const userId = req.user._id;

//   // 1. Verify Signature
//   const body = razorpay_order_id + "|" + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//     .update(body.toString())
//     .digest('hex');

//   if (expectedSignature === razorpay_signature) {
//     try {
//       // 2. Create the Order Entry
//       // Note: Make sure your Order Model supports 'orderItems' array!
//       const order = await Order.create({
//         user: userId,
//         orderItems: cartItems.map(item => ({
//             book: item._id,     // The Book ID
//             title: item.title,  // Snapshot of title
//             price: item.sellingPrice, // Snapshot of price paid
//             coverImage: item.coverImage
//         })),
//         totalPrice: cartItems.reduce((acc, item) => acc + item.sellingPrice, 0),
//         paymentId: razorpay_payment_id,
//         orderId: razorpay_order_id,
//         isPaid: true,
//         paidAt: Date.now(),
//         status: 'Completed',
//       });

//       // 3. Update User History
//       await User.findByIdAndUpdate(userId, { 
//         $push: { orders: order._id } 
//       });

//       // 4. AUTOMATION: Grant Access to ALL Books
//       // We loop through every book in the cart and grant access
//       for (const item of cartItems) {
//          if(item.googleDriveFileId) {
//              try {
//                  await grantAccess(item.googleDriveFileId, req.user.email);
//              } catch (driveErr) {
//                  console.error(`Failed to grant access for ${item.title}:`, driveErr);
//                  // We don't stop the loop; try to grant the rest
//              }
//          }
//       }

//       res.json({ 
//         success: true, 
//         message: 'Payment verified! Check your email for access.',
//       });

//     } catch (dbError) {
//       console.error("DB Save Error:", dbError);
//       res.status(500).json({ message: 'Payment successful but database save failed.' });
//     }
//   } else {
//     res.status(400).json({ success: false, message: 'Invalid Signature' });
//   }
// };