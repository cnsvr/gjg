import { Request, Response, NextFunction } from "express";
import { HttpException } from "../exceptions/http";

/**
 * Middleware for error
 * @param error error exception body 
 * @param req request body
 * @param response response body 
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const errorMiddleware = (error: HttpException, request: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong";
  const param = error.param ? error.param : "";
  res.status(status)
    .send({
      status,
      message,
      param
    });
  next();
};