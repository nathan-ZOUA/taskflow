export function notFound(request, response, next) {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`)
  error.statusCode = 404
  next(error)
}
