const express = require('express');
const rateLimit = require('express-rate-limit');
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyToken);

router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);

router.post('/', requireRole('admin'), writeLimiter, departmentController.create);
router.put('/:id', requireRole('admin'), writeLimiter, departmentController.update);
router.delete('/:id', requireRole('admin'), writeLimiter, departmentController.toggleActive);

module.exports = router;
