const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const cliProgress = require('cli-progress');

const filePath = process.argv[2];

if (!filePath || !fs.existsSync(filePath)) {
  console.error('Usage: node loki-import.js /path/to/nginx-access.log');
  process.exit(1);
}

const LOKI_URL = 'http://localhost:3100/loki/api/v1/push';
const LABELS = { job: 'nginx', app: 'tfe' };
const BATCH_SIZE = 100;

// Create a nanosecond timestamp string
const nowNs = () => `${Date.now()}000000`;

async function pushBatch(lines) {
  const payload = {
    streams: [{
      stream: LABELS,
      values: lines.map(line => [parseLokiTimestamp(line), line])
    }]
  };

  let retries = 5;
  let delay = 200; // start with 200ms

  while (retries > 0) {
    try {
      const res = await axios.post(LOKI_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      return res.status;
    } catch (err) {
      const status = err.response?.status || 0;
      if (status === 429 && retries > 0) {
        console.warn(`🔁 Rate limited. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        retries--;
        delay *= 2; // exponential backoff
      } else {
        console.error('❌ Error pushing to Loki:', status || err.message);
        return null;
      }
    }
  }

  console.error('❌ Failed after retries');
  return null;
}

function parseLokiTimestamp(logLine) {
  const match = logLine.match(/\[(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) [+\-]\d{4}\]/);
  if (!match) return `${Date.now()}000000`; // fallback

  const [_, day, monthStr, year, hour, min, sec] = match;
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const month = monthMap[monthStr];
  const date = new Date(Date.UTC(year, month, day, hour, min, sec));
  return `${date.getTime()}000000`;
}

async function countLines(path) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream });
  let count = 0;
  for await (const _ of rl) {
    count++;
  }
  return count;
}

(async () => {
  console.log(`📊 Counting lines in ${filePath}...`);
  const totalLines = await countLines(filePath);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(totalLines, 0);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream });

  let batch = [];
  let lineCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    batch.push(line);
    lineCount++;
    bar.increment();

    if (batch.length >= BATCH_SIZE) {
      await pushBatch(batch);
      batch = [];
    }
  }

  if (batch.length) {
    await pushBatch(batch);
  }

  bar.stop();
  console.log('✅ Import complete.');
})();