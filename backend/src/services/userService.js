const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

const BCRYPT_ROUNDS = 12;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;

function toUserDTO(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    roleId: row.role_id,
    department: row.department,
    departmentId: row.department_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return null;
}

async function validateRoleId(roleId) {
  const roles = await userModel.findAllRoles();
  if (!roles.some((r) => r.id === roleId)) {
    throw new ValidationError('Invalid role selected');
  }
}

async function validateDepartmentId(departmentId) {
  if (!departmentId) return;
  const departments = await userModel.findAllDepartments();
  if (!departments.some((d) => d.id === departmentId)) {
    throw new ValidationError('Invalid department selected');
  }
}

const userService = {
  async getAll() {
    const rows = await userModel.findAll();
    return rows.map(toUserDTO);
  },

  async getById(id) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toUserDTO(user);
  },

  async create({ email, password, firstName, lastName, roleId, departmentId }) {
    if (!email || !password || !firstName || !lastName || !roleId) {
      throw new ValidationError('Email, password, first name, last name, and role are required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      throw new ValidationError(`Email must be ${MAX_EMAIL_LENGTH} characters or fewer`);
    }

    if (!validateEmail(normalizedEmail)) {
      throw new ValidationError('Invalid email format');
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }

    if (firstName.trim().length > MAX_NAME_LENGTH) {
      throw new ValidationError(`First name must be ${MAX_NAME_LENGTH} characters or fewer`);
    }
    if (lastName.trim().length > MAX_NAME_LENGTH) {
      throw new ValidationError(`Last name must be ${MAX_NAME_LENGTH} characters or fewer`);
    }

    await validateRoleId(roleId);
    await validateDepartmentId(departmentId);

    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) {
      throw new ValidationError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const insertId = await userModel.create({
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roleId,
      departmentId: departmentId || null,
    });

    return this.getById(insertId);
  },

  async update(id, { email, password, firstName, lastName, roleId, departmentId }) {
    const existing = await userModel.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updateData = {};

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
        throw new ValidationError(`Email must be ${MAX_EMAIL_LENGTH} characters or fewer`);
      }
      if (!validateEmail(normalizedEmail)) {
        throw new ValidationError('Invalid email format');
      }
      const duplicate = await userModel.findByEmailExcluding(normalizedEmail, id);
      if (duplicate) {
        throw new ValidationError('A user with this email already exists');
      }
      updateData.email = normalizedEmail;
    }

    if (password !== undefined && password !== '') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new ValidationError(passwordError);
      }
      updateData.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    if (firstName !== undefined) {
      if (firstName.trim().length > MAX_NAME_LENGTH) {
        throw new ValidationError(`First name must be ${MAX_NAME_LENGTH} characters or fewer`);
      }
      updateData.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (lastName.trim().length > MAX_NAME_LENGTH) {
        throw new ValidationError(`Last name must be ${MAX_NAME_LENGTH} characters or fewer`);
      }
      updateData.lastName = lastName.trim();
    }

    if (roleId !== undefined) {
      await validateRoleId(roleId);
      updateData.roleId = roleId;
    }
    if (departmentId !== undefined) {
      await validateDepartmentId(departmentId);
      updateData.departmentId = departmentId || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    await userModel.update(id, updateData);
    return this.getById(id);
  },

  async toggleActive(id, requestingUserId) {
    if (Number(id) === Number(requestingUserId)) {
      throw new ValidationError('You cannot deactivate your own account');
    }

    const user = await userModel.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.is_active && user.role === 'admin') {
      const allUsers = await userModel.findAll();
      const activeAdmins = allUsers.filter((u) => u.role === 'admin' && u.is_active);
      if (activeAdmins.length <= 1) {
        throw new ValidationError('Cannot deactivate the last active admin account');
      }
    }

    const newStatus = !user.is_active;
    await userModel.setActive(id, newStatus);
    return this.getById(id);
  },

  async getRoles() {
    return userModel.findAllRoles();
  },

  async getDepartments() {
    return userModel.findAllDepartments();
  },
};

module.exports = userService;
