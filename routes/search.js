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
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

async function batchExecute(tasks = [], batchSize = 10) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((fn) => fn()));
    for (const res of settled) {
      if (res.status === "fulfilled" && res.value) {
        results.push(res.value);
      }
    }
  }
  return results;
}

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const pairs = q.split("|").map((p) => p.split(","));
  if (pairs.length > 10) {
    return res.status(400).json({ error: "Tối đa 10 từ khóa mỗi truy vấn" });
  }

  const connection = await pool.getConnection();
  const ip = getClientIp(req);
  const timestamp = new Date(Date.now() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const [websites] = await connection.query(
      "SELECT * FROM websites WHERE has_api = 1 AND handler_key IS NOT NULL"
    );

    const allTasks = [];

    for (const [keyword, inputPrice] of pairs) {
      if (!keyword) continue;

      const priceOrigin = parseFloat(inputPrice);
      const hasPrice = !isNaN(priceOrigin);

      for (const site of websites) {
        allTasks.push(async () => {
          try {
            const handler = getHandler(site);
            if (!handler || typeof handler.search !== "function") return;

            const result = await handler.search(keyword);
            if (result.status !== "FOUND") return;

            const foundPrice = parseFloat(result.price);
            if (isNaN(foundPrice)) return;

            return {
              gianhap: hasPrice ? priceOrigin.toString() : "0.0",
              ip,
              name: `${result.name} (${result.link})`,
              price: foundPrice.toString(),
              serial: keyword,
              tilechenhlech: hasPrice
                ? calculateDifference(priceOrigin, foundPrice).toString()
                : "0.0",
              timestamp,
              site: site.name,
            };
          } catch (err) {
            console.error(
              `❌ Lỗi tại site "${site.name}" với '${keyword}':`,
              err.message
            );
          }
        });
      }
    }

    const output = await batchExecute(allTasks, 10);

    res.json(Object.assign({ data: output }, { status: "success" }));
  } catch (err) {
    console.error("❌ Lỗi tổng:", err.stack || err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

module.exports = router;
