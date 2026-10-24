export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = (isProd && statusCode === 500)
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProd ? {} : { stack: err.stack })
  });
};
