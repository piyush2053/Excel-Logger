const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const port = 9000;

app.use(bodyParser.json());

const csvWriter = createCsvWriter({
  path: 'logs.csv',
  header: [
    { id: 'content', title: 'CONTENT' },
    { id: 'keyword', title: 'KEYWORD' }
  ],
  append: true
});

if (!fs.existsSync('logs.csv')) {
  csvWriter.writeRecords([]).then(() => {
    console.log('Created logs.csv and added headers.');
  });
}

app.get('/api', (req, res) => {
  const content = req.query.content;
  const keyword = req.query.keyword;

  if (!content || !keyword) {
    return res.status(400).send('Both content and keyword are required.');
  }

  const record = [{ content: content, keyword: keyword }];

  csvWriter.writeRecords(record)
    .then(() => {
      console.log('Record added to logs.csv');
      res.send('Record added successfully.');
    })
    .catch(err => {
      console.error('Error writing to CSV', err);
      res.status(500).send('Error writing to CSV');
    });
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
