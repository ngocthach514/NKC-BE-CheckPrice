const express = require("express");
const router = express.Router();
const pool = require("../db");
const { getHandler } = require("../handlers");

function calculateDifference(original, current) {
  const diff = ((current - original) / original) * 100;
  return parseFloat(diff.toFixed(2));
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const pairs = q.split("|").map(p => p.split(","));
  const connection = await pool.getConnection();
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const output = [];

  try {
    const [websites] = await connection.query(
      "SELECT * FROM websites WHERE has_api = 1 AND handler_key IS NOT NULL"
    );

    const keywordPromises = pairs.map(async ([keyword, inputPrice]) => {
      const priceOrigin = parseFloat(inputPrice);
      if (!keyword || isNaN(priceOrigin)) return [];

      const sitePromises = websites.map(async (site) => {
        try {
          const handler = getHandler(site);
          const result = await handler.search(keyword);

          if (result.status === "FOUND") {
            const foundPrice = parseFloat(result.price);
            if (isNaN(foundPrice)) return null;

            const diff = calculateDifference(priceOrigin, foundPrice);

            return {
              gianhap: priceOrigin.toString(),
              ip,
              name: `${result.name} (${result.link})`,
              price: foundPrice.toString(),
              tilechenhlech: diff.toString(),
              serial: result.serial || null,
              timestamp
            };
          }
        } catch (err) {
          console.error(`❌ Lỗi tại site "${site.name}":`, err.message);
        }
        return null;
      });

      const siteResults = await Promise.allSettled(sitePromises);
      return siteResults
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);
    });

    const allResults = await Promise.allSettled(keywordPromises);
    allResults.forEach((result) => {
      if (result.status === "fulfilled") {
        output.push(...result.value);
      }
    });

    res.json({ status: "success", data: output });
  } catch (err) {
    console.error("❌ Lỗi tổng:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
