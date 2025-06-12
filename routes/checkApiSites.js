const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT api_url FROM websites WHERE has_api = 1 AND api_url IS NOT NULL');

    const apiUrls = rows.map(row => row.api_url);
    res.json({ success: true, data: apiUrls });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API URLs.' });
  }
});

module.exports = router;
