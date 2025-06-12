const express = require("express");
const app = express();
const searchRouter = require("./routes/search");
const checkApiSitesRoute = require('./routes/checkApiSites');
const checkAllHandlersRoute = require('./routes/checkAllHandlers');

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Chỉ dùng API
app.use("/api", searchRouter);

// Trang root mặc định trả JSON
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "CheckGia API is running." });
});

app.use('/check-api-sites', checkApiSitesRoute);
app.use('/check-all-handlers', checkAllHandlersRoute);

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
