const express = require("express");
const router = express.Router();
const pool = require("../db");
const { getHandler } = require("../handlers");

function stripPrice(priceText) {
  return parseFloat((priceText || "").replace(/[^\d.]/g, "")) || 0;
}

router.post("/", async (req, res) => {
  const { keyword } = req.body;

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Keyword is required" });
  }

  const connection = await pool.getConnection();
  try {
    const [websites] = await connection.query("SELECT * FROM websites");
    const results = [];

    for (const site of websites) {
      try {
        const handler = getHandler(site);
        const result = await handler.search(keyword);

        results.push({ site: site.name, ...result });

        if (result.status === "FOUND") {
          await connection.query(
            `INSERT INTO products (name, price, link, site_id, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
              result.name,
              stripPrice(result.price),
              result.link,
              site.id,
            ]
          );
        }
      } catch (err) {
        console.error(`❌ Lỗi tại site "${site.name}":`, err.message);
        results.push({ site: site.name, status: "ERROR", error: err.message });
      }
    }

    res.json({ keyword, results });

  } catch (err) {
    console.error("❌ Lỗi tổng:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
