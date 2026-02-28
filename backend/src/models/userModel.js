const pool = require('../config/database');

const userModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
              u.is_active, u.created_at, u.updated_at,
              r.name AS role,
              d.id AS department_id, d.name AS department
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name,
              u.is_active, u.created_at, u.updated_at,
              r.id AS role_id, r.name AS role,
              d.id AS department_id, d.name AS department
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name,
              u.is_active, u.created_at, u.updated_at,
              r.id AS role_id, r.name AS role,
              d.id AS department_id, d.name AS department
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async create({ email, passwordHash, firstName, lastName, roleId, departmentId }) {
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, roleId, departmentId || null]
    );
    return result.insertId;
  },

  async update(id, { email, firstName, lastName, roleId, departmentId, passwordHash }) {
    const fields = [];
    const values = [];

    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (firstName !== undefined) { fields.push('first_name = ?'); values.push(firstName); }
    if (lastName !== undefined) { fields.push('last_name = ?'); values.push(lastName); }
    if (roleId !== undefined) { fields.push('role_id = ?'); values.push(roleId); }
    if (departmentId !== undefined) { fields.push('department_id = ?'); values.push(departmentId || null); }
    if (passwordHash !== undefined) { fields.push('password_hash = ?'); values.push(passwordHash); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async setActive(id, isActive) {
    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, id]
    );
  },

  async findByEmailExcluding(email, excludeId) {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, excludeId]
    );
    return rows[0] || null;
  },

  async findAllRoles() {
    const [rows] = await pool.execute('SELECT id, name, description FROM roles ORDER BY id');
    return rows;
  },

  async findAllDepartments() {
    const [rows] = await pool.execute('SELECT id, name, description FROM departments ORDER BY name');
    return rows;
  },
};

module.exports = userModel;
