const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');

const app = express();
const port = 9000;

app.use(cors());
app.use(bodyParser.json());

const csvWriter = createCsvWriter({
  path: 'logs.csv',
  header: [
    {id: 'content', title: 'Content'},
    {id: 'keyword', title: 'Keywords'},
    {id: 'volume', title: 'Volume'},
    {id: 'date', title: 'Date'}
  ],
  append:true
});

if (!fs.existsSync('logs.csv')) {
  csvWriter.writeRecords([]).then(() => {
    console.log('Created logs.csv and added headers.');
  });
}

app.get("/", (req, res) => {
  console.log("Downloading logs ....")
  try {
    const filePath = 'logs.csv';

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Logs file not found.');
    }

    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.setHeader('Content-Type', 'text/csv');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).send('Error downloading the file');
  }
})
app.post('/', (req, res) => {
  let { content, keyword } = req.body;
  content = content.replace(/[\[\]$:]/g, '')
                   .replace(/[;,]/g, '')
                   .replace(/title|date|messagedescription|message|time/g, '')
                   .trim() || content;

  if (!content || !keyword) {
    return res.status(400).send('Both content and keyword are required.');
  }
  const keywordVolumePairs = keyword.match(/\b(\w+[\s\w]*)\s+\[(\d+(?:\.\d+)?[KkMm]?)\]/g) || [];
  const keywords = [];
  const volumes = [];

  keywordVolumePairs.forEach(pair => {
    const match = pair.match(/(\w+[\s\w]*)\s+\[(\d+(?:\.\d+)?[KkMm]?)\]/);
    if (match) {
      keywords.push(match[1].trim());
      volumes.push(match[2].toUpperCase().replace('K', '000').replace('M', '000000'));
    }
  });

  if (keywords.length === 0 || volumes.length === 0) {
    return res.status(400).send('No valid keyword-volume pairs found.');
  }

  const record = [{
    content: content,
    keyword: keywords.join(', '),
    volume: volumes.join(', '),
    date: new Date().toISOString().split('T')[0]
  }];

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
