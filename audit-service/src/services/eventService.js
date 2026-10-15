const Event = require('../models/Event');

const DUPLICATE_KEY_ERROR = 11000;

async function store(payload) {
  try {
    const event = await Event.create({
      eventId: payload.eventId,
      type: payload.type,
      quoteRequestId: payload.quoteRequestId,
      actorId: payload.actorId,
      data: payload.data,
      occurredAt: payload.occurredAt,
    });

    return { event, created: true };
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR) {
      const event = await Event.findOne({ eventId: payload.eventId });

      return { event, created: false };
    }

    throw err;
  }
}

async function list({ quoteRequestId, type, page, perPage }) {
  const filter = {};

  if (quoteRequestId) {
    filter.quoteRequestId = quoteRequestId;
  }

  if (type) {
    filter.type = type;
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

module.exports = { store, list };
