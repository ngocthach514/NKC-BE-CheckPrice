class BaseHandler {
  constructor(site) {
    this.site = site;
  }

  async search(keyword) {
    throw new Error('search() must be implemented in subclass');
  }
}

module.exports = BaseHandler;