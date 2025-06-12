const express = require("express");
const app = express();
const searchRouter = require("./routes/search");

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Chỉ dùng API
app.use("/api", searchRouter);

// Trang root mặc định trả JSON
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "CheckGia API is running." });
});

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
