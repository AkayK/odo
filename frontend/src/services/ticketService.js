import api from './api';

export const ticketService = {
  async getAll() {
    const { data } = await api.get('/tickets');
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/tickets/${id}`);
    return data.data;
  },

  async create(ticketData) {
    const { data } = await api.post('/tickets', ticketData);
    return data.data;
  },

  async update(id, ticketData) {
    const { data } = await api.put(`/tickets/${id}`, ticketData);
    return data.data;
  },

  async changeStatus(id, status) {
    const { data } = await api.put(`/tickets/${id}/status`, { status });
    return data.data;
  },

  async assign(id, assignedTo) {
    const { data } = await api.put(`/tickets/${id}/assign`, { assignedTo });
    return data.data;
  },

  async getHistory(id) {
    const { data } = await api.get(`/tickets/${id}/history`);
    return data.data;
  },
};
