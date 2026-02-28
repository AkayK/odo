const userService = require('../services/userService');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid user ID');
  }
  return id;
}

const userController = {
  async getAll(_req, res) {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  },

  async getById(req, res) {
    const id = parseId(req.params.id);
    const user = await userService.getById(id);
    res.json({ success: true, data: user });
  },

  async create(req, res) {
    const { email, password, firstName, lastName, roleId, departmentId } = req.body;
    const user = await userService.create({ email, password, firstName, lastName, roleId, departmentId });

    logger.info('User created', { createdBy: req.user.id, userId: user.id, email: user.email });

    res.status(201).json({ success: true, data: user });
  },

  async update(req, res) {
    const id = parseId(req.params.id);
    const { email, password, firstName, lastName, roleId, departmentId } = req.body;
    const user = await userService.update(id, { email, password, firstName, lastName, roleId, departmentId });

    logger.info('User updated', { updatedBy: req.user.id, userId: user.id });

    res.json({ success: true, data: user });
  },

  async toggleActive(req, res) {
    const id = parseId(req.params.id);
    const user = await userService.toggleActive(id, req.user.id);

    logger.info('User active status toggled', { toggledBy: req.user.id, userId: user.id, isActive: user.isActive });

    res.json({ success: true, data: user });
  },

  async getRoles(_req, res) {
    const roles = await userService.getRoles();
    res.json({ success: true, data: roles });
  },

  async getDepartments(_req, res) {
    const departments = await userService.getDepartments();
    res.json({ success: true, data: departments });
  },
};

module.exports = userController;
