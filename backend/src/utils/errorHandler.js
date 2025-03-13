class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class CacheError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = "CacheError";
  }
}

export class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = "DatabaseError";
  }
}

export class RateLimitError extends AppError {
  constructor(message) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${errors.join(". ")}`, 400);
};

export default AppError;
