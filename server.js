// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, '/var/www/imsorryyoudied.com/data/today.json');

app.use(express.static('public')); // Serve index.html and frontend assets

// Get today's month and day as MM/DD
function getTodayKey() {
  const today = new Date();
  return `${today.getMonth() + 1}-${today.getDate()}`;
}

// Fetch and save fresh data if it's a new day
async function updateDataIfNeeded() {
  let shouldUpdate = true;

  if (fs.existsSync(DATA_PATH)) {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    if (data.__dateKey === getTodayKey()) {
      shouldUpdate = false;
    }
  }

  if (shouldUpdate) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/deaths/${month}/${day}`;

    console.log('Fetching fresh data from API...');
    const response = await fetch(url);
    const result = await response.json();
    result.__dateKey = getTodayKey(); // Save date key to avoid refetch

    fs.writeFileSync(DATA_PATH, JSON.stringify(result, null, 2));
  }
}

// Serve the saved JSON
app.get('/data', async (req, res) => {
  await updateDataIfNeeded();
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading data');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});