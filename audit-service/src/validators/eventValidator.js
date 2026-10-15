const EVENT_TYPES = [
  'quote_request.created',
  'quote_request.status_changed',
  'quote_request.assigned',
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateEvent(body) {
  const errors = {};

  if (!isPlainObject(body)) {
    return { body: ['The request body must be a JSON object.'] };
  }

  if (typeof body.eventId !== 'string' || !UUID_PATTERN.test(body.eventId)) {
    errors.eventId = ['The eventId must be a valid UUID.'];
  }

  if (!EVENT_TYPES.includes(body.type)) {
    errors.type = [`The type must be one of: ${EVENT_TYPES.join(', ')}.`];
  }

  if (!isPositiveInteger(body.quoteRequestId)) {
    errors.quoteRequestId = ['The quoteRequestId must be a positive integer.'];
  }

  if (body.actorId !== null && !isPositiveInteger(body.actorId)) {
    errors.actorId = ['The actorId must be a positive integer or null.'];
  }

  if (!isPlainObject(body.data)) {
    errors.data = ['The data field must be an object.'];
  }

  if (typeof body.occurredAt !== 'string' || !ISO_DATE_PATTERN.test(body.occurredAt) || Number.isNaN(Date.parse(body.occurredAt))) {
    errors.occurredAt = ['The occurredAt must be an ISO 8601 date.'];
  }

  return errors;
}

function validateListQuery(query) {
  const errors = {};
  const filters = { page: 1, perPage: 20 };

  if (query.quoteRequestId !== undefined) {
    const value = Number(query.quoteRequestId);
    if (!isPositiveInteger(value)) {
      errors.quoteRequestId = ['The quoteRequestId must be a positive integer.'];
    }
    filters.quoteRequestId = value;
  }

  if (query.type !== undefined) {
    if (!EVENT_TYPES.includes(query.type)) {
      errors.type = [`The type must be one of: ${EVENT_TYPES.join(', ')}.`];
    }
    filters.type = query.type;
  }

  if (query.page !== undefined) {
    const value = Number(query.page);
    if (!isPositiveInteger(value)) {
      errors.page = ['The page must be a positive integer.'];
    }
    filters.page = value;
  }

  if (query.per_page !== undefined) {
    const value = Number(query.per_page);
    if (!isPositiveInteger(value) || value > 100) {
      errors.per_page = ['The per_page must be between 1 and 100.'];
    }
    filters.perPage = value;
  }

  return { filters, errors };
}

module.exports = { EVENT_TYPES, validateEvent, validateListQuery };
