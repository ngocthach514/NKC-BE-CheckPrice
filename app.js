const express = require("express");
const path = require("path");
const app = express();
const searchRouter = require("./routes/search");

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route API
app.use("/api", searchRouter);

// Nếu vẫn muốn phục vụ frontend:
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});