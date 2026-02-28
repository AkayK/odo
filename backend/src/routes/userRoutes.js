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

router.use(verifyToken, requireRole('admin'));

router.get('/', userController.getAll);
// Static routes before parameterized routes
router.get('/roles', userController.getRoles);
router.get('/departments', userController.getDepartments);
router.get('/:id', userController.getById);
router.post('/', writeLimiter, userController.create);
router.put('/:id', writeLimiter, userController.update);
router.delete('/:id', writeLimiter, userController.toggleActive);

module.exports = router;
