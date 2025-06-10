const axios = require("axios");
const BaseHandler = require("../BaseHandler");

class HaVietHavietproHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = Array.isArray(json) ? json[0] : null;
    if (!product) return { status: "NOT_FOUND" };

    return {
      name: product.productName || "",
      price: stripHTML(product.price || ""),
      link: product.productUrl?.startsWith("http")
        ? product.productUrl
        : `${this.site.url.replace(/\/$/, "")}${product.productUrl}`,
      status: "FOUND",
    };
  }
}

function stripHTML(html) {
  return typeof html === "string" ? html.replace(/<[^>]*>/g, "").trim() : html;
}

module.exports = HaVietHavietproHandler;
