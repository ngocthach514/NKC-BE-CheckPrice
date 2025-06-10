const axios = require('axios');
const cheerio = require('cheerio');

async function crawlWebsitesForKeyword(keyword, websites) {
  const results = [];

  for (const site of websites) {
    try {
      if (site.has_api && site.api_url) {
        const res = await axios.get(site.api_url.replace('{keyword}', keyword));
        // Xử lý response nếu có API
        results.push({ site: site.name, price: res.data.price, link: res.data.link });
      } else {
        const searchUrl = site.url.replace('{keyword}', keyword);
        const html = await axios.get(searchUrl);
        const $ = cheerio.load(html.data);

        const sel = JSON.parse(site.html_selector);
        const productBlock = $(sel.productBlock).first();
        const price = productBlock.find(sel.price).text().trim();
        const link = productBlock.find(sel.link).attr('href');

        results.push({ site: site.name, price, link });
      }
    } catch (err) {
      results.push({ site: site.name, error: 'Not found or failed' });
    }
  }

  return results;
}

module.exports = { crawlWebsitesForKeyword };
