const express = require('express');
const mongoose = require('mongoose');
const { success } = require('./utils/apiResponse');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // keep the exact bytes Laravel signed, the HMAC check needs them
  app.use(express.json({
    limit: '100kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.get('/health', (req, res) => {
    return success(res, 'Audit service is running.', {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
