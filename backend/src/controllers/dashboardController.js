const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getStats(req, res) {
    const stats = await dashboardService.getStats(req.user);
    res.json({ success: true, data: stats });
  },
};

module.exports = dashboardController;
