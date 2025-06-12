const express = require("express");
const router = express.Router();
const db = require("../db");
const { getHandler } = require("../handlers");

router.get("/", async (req, res) => {
  try {
    const [sites] = await db.query(`
      SELECT id, name, handler_key, has_api, url 
      FROM websites 
      WHERE handler_key IS NOT NULL
    `);

    const results = sites.map((site) => {
      try {
        const handler = getHandler(site);
        const valid = handler && typeof handler.search === "function";

        return {
          id: site.id,
          name: site.name,
          handler_key: site.handler_key,
          status: valid
            ? "✅ HỢP LỆ: Handler hoạt động tốt"
            : "❌ KHÔNG HỢP LỆ: Không có hàm tìm kiếm (search)",
          has_search: valid
        };
      } catch (err) {
        return {
          id: site.id,
          name: site.name,
          handler_key: site.handler_key,
          status: `❌ LỖI: ${err.message}`,
          has_search: false
        };
      }
    });

    res.json({
      success: true,
      message: "Kiểm tra handler hoàn tất",
      total: results.length,
      data: results
    });
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra handler:", err.message);
    res.status(500).json({
      success: false,
      message: "Không thể kiểm tra handler. Vui lòng thử lại sau."
    });
  }
});

module.exports = router;
