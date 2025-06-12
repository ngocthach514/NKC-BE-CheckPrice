const fs = require("fs");
const path = require("path");
const BaseHandler = require("./BaseHandler");

const apiHandlers = {};
const htmlHandlers = {};

const apiDir = path.join(__dirname, "api");
fs.readdirSync(apiDir).forEach((file) => {
  if (file.endsWith("Handler.js")) {
    const fullPath = path.join(apiDir, file);
    const HandlerClass = require(fullPath);
    const key = file.replace("Handler.js", "").toLowerCase();
    apiHandlers[key] = HandlerClass;
  }
});

const htmlDir = path.join(__dirname, "html");
fs.readdirSync(htmlDir).forEach((file) => {
  if (file.endsWith("Handler.js")) {
    const fullPath = path.join(htmlDir, file);
    const HandlerClass = require(fullPath);
    const key = file.replace("Handler.js", "").toLowerCase();
    htmlHandlers[key] = HandlerClass;
  }
});

function getHandler(site) {
  const key = site.handler_key || (
    site.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') +
    '-' +
    getDomain(site.url)
  );

  if (site.has_api && apiHandlers[key]) {
    return new apiHandlers[key](site);
  }

  if (!site.has_api && htmlHandlers[key]) {
    return new htmlHandlers[key](site);
  }

  const message = `❌ Không tìm thấy handler cho site: "${site.name}" (handler_key: "${key}")`;
  console.error(message);
  throw new Error(message);
}


function getDomain(url) {
  try {
    return new URL(url).hostname.split(".")[0].toLowerCase();
  } catch {
    return "default";
  }
}

module.exports = { getHandler };
