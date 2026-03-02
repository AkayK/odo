const pool = require('../config/database');

const departmentModel = {
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, name, description, is_active, created_at
       FROM departments
       ORDER BY name`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, description, is_active, created_at FROM departments WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await pool.execute(
      'SELECT id FROM departments WHERE name = ?',
      [name]
    );
    return rows[0] || null;
  },

  async findByNameExcluding(name, excludeId) {
    const [rows] = await pool.execute(
      'SELECT id FROM departments WHERE name = ? AND id != ?',
      [name, excludeId]
    );
    return rows[0] || null;
  },

  async create({ name, description }) {
    const [result] = await pool.execute(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return result.insertId;
  },

  async update(id, { name, description }) {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async setActive(id, isActive) {
    await pool.execute(
      'UPDATE departments SET is_active = ? WHERE id = ?',
      [isActive, id]
    );
  },
};

module.exports = departmentModel;
