const pool = require('../config/database');

const BASE_SELECT = `
  SELECT t.id, t.title, t.description, t.priority, t.status,
         t.created_at, t.updated_at,
         c.id AS category_id, c.name AS category_name,
         d.id AS department_id, d.name AS department_name,
         cu.id AS creator_id, cu.first_name AS creator_first_name,
         cu.last_name AS creator_last_name, cu.email AS creator_email,
         au.id AS assignee_id, au.first_name AS assignee_first_name,
         au.last_name AS assignee_last_name, au.email AS assignee_email
  FROM tickets t
  JOIN categories c ON t.category_id = c.id
  JOIN departments d ON t.department_id = d.id
  JOIN users cu ON t.created_by = cu.id
  LEFT JOIN users au ON t.assigned_to = au.id`;

const ticketModel = {
  async findAll({ role, userId, departmentId }) {
    let where = '';
    const params = [];

    if (role === 'admin') {
      where = '';
    } else if (role === 'manager') {
      where = 'WHERE t.department_id = ?';
      params.push(departmentId);
    } else {
      where = 'WHERE (t.created_by = ? OR t.assigned_to = ?)';
      params.push(userId, userId);
    }

    const [rows] = await pool.execute(
      `${BASE_SELECT} ${where} ORDER BY t.updated_at DESC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `${BASE_SELECT} WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ title, description, categoryId, priority, departmentId, createdBy }) {
    const [result] = await pool.execute(
      `INSERT INTO tickets (title, description, category_id, priority, status, department_id, created_by)
       VALUES (?, ?, ?, ?, 'open', ?, ?)`,
      [title, description || null, categoryId, priority, departmentId, createdBy]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const columns = [];
    const values = [];

    if (fields.title !== undefined) { columns.push('title = ?'); values.push(fields.title); }
    if (fields.description !== undefined) { columns.push('description = ?'); values.push(fields.description); }
    if (fields.categoryId !== undefined) { columns.push('category_id = ?'); values.push(fields.categoryId); }
    if (fields.priority !== undefined) { columns.push('priority = ?'); values.push(fields.priority); }
    if (fields.status !== undefined) { columns.push('status = ?'); values.push(fields.status); }
    if (fields.assignedTo !== undefined) { columns.push('assigned_to = ?'); values.push(fields.assignedTo); }
    if (fields.departmentId !== undefined) { columns.push('department_id = ?'); values.push(fields.departmentId); }

    if (columns.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE tickets SET ${columns.join(', ')} WHERE id = ?`,
      values
    );
  },

  async findHistoryByTicketId(ticketId) {
    const [rows] = await pool.execute(
      `SELECT h.id, h.field_changed, h.old_value, h.new_value, h.created_at,
              u.id AS user_id, u.first_name, u.last_name
       FROM ticket_history h
       JOIN users u ON h.changed_by = u.id
       WHERE h.ticket_id = ?
       ORDER BY h.created_at DESC`,
      [ticketId]
    );
    return rows;
  },

  async createHistoryEntry({ ticketId, changedBy, fieldChanged, oldValue, newValue }) {
    await pool.execute(
      `INSERT INTO ticket_history (ticket_id, changed_by, field_changed, old_value, new_value)
       VALUES (?, ?, ?, ?, ?)`,
      [ticketId, changedBy, fieldChanged, oldValue || null, newValue || null]
    );
  },
};

module.exports = ticketModel;
