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
      values: lines.map(line => [nowNs(), line])
    }]
  };

  try {
    const res = await axios.post(LOKI_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.status;
  } catch (err) {
    console.error('❌ Error pushing to Loki:', err.response?.status || err.message);
    return null;
  }
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