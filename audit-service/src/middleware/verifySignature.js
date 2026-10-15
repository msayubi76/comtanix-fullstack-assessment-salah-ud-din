const crypto = require('crypto');
const config = require('../config');
const ApiError = require('../utils/ApiError');

function verifySignature(req, res, next) {
  const signature = req.get('X-Signature');

  if (!signature || !req.rawBody) {
    throw new ApiError(401, 'Missing signature.');
  }

  const expected = crypto
    .createHmac('sha256', config.auditSecret)
    .update(req.rawBody)
    .digest('hex');

  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);

  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) {
    throw new ApiError(401, 'Invalid signature.');
  }

  next();
}

module.exports = verifySignature;
