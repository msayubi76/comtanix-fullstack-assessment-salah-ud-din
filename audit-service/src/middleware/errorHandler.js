const ApiError = require('../utils/ApiError');
const { error } = require('../utils/apiResponse');

function notFound(req, res) {
  return error(res, 'Resource not found.', 404);
}

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return error(res, err.message, err.statusCode, err.errors);
  }

  if (err.type === 'entity.parse.failed') {
    return error(res, 'Malformed JSON body.', 400);
  }

  if (err.type === 'entity.too.large') {
    return error(res, 'Request body is too large.', 413);
  }

  console.error(err);

  return error(res, 'Server error.', 500);
}

module.exports = { notFound, errorHandler };
