const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer'); // Added Multer import
const connectDB = require('./utils/db');
const AppError = require('./utils/appError'); 
const blogRoutes = require('./routes/blogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes'); 
const cron = require('node-cron');
const Subscription = require('./models/Subscription');
const Blog = require('./models/Blog');
const { sendWeeklyBlogs } = require('./services/emailService');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Database connection
connectDB();

// Weekly email job (runs every Monday at 9 AM)
cron.schedule('0 9 * * 1', async () => {
  try {
    console.log('Starting weekly email job...');
    
    // Get verified subscribers
    const subscribers = await Subscription.find({ verified: true });
    if (subscribers.length === 0) return;

    // Get blogs from last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const blogs = await Blog.find({ 
      postDate: { $gte: oneWeekAgo }
    }).sort('-postDate');

    if (blogs.length === 0) return;

    // Send emails
    for (const subscriber of subscribers) {
      await sendWeeklyBlogs(
        subscriber.email,
        blogs,
        `${process.env.CLIENT_URL}/unsubscribe/${subscriber.unsubscribeToken}`
      );
    }

    console.log(`Sent weekly emails to ${subscribers.length} subscribers`);
  } catch (err) {
    console.error('Error in weekly email job:', err);
  }
});


app.get('/api/test-weekly-emails', async (req, res) => {
  try {
    const subscribers = await Subscription.find({ verified: true });
    const blogs = await Blog.find().limit(3); // Get sample blogs
    
    for (const sub of subscribers) {
      await sendWeeklyBlogs(
        sub.email,
        blogs,
        `${process.env.CLIENT_URL}/unsubscribe/${sub.unsubscribeToken}`
      );
    }
    
    res.json({ message: `Test emails sent to ${subscribers.length} users` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Middleware Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://*.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Passport configuration
require('./config/passport')(passport);

// Route Handlers
app.use('/auth', authRoutes);
app.use('/blogs', blogRoutes);
app.use('/admins', adminRoutes);
app.use('/contact', contactRoutes);
app.use('/subscriptions', subscriptionRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to mocreatives');
});

// Production configuration
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, 'client/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }

// Unified Error handling middleware
app.use((err, req, res, next) => {
  console.error('ERROR 💥:', err.stack);

  // Handle Multer errors first
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errorType && { errorType: err.errorType }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: `Validation error: ${messages.join('. ')}`
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists. Please use another value`
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again!'
    });
  }

  // Handle token expiration errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired! Please log in again.'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Server initialization
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on port ${port}`);
  console.log(`CORS configured for: ${process.env.CLIENT_URL}`);
});