const departmentModel = require('../models/departmentModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;

function toDepartmentDTO(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

function validateName(name) {
  if (!name || name.trim().length < MIN_NAME_LENGTH) {
    throw new ValidationError(`Department name must be at least ${MIN_NAME_LENGTH} characters`);
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Department name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }
}

const departmentService = {
  async getAll() {
    const rows = await departmentModel.findAll();
    return rows.map(toDepartmentDTO);
  },

  async getById(id) {
    const dept = await departmentModel.findById(id);
    if (!dept) {
      throw new NotFoundError('Department not found');
    }
    return toDepartmentDTO(dept);
  },

  async create({ name, description }) {
    if (!name) {
      throw new ValidationError('Name is required');
    }

    const trimmedName = name.trim();
    validateName(trimmedName);

    if (description && description.trim().length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
    }

    const existing = await departmentModel.findByName(trimmedName);
    if (existing) {
      throw new ValidationError('A department with this name already exists');
    }

    const insertId = await departmentModel.create({
      name: trimmedName,
      description: description ? description.trim() : null,
    });

    return this.getById(insertId);
  },

  async update(id, { name, description }) {
    const existing = await departmentModel.findById(id);
    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      validateName(trimmedName);
      const duplicate = await departmentModel.findByNameExcluding(trimmedName, id);
      if (duplicate) {
        throw new ValidationError('A department with this name already exists');
      }
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      if (description && description.trim().length > MAX_DESCRIPTION_LENGTH) {
        throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
      }
      updateData.description = description ? description.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    await departmentModel.update(id, updateData);
    return this.getById(id);
  },

  async toggleActive(id) {
    const dept = await departmentModel.findById(id);
    if (!dept) {
      throw new NotFoundError('Department not found');
    }

    const newStatus = !dept.is_active;
    await departmentModel.setActive(id, newStatus);
    return this.getById(id);
  },
};

module.exports = departmentService;
