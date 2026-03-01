const ticketModel = require('../models/ticketModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['open', 'in_progress', 'on_hold', 'closed'];

const VALID_TRANSITIONS = {
  open: ['in_progress', 'closed'],
  in_progress: ['on_hold', 'closed'],
  on_hold: ['in_progress'],
  closed: [],
};

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

function toTicketDTO(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: { id: row.category_id, name: row.category_name },
    department: { id: row.department_id, name: row.department_name },
    createdBy: {
      id: row.creator_id,
      firstName: row.creator_first_name,
      lastName: row.creator_last_name,
      email: row.creator_email,
    },
    assignedTo: row.assignee_id
      ? {
          id: row.assignee_id,
          firstName: row.assignee_first_name,
          lastName: row.assignee_last_name,
          email: row.assignee_email,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toHistoryDTO(row) {
  return {
    id: row.id,
    fieldChanged: row.field_changed,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
    createdAt: row.created_at,
  };
}

function canUserAccessTicket(ticket, currentUser) {
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'manager' && ticket.department_id === currentUser.departmentId) return true;
  if (ticket.creator_id === currentUser.id || ticket.assignee_id === currentUser.id) return true;
  return false;
}

function canUserModifyTicket(ticket, currentUser) {
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'manager' && ticket.department_id === currentUser.departmentId) return true;
  if (ticket.creator_id === currentUser.id || ticket.assignee_id === currentUser.id) return true;
  return false;
}

async function logChanges(ticketId, changedBy, oldTicket, newFields) {
  const fieldMap = {
    title: { old: oldTicket.title, column: 'title' },
    description: { old: oldTicket.description, column: 'description' },
    priority: { old: oldTicket.priority, column: 'priority' },
    status: { old: oldTicket.status, column: 'status' },
    categoryId: { old: String(oldTicket.category_id), column: 'category_id' },
    assignedTo: { old: oldTicket.assignee_id ? String(oldTicket.assignee_id) : null, column: 'assigned_to' },
  };

  const entries = [];
  for (const [key, mapping] of Object.entries(fieldMap)) {
    if (newFields[key] === undefined) continue;
    const newVal = newFields[key] === null ? null : String(newFields[key]);
    const oldVal = mapping.old === null ? null : String(mapping.old);
    if (newVal !== oldVal) {
      entries.push({
        ticketId,
        changedBy,
        fieldChanged: mapping.column,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  for (const entry of entries) {
    await ticketModel.createHistoryEntry(entry);
  }
}

const ticketService = {
  async getAll(currentUser) {
    const rows = await ticketModel.findAll({
      role: currentUser.role,
      userId: currentUser.id,
      departmentId: currentUser.departmentId,
    });
    return rows.map(toTicketDTO);
  },

  async getById(id, currentUser) {
    const ticket = await ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!canUserAccessTicket(ticket, currentUser)) {
      throw new ForbiddenError('You do not have access to this ticket');
    }

    return toTicketDTO(ticket);
  },

  async create(data, currentUser) {
    const { title, description, categoryId, priority } = data;

    if (!title || !title.trim()) {
      throw new ValidationError('Title is required');
    }
    if (title.trim().length > MAX_TITLE_LENGTH) {
      throw new ValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
    }
    if (description && description.trim().length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
    }
    if (!categoryId) {
      throw new ValidationError('Category is required');
    }
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const category = await categoryModel.findById(categoryId);
    if (!category || !category.is_active) {
      throw new ValidationError('Invalid or inactive category selected');
    }

    const insertId = await ticketModel.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      categoryId,
      priority,
      departmentId: category.department_id,
      createdBy: currentUser.id,
    });

    return this.getById(insertId, currentUser);
  },

  async update(id, data, currentUser) {
    const ticket = await ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!canUserModifyTicket(ticket, currentUser)) {
      throw new ForbiddenError('You do not have permission to modify this ticket');
    }

    if (currentUser.role === 'worker') {
      if (data.priority !== undefined) {
        throw new ForbiddenError('Workers cannot change ticket priority');
      }
    }

    const updateFields = {};

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw new ValidationError('Title cannot be empty');
      }
      if (data.title.trim().length > MAX_TITLE_LENGTH) {
        throw new ValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
      }
      updateFields.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (data.description && data.description.trim().length > MAX_DESCRIPTION_LENGTH) {
        throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
      }
      updateFields.description = data.description ? data.description.trim() : null;
    }

    if (data.categoryId !== undefined) {
      const category = await categoryModel.findById(data.categoryId);
      if (!category) {
        throw new ValidationError('Invalid category selected');
      }
      updateFields.categoryId = data.categoryId;
      updateFields.departmentId = category.department_id;
    }

    if (data.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(data.priority)) {
        throw new ValidationError(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      }
      updateFields.priority = data.priority;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new ValidationError('No fields to update');
    }

    await logChanges(id, currentUser.id, ticket, updateFields);
    await ticketModel.update(id, updateFields);
    return this.getById(id, currentUser);
  },

  async changeStatus(id, data, currentUser) {
    const { status } = data;
    const ticket = await ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!canUserModifyTicket(ticket, currentUser)) {
      throw new ForbiddenError('You do not have permission to change this ticket status');
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (currentUser.role === 'worker' && status === 'closed') {
      throw new ForbiddenError('Workers cannot close tickets');
    }

    const allowed = VALID_TRANSITIONS[ticket.status];
    if (!allowed.includes(status)) {
      throw new ValidationError(
        `Cannot transition from '${ticket.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    await logChanges(id, currentUser.id, ticket, { status });
    await ticketModel.update(id, { status });
    return this.getById(id, currentUser);
  },

  async assign(id, data, currentUser) {
    const { assignedTo } = data;
    const ticket = await ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (currentUser.role === 'worker') {
      throw new ForbiddenError('Workers cannot assign tickets');
    }

    if (currentUser.role === 'manager' && ticket.department_id !== currentUser.departmentId) {
      throw new ForbiddenError('You can only assign tickets within your department');
    }

    if (assignedTo === undefined) {
      throw new ValidationError('assignedTo is required (use null to unassign)');
    }

    if (assignedTo !== null) {
      const assignee = await userModel.findById(assignedTo);
      if (!assignee || !assignee.is_active) {
        throw new ValidationError('Assignee user not found or is inactive');
      }
    }

    await logChanges(id, currentUser.id, ticket, { assignedTo });
    await ticketModel.update(id, { assignedTo });
    return this.getById(id, currentUser);
  },

  async getHistory(ticketId, currentUser) {
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!canUserAccessTicket(ticket, currentUser)) {
      throw new ForbiddenError('You do not have access to this ticket');
    }

    const rows = await ticketModel.findHistoryByTicketId(ticketId);
    return rows.map(toHistoryDTO);
  },
};

module.exports = ticketService;
