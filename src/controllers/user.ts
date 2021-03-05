import { NativeError } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import { check, ValidationError, validationResult } from "express-validator";
import { HttpException } from "../exceptions/http";
import { LogInData } from "../interfaces/user";
import { User, UserDocument } from "../model/user";
import { addMemberToCountryLeaderBoard, addMemberToLeaderBoard, setUser, getUser} from "../db/redis-client";




/**
 * Creates a new user account.
 * @route POST /user/create
 * @param req request body
 * @param res response body
 * @param next express middleware
 */
export const postUserCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("display_name", "Display name must be at least 2 characters long").isLength({ min: 2 }).trim().run(req);
  await check("country", "You must enter the country code").isLength({ min: 2 }).trim().run(req);
  await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
  await check("confirmPassword", "Passwords do not match").equals(req.body.password).run(req);
  
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    const error: ValidationError = errors.array({ onlyFirstError: true })[0];
    return next(new HttpException(StatusCodes.BAD_REQUEST, error.msg, error.param));
  }

  const newUser = new User({
    display_name: req.body.display_name,
    password: req.body.password,
    country: req.body.country, 
  });

  User.findOne({ display_name: req.body.display_name }, (err: NativeError, existingUser: UserDocument) => {
    /* istanbul ignore next */
    if (err) { return next(new HttpException(StatusCodes.BAD_REQUEST, err.message)); }
    if (existingUser) { 
      return next(new HttpException(StatusCodes.CONFLICT, "Account with that display name already exists."));
    }

    newUser.save(async (err: NativeError, doc: UserDocument) => {
      /* istanbul ignore next */
      if (err) { return next(new HttpException(StatusCodes.BAD_REQUEST, err.message)); }

      await setUser(doc._id, doc.toJSON()); // Hashed Set.
      await addMemberToLeaderBoard(doc._id, 0); // add global leaderboard -> Sorted Set
      await addMemberToCountryLeaderBoard(doc._id, doc.country, 0); // add country leaderboard -> Sorted Set.
      const user = await getUser(doc._id);
      
      res.status(201)
        .send({
          user
        });
    });
  });
};


/**
 * Sign in using display_name and password.
 * @route POST /user/login
 * @param req request body
 * @param res response body
 * @param next express middleware
 */

export const postLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("display_name", "display_name can not be empty").isLength({ min: 1 }).run(req);
  await check("password", "Password can not be empty").isLength({ min: 4 }).run(req);

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    const error: ValidationError = errors.array({ onlyFirstError: true })[0];
    return next(new HttpException(StatusCodes.BAD_REQUEST, error.msg, error.param));
  }

  const logInData: LogInData = req.body;
  const userData: UserDocument = await User.findOne({ display_name: logInData.display_name });

  if (!userData) { return next(new HttpException(StatusCodes.NOT_FOUND, "User not found.")); }
  /* istanbul ignore next */
  userData.comparePassword(logInData.password, async (err, isMatch) => {
    if (err) { return next(new HttpException(StatusCodes.BAD_REQUEST, err.message));}
    if (isMatch) {
      const token = userData.createToken();
      const user = await getUser(userData._id);

      res.status(200).send({
         result: {
          user,
          token
         },
      });
    }else {
      next(new HttpException(StatusCodes.BAD_REQUEST, "Wrong credentials"));
    }
  });
};


/**
 * Gets the user with given user_guid
 * @route GET /user/profile/:user_guid
 * @param req request body
 * @param res response body
 * @param next express middleware
 */

 export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user_id = req.params.user_guid;
  const user = await getUser(user_id);

  if (!user.user_id) { return next(new HttpException(StatusCodes.NOT_FOUND, "User not found.")); }
    
  res.status(200).send(user);
  next();
 };