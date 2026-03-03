import api from './api';

export const ticketService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    }
    const query = params.toString();
    const url = query ? `/tickets?${query}` : '/tickets';
    const { data } = await api.get(url);
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
