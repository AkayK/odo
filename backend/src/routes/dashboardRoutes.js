const express = require('express');
const rateLimit = require('express-rate-limit');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyToken);

router.get('/stats', readLimiter, dashboardController.getStats);

module.exports = router;
