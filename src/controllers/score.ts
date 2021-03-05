import { StatusCodes } from "http-status-codes";
import { Response, NextFunction } from "express";
import { check, ValidationError, validationResult } from "express-validator";
import { Score } from "../model/score";
import { HttpException } from "../exceptions/http";
import { User } from "../model/user";
import { RequestWithUser } from "../interfaces/user";
import { setPoints, addScoreToMember } from "../db/redis-client";


/**
 * Sets the new score of user.
 * @route POST /score/create
 * @param req request body
 * @param res response body
 * @param next express middleware
 */

export const postScore = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  await check("score_worth", "You must the enter score as numeric.").isNumeric().run(req);
  const errors = validationResult(req);
   
  if(!errors.isEmpty()) {
    const error: ValidationError = errors.array({ onlyFirstError: true })[0];
    return next(new HttpException(StatusCodes.BAD_REQUEST, error.msg, error.param));
  }

  const score = new Score({
    score_worth: req.body.score_worth,
    user_id: req.user._id
  });

  score.save(async (err, score) => {
    /* istanbul ignore next */
    if (err) { return next(new HttpException(StatusCodes.BAD_REQUEST, err.message)); }

    // Add score to REDIS DB.
    await addScoreToMember(req.user._id, score.score_worth, req.user.country); // Sorted Set
    await setPoints(req.user._id, score.score_worth);  // Hashed Set.
    
    // Add score to user's points
    User.findOneAndUpdate({ _id: req.user._id }, { $inc: { "points": score.score_worth  } }).exec(); // MongoDB acts like backup db.

    res.status(201)
      .send(
        score,
      );
  });
 };