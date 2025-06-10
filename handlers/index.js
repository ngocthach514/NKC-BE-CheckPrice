const fs = require("fs");
const path = require("path");
const BaseHandler = require("./BaseHandler");

const apiHandlers = {};
const htmlHandlers = {};

fs.readdirSync(path.join(__dirname, "api")).forEach((file) => {
  if (file.endsWith("Handler.js")) {
    const HandlerClass = require(`./api/${file}`);
    const key = file.replace("Handler.js", "").toLowerCase();
    apiHandlers[key] = HandlerClass;
  }
});

fs.readdirSync(path.join(__dirname, "html")).forEach((file) => {
  if (file.endsWith("Handler.js")) {
    const HandlerClass = require(`./html/${file}`);
    const key = file.replace("Handler.js", "").toLowerCase();
    htmlHandlers[key] = HandlerClass;
  }
});

function getHandler(site) {
  const namePart = site.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const domainPart = getDomain(site.url);
  const key = `${namePart}-${domainPart}`;

  if (site.has_api && apiHandlers[key]) {
    return new apiHandlers[key](site);
  }

  if (!site.has_api && htmlHandlers[namePart]) {
    return new htmlHandlers[namePart](site);
  }

  console.warn(`⚠️ Không tìm thấy handler cho site: ${site.name} (${key})`);
  return new BaseHandler(site);
}


function getDomain(url) {
  try {
    return new URL(url).hostname.split(".")[0].toLowerCase();
  } catch {
    return "default";
  }
}

module.exports = { getHandler };
