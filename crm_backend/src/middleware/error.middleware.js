const errorMiddleware = (err, req, res, next) => {
  // Multer's own errors (file too large, too many files, ...) carry a `code`
  // but no `statusCode` — without this they'd surface as an opaque 500.
  const isMulterError = err.name === "MulterError";
  const status = err.statusCode || (isMulterError ? 400 : 500);
  const message = err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    statusCode: status,
    message,
    // Optionally include stack trace (for development only)
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorMiddleware;
