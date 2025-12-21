const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Your React Frontend URL (default Vite port)
  credentials: true // Important for cookies
}));

// Placeholder Routes (We will create these files next)
app.use('/api/auth', require('./routes/authroutes'));
app.use('/api/books', require('./routes/bookroutes'));
app.use('/api/payment', require('./routes/paymentroutes'));
app.use('/api/users', require('./routes/userroutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));