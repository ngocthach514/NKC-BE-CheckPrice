const express = require("express");
const router = express.Router();
const db = require("../db");
const { getHandler } = require("../handlers");

router.get("/", async (req, res) => {
  try {
    const [sites] = await db.query(`
      SELECT id, name, handler_key, has_api, url 
      FROM websites 
      WHERE has_api = 1 AND handler_key IS NOT NULL
    `);

    const results = sites.map(site => {
      try {
        const handler = getHandler(site);
        const valid = handler && typeof handler.search === "function";

        return {
          id: site.id,
          name: site.name,
          handler_key: site.handler_key,
          status: valid ? "✅ OK" : "❌ INVALID (không có hàm search)",
          has_search: valid
        };
      } catch (err) {
        return {
          id: site.id,
          name: site.name,
          handler_key: site.handler_key,
          status: `❌ ERROR: ${err.message}`,
          has_search: false
        };
      }
    });

    res.json({ success: true, total: results.length, data: results });
  } catch (err) {
    console.error("❌ Error checking handlers:", err.message);
    res.status(500).json({ success: false, message: "Failed to check handlers." });
  }
});

module.exports = router;
