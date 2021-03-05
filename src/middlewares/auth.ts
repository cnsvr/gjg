import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Response } from "express";
import { SESSION_SECRET } from "../util/secrets";
import { HttpException } from "../exceptions/http";
import { User } from "../model/user";
import { RequestWithUser, DataStoredInToken } from "../interfaces/user";


/**
 * Middleware for authentication
 * @param req request body
 * @param next express middleware 
 */

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function authMiddleware(request: RequestWithUser, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const verificationResponse = jwt.verify(token, SESSION_SECRET) as DataStoredInToken;
      const id = verificationResponse._id;
      const user = await User.findById(id);
      if (user) {
        request.user = user;
        next();
      } else {
        next(new HttpException(StatusCodes.NOT_FOUND, "User not found"));
      }
    } catch (error) {
      next(new HttpException(StatusCodes.FORBIDDEN, "Authentication failed"));
    }
  } else {
    next(new HttpException(StatusCodes.BAD_REQUEST, "Token not found"));
  }
}