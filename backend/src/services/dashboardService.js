const dashboardModel = require('../models/dashboardModel');

const dashboardService = {
  async getStats(currentUser) {
    const scope = {
      role: currentUser.role,
      userId: currentUser.id,
      departmentId: currentUser.departmentId,
    };

    const [total, byStatus, byPriority, unassigned, recentTickets] = await Promise.all([
      dashboardModel.totalCount(scope),
      dashboardModel.countByField('status', scope),
      dashboardModel.countByField('priority', scope),
      dashboardModel.unassignedCount(scope),
      dashboardModel.recentTickets(5, scope),
    ]);

    const result = {
      total,
      byStatus: toMap(byStatus),
      byPriority: toMap(byPriority),
      unassigned,
      recentTickets: recentTickets.map(toRecentDTO),
    };

    if (currentUser.role === 'admin') {
      const byDepartment = await dashboardModel.countByDepartment(scope);
      result.byDepartment = byDepartment.map((r) => ({ name: r.label, count: r.count }));
    }

    return result;
  },
};

function toMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.label] = row.count;
  }
  return map;
}

function toRecentDTO(row) {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    status: row.status,
    department: row.department_name,
    assignedTo: row.assignee_first_name
      ? `${row.assignee_first_name} ${row.assignee_last_name}`
      : null,
    updatedAt: row.updated_at,
  };
}

module.exports = dashboardService;
