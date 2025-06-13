const express = require("express");
const router = express.Router();
const db = require("../db");
const { getHandler } = require("../handlers");
const axios = require("axios");
const puppeteer = require("puppeteer");

async function isSiteAlive(url) {
  try {
    const res = await axios.head(url, { timeout: 5000 });
    return { ok: res.status >= 200 && res.status < 400, reason: "" };
  } catch (err) {
    return { ok: false, reason: err.message || "HEAD failed" };
  }
}

async function isSiteAliveFallback(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    const status = res.status();
    await browser.close();
    return { ok: status >= 200 && status < 400, reason: `Status: ${status}` };
  } catch (err) {
    if (browser) await browser.close();
    return { ok: false, reason: err.message || "Puppeteer failed" };
  }
}

router.get("/", async (req, res) => {
  try {
    const [sites] = await db.query(`
      SELECT id, name, handler_key, has_api, url 
      FROM websites 
      WHERE handler_key IS NOT NULL
    `);

    const results = await Promise.all(
      sites.map(async (site) => {
        let siteOnline = false;
        let onlineReason = "";
        let handlerValid = false;
        let handlerStatus = "✅ Hợp lệ";

        // 🔍 Handler kiểm tra
        try {
          const handler = getHandler(site);
          if (!handler || typeof handler.search !== "function") {
            handlerStatus = "❌ Không có hàm search()";
          } else {
            // chạy thử search với keyword giả lập
            const result = await handler.search("test");
            if (!result || result.status !== "FOUND") {
              handlerStatus = "❌ search() trả về NOT_FOUND hoặc sai format";
            } else {
              handlerValid = true;
            }
          }
        } catch (err) {
          handlerStatus = `❌ Handler lỗi: ${err.message}`;
        }

        // 🌐 Online kiểm tra
        const head = await isSiteAlive(site.url);
        if (head.ok) {
          siteOnline = true;
        } else {
          const fallback = await isSiteAliveFallback(site.url);
          siteOnline = fallback.ok;
          onlineReason = fallback.ok ? "" : fallback.reason || head.reason;
        }

        return {
          id: site.id,
          name: site.name,
          handler_key: site.handler_key,
          has_api: !!site.has_api,
          online: siteOnline,
          online_status: siteOnline ? "🟢 Đang hoạt động" : `🔴 Lỗi: ${onlineReason || head.reason}`,
          handler_ok: handlerValid,
          handler_status: handlerStatus,
        };
      })
    );

    res.json({
      success: true,
      message: "✅ Đã kiểm tra chi tiết tất cả handler và site.",
      total: results.length,
      data: results,
    });
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra:", err.stack || err.message);
    res.status(500).json({
      success: false,
      message: "❌ Lỗi nội bộ khi kiểm tra handler/site.",
    });
  }
});

module.exports = router;
