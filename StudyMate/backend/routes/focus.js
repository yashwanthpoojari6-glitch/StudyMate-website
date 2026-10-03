// routes/focus.js
const express = require('express');
const router = express.Router();
const { logSession, getHeatmapData, getStats } = require('../controllers/focusController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/log', logSession);
router.get('/heatmap', getHeatmapData);
router.get('/stats', getStats);

module.exports = router;
