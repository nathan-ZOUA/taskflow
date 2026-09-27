export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error)
  }

  const statusCode =
    error.statusCode || error.status || (error.type === 'entity.parse.failed' ? 400 : 500)
  const message = statusCode >= 500 ? 'An unexpected server error occurred.' : error.message

  if (statusCode >= 500) {
    console.error(error)
  }

  response.status(statusCode).json({
    error: {
      message,
    },
  })
}
