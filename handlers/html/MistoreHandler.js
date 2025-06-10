const axios = require('axios');
const cheerio = require('cheerio');
const BaseHandler = require('../BaseHandler');

class MistoreHandler extends BaseHandler {
  async search(keyword) {
    const url = this.site.url + '?s=' + encodeURIComponent(keyword);
    const html = await axios.get(url).then(res => res.data);
    const $ = cheerio.load(html);

    const selector = JSON.parse(this.site.html_selector || '{}');
    const block = $(selector.productBlock).first();
    const name = block.find(selector.name).text().trim();
    const price = block.find(selector.price).text().trim();
    const link = block.find(selector.linkAttr).attr('href');

    return {
      name, price,
      link: link?.startsWith('http') ? link : this.site.url + link,
      status: (price && link) ? 'FOUND' : 'NOT_FOUND'
    };
  }
}

module.exports = MistoreHandler;
