export function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Endpoint not found' });
}

export function errorHandler(err, req, res, _next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details (always log to stderr)
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  // Return safe error message to client
  res.status(err.status || 500).json({
    error: isProduction
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred',
  });
}
