const crypto = require('crypto');

function sign(body) {
  return crypto.createHmac('sha256', process.env.AUDIT_SECRET).update(body).digest('hex');
}

function makeEvent(overrides = {}) {
  return {
    eventId: crypto.randomUUID(),
    type: 'quote_request.status_changed',
    quoteRequestId: 1,
    actorId: 2,
    data: { from: 'new', to: 'in_review' },
    occurredAt: '2026-10-15T10:00:00.000000Z',
    ...overrides,
  };
}

module.exports = { sign, makeEvent };
