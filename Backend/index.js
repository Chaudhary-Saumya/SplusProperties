const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const mongoSanitize = require('./middlewares/sanitize');
const errorHandler = require('./middlewares/errorMiddleware');
const path = require('path');
const morgan = require('morgan');
const logger = require('./utils/logger');
const compression = require('compression');

// Load env vars
dotenv.config();

// Critical env validation — fail fast before anything else runs
const REQUIRED_ENV = ['JWT_SECRET', 'MONGODB_URI'];
const MISSING_ENV = REQUIRED_ENV.filter(key => !process.env[key]);
if (MISSING_ENV.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables: ${MISSING_ENV.join(', ')}`);
    console.error('Server cannot start without these. Check your .env file.');
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 16) {
    console.error('FATAL ERROR: JWT_SECRET must be at least 16 characters long for security.');
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    logger.warn('WARNING: JWT_SECRET is shorter than 32 characters. Consider using a stronger 256-bit secret in production.');
}

// Connect to database
connectDB();
const autoSeed = require('./utils/seeder');
autoSeed();

const app = express();

// Trust proxy (required for express-rate-limit behind reverse proxies like Railway)
app.set('trust proxy', 1);

// Use compression
app.use(compression());

// HTTP Request Logging (morgan) -> piped into winston logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost",
  "capacitor://localhost",
  "http://10.0.2.2:5000",
  "http://10.0.2.2",
  "https://properties.kharsan.com",
  "https://kharsanproperties.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Increased for better UX
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/', limiter);

// Specific rate limit for listing creation (max 20 per 10 mins)
const listingLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many listings created. Please wait a few minutes before adding more.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/listings', (req, res, next) => {
    if (req.method === 'POST') return listingLimiter(req, res, next);
    next();
});

// Prevent XSS attacks
app.use(xss());

// Prevent http param pollution
app.use(hpp());

// Sanitize data
app.use(mongoSanitize);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true
    }
});

// Attach io to app for use in controllers
app.set('io', io);

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    socket.on('join', (userId) => {
        socket.join(userId);
        logger.info(`User ${userId} joined their private room`);
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { getSitemap, getRobots } = require('./controllers/seoController');

// SEO Routes
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobots);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/maps', require('./routes/maps'));

app.get('/', (req, res) => {
    res.send('LandSelling API is running...');
});

// Custom Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
