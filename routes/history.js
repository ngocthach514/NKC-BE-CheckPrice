const express = require('express');
const { getConnection } = require('../db');
const router = express.Router();

router.get('/:keyword', async (req, res) => {
  const keyword = decodeURIComponent(req.params.keyword);
  const connection = await getConnection();

  const [rows] = await connection.execute(`
    SELECT w.name AS site, p.name AS product, p.price, p.created_at
    FROM products p
    JOIN websites w ON w.id = p.site_id
    WHERE p.name LIKE ?
    ORDER BY p.site_id, p.created_at
  `, [`%${keyword}%`]);

  await connection.end();
  res.json({ keyword, history: rows });
});

module.exports = router;
