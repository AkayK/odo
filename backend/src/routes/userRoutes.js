const express = require('express');
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
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

// Read routes: admin and manager can list users (needed for ticket assignment)
router.get('/', requireRole('admin', 'manager'), userController.getAll);
router.get('/roles', requireRole('admin'), userController.getRoles);
router.get('/departments', requireRole('admin'), userController.getDepartments);
router.get('/:id', requireRole('admin', 'manager'), userController.getById);

// Write routes: admin only
router.post('/', requireRole('admin'), writeLimiter, userController.create);
router.put('/:id', requireRole('admin'), writeLimiter, userController.update);
router.delete('/:id', requireRole('admin'), writeLimiter, userController.toggleActive);

module.exports = router;
