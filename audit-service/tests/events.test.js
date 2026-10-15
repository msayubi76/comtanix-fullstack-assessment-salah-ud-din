const { describe, test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../src/app');
const Event = require('../src/models/Event');
const { sign, makeEvent } = require('./helpers');

const app = createApp();

function postEvent(event, signature) {
  const body = JSON.stringify(event);

  return request(app)
    .post('/events')
    .set('Content-Type', 'application/json')
    .set('X-Signature', signature ?? sign(body))
    .send(body);
}

before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await Event.init();
});

afterEach(async () => {
  await Event.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('POST /events', () => {
  test('rejects a request without a signature', async () => {
    const res = await request(app)
      .post('/events')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(makeEvent()));

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { status: false, code: 401, message: 'Missing signature.' });
    assert.equal(await Event.countDocuments(), 0);
  });

  test('rejects an invalid or tampered signature', async () => {
    const event = makeEvent();
    const originalSignature = sign(JSON.stringify(event));
    const tampered = { ...event, data: { from: 'new', to: 'closed' } };

    const wrong = await postEvent(event, 'not-a-real-signature');
    const reused = await postEvent(tampered, originalSignature);

    assert.equal(wrong.status, 401);
    assert.equal(reused.status, 401);
    assert.equal(reused.body.message, 'Invalid signature.');
    assert.equal(await Event.countDocuments(), 0);
  });

  test('validates the payload', async () => {
    const res = await postEvent({
      eventId: 'not-a-uuid',
      type: 'unknown.type',
      quoteRequestId: 0,
      actorId: 'admin',
      data: [],
      occurredAt: 'yesterday',
    });

    assert.equal(res.status, 422);
    assert.deepEqual(
      Object.keys(res.body.errors).sort(),
      ['actorId', 'data', 'eventId', 'occurredAt', 'quoteRequestId', 'type'],
    );
  });

  test('stores a valid signed event', async () => {
    const event = makeEvent({ actorId: null, type: 'quote_request.created', data: { status: 'new' } });

    const res = await postEvent(event);

    assert.equal(res.status, 201);
    assert.equal(res.body.event.eventId, event.eventId);
    assert.equal(res.body.event.type, 'quote_request.created');
    assert.equal(res.body.event.actorId, null);
    assert.deepEqual(res.body.event.data, { status: 'new' });
    assert.equal(await Event.countDocuments({ eventId: event.eventId }), 1);
  });

  test('stores a duplicate eventId only once and still returns success', async () => {
    const event = makeEvent();

    const first = await postEvent(event);
    const second = await postEvent(event);

    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(second.body.status, true);
    assert.equal(second.body.message, 'Event already recorded.');
    assert.equal(second.body.event.id, first.body.event.id);
    assert.equal(await Event.countDocuments({ eventId: event.eventId }), 1);
  });
});

describe('GET /events', () => {
  beforeEach(async () => {
    await Event.create([
      makeEvent({ quoteRequestId: 1, type: 'quote_request.created', occurredAt: '2026-10-15T09:00:00Z' }),
      makeEvent({ quoteRequestId: 1, type: 'quote_request.assigned', occurredAt: '2026-10-15T10:00:00Z' }),
      makeEvent({ quoteRequestId: 1, type: 'quote_request.status_changed', occurredAt: '2026-10-15T11:00:00Z' }),
      makeEvent({ quoteRequestId: 2, type: 'quote_request.created', occurredAt: '2026-10-15T12:00:00Z' }),
    ]);
  });

  test('filters by quoteRequestId and returns newest first', async () => {
    const res = await request(app).get('/events?quoteRequestId=1');

    assert.equal(res.status, 200);
    assert.equal(res.body.meta.total, 3);
    assert.deepEqual(res.body.events.map((e) => e.type), [
      'quote_request.status_changed',
      'quote_request.assigned',
      'quote_request.created',
    ]);
  });

  test('filters by type and paginates', async () => {
    const byType = await request(app).get('/events?type=quote_request.created');
    const paged = await request(app).get('/events?quoteRequestId=1&per_page=2&page=2');

    assert.deepEqual(byType.body.events.map((e) => e.quoteRequestId), [2, 1]);
    assert.deepEqual(paged.body.meta, { current_page: 2, per_page: 2, total: 3, last_page: 2 });
    assert.equal(paged.body.events.length, 1);
    assert.equal(paged.body.events[0].type, 'quote_request.created');
  });

  test('rejects invalid query parameters', async () => {
    const res = await request(app).get('/events?quoteRequestId=abc&per_page=500');

    assert.equal(res.status, 422);
    assert.deepEqual(Object.keys(res.body.errors).sort(), ['per_page', 'quoteRequestId']);
  });
});
