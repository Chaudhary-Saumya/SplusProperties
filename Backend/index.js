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

// Load env vars
dotenv.config();

// Connect to database
connectDB();
const autoSeed = require('./utils/seeder');
autoSeed();

const app = express();

// HTTP Request Logging (morgan) -> piped into winston logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, 
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/', limiter);

// Specific rate limit for listing creation (max 4 per 30 mins)
const listingLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 4,
    message: {
        success: false,
        message: 'Too many listings created from this IP, please try again after 30 minutes',
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
    console.log('User connected:', socket.id);
    
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their private room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/recommendations', require('./routes/recommendations'));

app.get('/', (req, res) => {
    res.send('LandSelling API is running...');
});

// Custom Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
