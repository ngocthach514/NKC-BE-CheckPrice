const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // TODO: chuẩn hóa & lưu DB
  console.log('Excel data:', data);

  fs.unlinkSync(filePath); // Xoá file sau khi xử lý
  res.json({ status: 'success', message: 'File uploaded & parsed', data });
});

module.exports = router;
