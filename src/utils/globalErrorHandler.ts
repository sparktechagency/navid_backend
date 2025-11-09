import { NextFunction, Request, Response } from "express";
export class CustomError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleDevError = (res: Response, error: any): void => {
  res.status(error.statusCode).send({
    success: false,
    message: error.message,
    error: error,
  });
};

const handleCastError = (err: any): CustomError => {
  const message = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(message, 400);
};

// Duplicate key error handler
// const handleDuplicateKeyError = (err: any, model: string): CustomError => {
//     let message = "";
//     Object.keys(err?.keyValue)?.forEach(key => {
//         message += `${message ? `${message} & ` : ''}There is already a ${model} with ${key} "${err?.keyValue[key]}". Please use another ${key}!`;
//     });
//     return new CustomError(message, 400);
// };

const handleDuplicateKeyError = (err: any, model: any) => {
  let message = "";

  // Check for primary duplicate key error (err.keyValue)
  if (err?.keyValue) {
    Object.keys(err.keyValue)?.forEach((key, i) => {
      message += `${i != 0 ? " & " : ""}${key}`;
    });
    message += " shoule be uniqe"
  }

  // Check for writeErrors in bulk operations
  if (err?.writeErrors && Array.isArray(err.writeErrors)) {
    err.writeErrors.forEach((writeError: any) => {
      message = writeError?.err?.errmsg;
    });
  }

  if (!message) {
    // Default message if no keys are found
    message = `A duplicate key error occurred in the ${model} collection. Please check your input and try again.`;
  }

  return new CustomError(message, 400);
};

// Validation error handler
const handleValidationError = (err: any): CustomError => {
  const errors = Object.values(err.errors).map((val: any) => val.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new CustomError(message, 400);
};

const handleProdError = (res: Response, error: any): void => {
  if (error.isOperational) {
    res.status(error.statusCode).send({
      success: false,
      message: error.message,
    });
  } else {
    console.error("ERROR 💥:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Something went wrong! Please try again later.",
    });
  }
};

// const handleUnknownError = (res: Response, error: any): void => {
//     res.status(error.statusCode).send({
//         success: false,
//         message: error.message
//     });

// };

const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
  model?: string,
): void => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  // console.log("this a error  ", error);
  if (process.env.NODE_ENV === "development") {
    if (error.name === "CastError") error = handleCastError(error);
    if (error.code === 11000)
      error = handleDuplicateKeyError(error, model || "Resource");
    if (error.name === "ValidationError") error = handleValidationError(error);
    handleDevError(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = handleCastError(error);
    if (error.code === 11000)
      error = handleDuplicateKeyError(error, model || "Resource");
    if (error.name === "ValidationError") error = handleValidationError(error);
    handleProdError(res, error);
  }
};

export default globalErrorHandler;
