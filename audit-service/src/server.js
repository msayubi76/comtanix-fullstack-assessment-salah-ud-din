const mongoose = require('mongoose');
const config = require('./config');
const createApp = require('./app');

async function start() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

  const server = createApp().listen(config.port, () => {
    console.log(`Audit service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start audit service:', err.message);
  process.exit(1);
});
