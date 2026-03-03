const pool = require('../config/database');

function buildWhereClause(scope) {
  if (scope.role === 'admin') {
    return { where: '', params: [] };
  }
  if (scope.role === 'manager') {
    return { where: 'WHERE t.department_id = ?', params: [scope.departmentId] };
  }
  return {
    where: 'WHERE (t.created_by = ? OR t.assigned_to = ?)',
    params: [scope.userId, scope.userId],
  };
}

const dashboardModel = {
  async totalCount(scope) {
    const { where, params } = buildWhereClause(scope);
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM tickets t ${where}`,
      params
    );
    return rows[0].total;
  },

  async countByField(field, scope) {
    const allowedFields = ['status', 'priority', 'department_id'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid group field: ${field}`);
    }

    const { where, params } = buildWhereClause(scope);
    const [rows] = await pool.execute(
      `SELECT t.${field} AS label, COUNT(*) AS count FROM tickets t ${where} GROUP BY t.${field}`,
      params
    );
    return rows;
  },

  async unassignedCount(scope) {
    const { where, params } = buildWhereClause(scope);
    const extra = where ? `${where} AND t.assigned_to IS NULL` : 'WHERE t.assigned_to IS NULL';
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM tickets t ${extra}`,
      params
    );
    return rows[0].total;
  },

  async recentTickets(limit, scope) {
    const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 5;
    const { where, params } = buildWhereClause(scope);
    params.push(String(safeLimit));
    const [rows] = await pool.execute(
      `SELECT t.id, t.title, t.priority, t.status, t.created_at, t.updated_at,
              d.name AS department_name,
              au.first_name AS assignee_first_name, au.last_name AS assignee_last_name
       FROM tickets t
       JOIN departments d ON t.department_id = d.id
       LEFT JOIN users au ON t.assigned_to = au.id
       ${where}
       ORDER BY t.updated_at DESC
       LIMIT ?`,
      params
    );
    return rows;
  },

  async countByDepartment(scope) {
    const { where, params } = buildWhereClause(scope);
    const [rows] = await pool.execute(
      `SELECT d.name AS label, COUNT(*) AS count
       FROM tickets t
       JOIN departments d ON t.department_id = d.id
       ${where}
       GROUP BY d.name
       ORDER BY count DESC`,
      params
    );
    return rows;
  },
};

module.exports = dashboardModel;
