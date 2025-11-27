const User = require('../models/User');

// Save or update high score
const saveHighScore = async (req, res) => {
  try {
    const { score } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Missing score' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only update if new score is higher
    if (score > user.highScore) {
      user.highScore = score;
      await user.save();
    }

    res.json({ highScore: user.highScore });
  } catch (err) {
    console.error('Save score error:', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
};

// Health check
const health = (req, res) => {
  res.json({ status: 'OK', authenticated: !!req.session.userId });
};

module.exports = { saveHighScore, health };
