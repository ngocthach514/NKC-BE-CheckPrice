const fs = require("fs");
const path = require("path");
const BaseHandler = require("./BaseHandler");

const apiHandlers = {};
const htmlHandlers = {};

const apiDir = path.join(__dirname, "api");
if (fs.existsSync(apiDir)) {
  fs.readdirSync(apiDir).forEach((file) => {
    if (file.endsWith("Handler.js")) {
      const fullPath = path.join(apiDir, file);
      const HandlerClass = require(fullPath);
      const key = file.replace("Handler.js", "").toLowerCase();
      apiHandlers[key] = HandlerClass;
    }
  });
}

const htmlDir = path.join(__dirname, "html");
if (fs.existsSync(htmlDir)) {
  fs.readdirSync(htmlDir).forEach((file) => {
    if (file.endsWith("Handler.js")) {
      const fullPath = path.join(htmlDir, file);
      const HandlerClass = require(fullPath);
      const key = file.replace("Handler.js", "").toLowerCase();
      htmlHandlers[key] = HandlerClass;
    }
  });
}

function getHandler(site) {
  const rawKey = site.handler_key;
  const key = rawKey?.toLowerCase();

  if (!key) {
    throw new Error(`Không có handler_key cho site: "${site.name}"`);
  }

  if (site.has_api && apiHandlers[key]) {
    return new apiHandlers[key](site);
  }

  if (!site.has_api && htmlHandlers[key]) {
    return new htmlHandlers[key](site);
  }

  throw new Error(`❌ Không tìm thấy handler cho site: "${site.name}" (handler_key: "${key}")`);
}

module.exports = { getHandler };
