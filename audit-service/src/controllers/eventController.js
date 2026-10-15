const eventService = require('../services/eventService');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { validateEvent, validateListQuery } = require('../validators/eventValidator');

async function store(req, res) {
  const errors = validateEvent(req.body);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(422, 'The given data was invalid.', errors);
  }

  const { event, created } = await eventService.store(req.body);

  if (!created) {
    return success(res, 'Event already recorded.', { event });
  }

  return success(res, 'Event recorded successfully.', { event }, 201);
}

async function index(req, res) {
  const { filters, errors } = validateListQuery(req.query);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(422, 'The given data was invalid.', errors);
  }

  const result = await eventService.list(filters);

  return success(res, 'Events retrieved successfully.', result);
}

module.exports = { store, index };
