const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Book = require("../models/Book");
const User = require("../models/User");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
exports.createOrder = async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                message: "Cart is empty",
            });
        }

        const ids = cartItems.map(item => item._id);

        const books = await Book.find({
            _id: { $in: ids },
        });

        let total = 0;

        books.forEach(book => {
            total += book.sellingPrice;
        });

        const options = {
            amount: total * 100,
            currency: "INR",
            receipt: `order_${Date.now()}`
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: razorpayOrder,
            books
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        });
    }
};

exports.verifyPayment = async (req, res) => {

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        cartItems
    } = req.body;

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(
            razorpay_order_id + "|" + razorpay_payment_id
        )
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
            success: false,
            message: "Invalid Signature"
        });
    }

    const books = await Book.find({
        _id: {
            $in: cartItems.map(item => item._id)
        }
    });

    const totalPrice = books.reduce((sum, book) => sum + book.sellingPrice, 0);

    const order = await Order.create({

        user: req.user._id,

        orderItems: books.map(book => ({
            book: book._id,
            title: book.title,
            price: book.sellingPrice,
            coverImage: book.coverImage
        })),

        totalPrice,

        paymentResult: {
            id: razorpay_payment_id,
            status: "SUCCESS",
            order_id: razorpay_order_id,
            signature: razorpay_signature
        },

        paymentMethod: "Razorpay",

        isPaid: true,

        paidAt: Date.now(),

        status: "Completed"

    });

    await User.findByIdAndUpdate(req.user._id, {
        $push: {
            orders: order._id
        }
    });

    res.json({
        success: true,
        order
    });

};