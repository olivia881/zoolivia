const express = require('express');
const cors = require('cors');
const path = require('path');

const anagraficaRoutes = require('./routes/anagrafica');
const bustePagaRoutes = require('./routes/bustePaga');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/anagrafica', anagraficaRoutes);
app.use('/api/buste-paga', bustePagaRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});

module.exports = app;
