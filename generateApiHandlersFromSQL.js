require("dotenv").config();
const fs = require('fs');
const path = require('path');
const agent = require("https-proxy-agent");

function getAxiosWithProxy() {
  const axios = require("axios");
  if (!process.env.PROXY_HOST || !process.env.PROXY_PORT) return axios;

  const proxyAgent = new agent.HttpsProxyAgent({
    host: process.env.PROXY_HOST,
    port: parseInt(process.env.PROXY_PORT),
    auth: process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD
      ? `${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}`
      : undefined,
  });

  return axios.create({
    httpsAgent: proxyAgent,
    proxy: false,
  });
}

const sqlFilePath = path.join(__dirname, 'tool_check_price.sql');
const outputDir = path.join(__dirname, 'handlers', 'api');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

const apiEntries = [...sqlContent.matchAll(
  /\(\d+,\s*'([^']+)',\s*'([^']+)',\s*1,\s*'([^']+)',\s*NULL,\s*'({.+?})'\)/gs
)];

if (apiEntries.length === 0) {
  console.log('❌ Không tìm thấy website nào có has_api = 1 và có json');
  process.exit(1);
}

for (const entry of apiEntries) {
  const siteName = entry[1].trim();
  const url = entry[2].trim();
  const apiUrl = entry[3].trim();
  const jsonRaw = entry[4];

  const namePart = toPascalCase(siteName);
  const domainPart = toPascalCase(getDomainName(url));

  const className = `${namePart}${domainPart}Handler`;
  const fileName = `${namePart}-${domainPart}Handler.js`;
  const filePath = path.join(outputDir, fileName);

  const isArrayJson = jsonRaw.trim().startsWith('[');
  const customLogic = isArrayJson ? `
    const result = Array.isArray(json) ? json[0] : null;
    if (!result) return { status: 'NOT_FOUND' };

    return {
      name: result.productName || '',
      price: stripHTML(result.price || ''),
      link: result.productUrl?.startsWith('http')
        ? result.productUrl
        : \`\${this.site.url}\${result.productUrl}\`,
      status: 'FOUND'
    };` : `
    const result = Array.isArray(json?.suggestions)
      ? json.suggestions[0]
      : json?.results?.[0] || json?.products?.[0];

    if (!result) return { status: 'NOT_FOUND' };

    return {
      name: result?.value || result?.name || '',
      price: stripHTML(result?.price || result?.priceText || result?.price_html || ''),
      link: result?.url || result?.viewLink || '',
      status: 'FOUND'
    };`;

  const template = `
const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class ${className} extends BaseHandler {
  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const axios = getAxiosWithProxy();
    const res = await axios.get(url);
    const json = res.data;

    // 👉 Dữ liệu json mẫu:
    // ${jsonRaw.substring(0, 200).replace(/\n/g, ' ').replace(/"/g, '\\"')}...

    ${customLogic}
  }
}

function stripHTML(html) {
  return typeof html === 'string' ? html.replace(/<[^>]+>/g, '').trim() : html;
}

module.exports = ${className};
`.trim();

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(`✅ Created handler: handlers/api/${fileName}`);
}

function getDomainName(url) {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'default';
  }
}

function toPascalCase(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}