// controllers/focusController.js — Focus session logging and heatmap data
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');

// @route   POST /api/focus/log
// @access  Private — called when a Pomodoro session completes on the frontend
const logSession = async (req, res, next) => {
  try {
    const { durationMinutes, subject, sessionType } = req.body;

    if (!durationMinutes || durationMinutes < 1) {
      return res.status(400).json({ success: false, message: 'Valid duration is required' });
    }

    const session = await FocusSession.create({
      user: req.user._id,
      durationMinutes,
      subject: subject || null,
      sessionType: sessionType || 'pomodoro',
      completedAt: new Date(),
    });

    // Update aggregate focus minutes on the User document (optimistic increment)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'studyStats.totalFocusMinutes': durationMinutes },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/focus/heatmap
// @access  Private — returns daily session totals for the past 365 days
const getHeatmapData = async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // MongoDB aggregation pipeline:
    // 1. Filter sessions in date range for this user
    // 2. Group by calendar date (YYYY-MM-DD)
    // 3. Sum minutes per day and count sessions
    const heatmapData = await FocusSession.aggregate([
      {
        $match: {
          user: req.user._id,
          completedAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          totalMinutes: { $sum: '$durationMinutes' },
          sessionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalMinutes: 1,
          sessionCount: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({ success: true, data: heatmapData });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/focus/stats
// @access  Private — summary stats for dashboard widgets
const getStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [weeklyStats, user] = await Promise.all([
      FocusSession.aggregate([
        { $match: { user: req.user._id, completedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: null,
            weeklyMinutes: { $sum: '$durationMinutes' },
            weeklySessions: { $sum: 1 },
          },
        },
      ]),
      User.findById(req.user._id).select('studyStats streak'),
    ]);

    res.json({
      success: true,
      data: {
        totalFocusMinutes: user.studyStats.totalFocusMinutes,
        completedTasks: user.studyStats.completedTasks,
        streak: user.streak,
        weeklyMinutes: weeklyStats[0]?.weeklyMinutes || 0,
        weeklySessions: weeklyStats[0]?.weeklySessions || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logSession, getHeatmapData, getStats };
