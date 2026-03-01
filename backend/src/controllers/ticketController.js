const ticketService = require('../services/ticketService');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid ticket ID');
  }
  return id;
}

const ticketController = {
  async getAll(req, res) {
    const tickets = await ticketService.getAll(req.user);
    res.json({ success: true, data: tickets });
  },

  async getById(req, res) {
    const id = parseId(req.params.id);
    const ticket = await ticketService.getById(id, req.user);
    res.json({ success: true, data: ticket });
  },

  async create(req, res) {
    const { title, description, categoryId, priority } = req.body;
    const ticket = await ticketService.create(
      { title, description, categoryId, priority },
      req.user
    );

    logger.info('Ticket created', {
      createdBy: req.user.id,
      ticketId: ticket.id,
      title: ticket.title,
    });

    res.status(201).json({ success: true, data: ticket });
  },

  async update(req, res) {
    const id = parseId(req.params.id);
    const { title, description, categoryId, priority } = req.body;
    const ticket = await ticketService.update(
      id,
      { title, description, categoryId, priority },
      req.user
    );

    logger.info('Ticket updated', { updatedBy: req.user.id, ticketId: id });

    res.json({ success: true, data: ticket });
  },

  async changeStatus(req, res) {
    const id = parseId(req.params.id);
    const { status } = req.body;
    const ticket = await ticketService.changeStatus(id, { status }, req.user);

    logger.info('Ticket status changed', {
      changedBy: req.user.id,
      ticketId: id,
      newStatus: status,
    });

    res.json({ success: true, data: ticket });
  },

  async assign(req, res) {
    const id = parseId(req.params.id);
    const { assignedTo } = req.body;
    const ticket = await ticketService.assign(id, { assignedTo }, req.user);

    logger.info('Ticket assigned', {
      assignedBy: req.user.id,
      ticketId: id,
      assignedTo,
    });

    res.json({ success: true, data: ticket });
  },

  async getHistory(req, res) {
    const id = parseId(req.params.id);
    const history = await ticketService.getHistory(id, req.user);
    res.json({ success: true, data: history });
  },
};

module.exports = ticketController;
