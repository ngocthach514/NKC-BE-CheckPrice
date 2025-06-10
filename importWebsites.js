require('dotenv').config();
const { getConnection } = require('./db');
const xlsx = require('xlsx');
const path = require('path');

async function insertWebsites() {
  const connection = await getConnection();
  const filePath = path.join(__dirname, 'uploads', 'Danh sách website Check giá.xlsx');

  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const name = row['Tên Wed'] || row['Tên Web'] || '';
      const url = row['Link wed'] || '';
      if (!url) continue;

      await connection.execute(
        `INSERT INTO websites (name, url) 
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [name.trim(), url.trim()]
      );
    }

    console.log(`✅ Imported sheet: ${sheetName}`);
  }

  console.log('✅ Done importing all sheets');
  await connection.end();
}

insertWebsites();
