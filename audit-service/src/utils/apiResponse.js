function success(res, message, data = {}, code = 200) {
  return res.status(code).json({
    status: true,
    code,
    message,
    ...data,
  });
}

function error(res, message, code, errors) {
  const body = {
    status: false,
    code,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(code).json(body);
}

module.exports = { success, error };
