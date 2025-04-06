const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ✅ Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Root loads login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

// ✅ Serve any HTML page from /pages
app.get('/pages/:page', (req, res) => {
  const file = path.join(__dirname, '../public/pages', req.params.page);
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send('Page not found');
  }
});

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
