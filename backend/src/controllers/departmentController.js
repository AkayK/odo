const departmentService = require('../services/departmentService');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid department ID');
  }
  return id;
}

const departmentController = {
  async getAll(_req, res) {
    const departments = await departmentService.getAll();
    res.json({ success: true, data: departments });
  },

  async getById(req, res) {
    const id = parseId(req.params.id);
    const department = await departmentService.getById(id);
    res.json({ success: true, data: department });
  },

  async create(req, res) {
    const { name, description } = req.body;
    const department = await departmentService.create({ name, description });

    logger.info('Department created', {
      createdBy: req.user.id,
      departmentId: department.id,
      name: department.name,
    });

    res.status(201).json({ success: true, data: department });
  },

  async update(req, res) {
    const id = parseId(req.params.id);
    const { name, description } = req.body;
    const department = await departmentService.update(id, { name, description });

    logger.info('Department updated', {
      updatedBy: req.user.id,
      departmentId: department.id,
    });

    res.json({ success: true, data: department });
  },

  async toggleActive(req, res) {
    const id = parseId(req.params.id);
    const department = await departmentService.toggleActive(id);

    logger.info('Department active status toggled', {
      toggledBy: req.user.id,
      departmentId: department.id,
      isActive: department.isActive,
    });

    res.json({ success: true, data: department });
  },
};

module.exports = departmentController;
