const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/auth', authRoutes);


// Error middleware
app.use(errorHandler);

module.exports = app;