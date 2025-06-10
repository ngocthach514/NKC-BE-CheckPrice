require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoute = require('./routes/upload');
const searchRoute = require('./routes/search');
const historyRoute = require('./routes/history');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/upload', uploadRoute);
app.use('/search', searchRoute);
app.use('/history', historyRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});