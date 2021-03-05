import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { HttpException } from "../exceptions/http";
import { LeaderBoardResponse } from "../interfaces/leaderboard";
import { getUserIds, getUserLeaderBoard, getUserIdsWithCountryCode } from "../db/redis-client";

/**
 * Gets the leader board with the ranking.
 * @router /leaderboard
 * @param req request body
 * @param res response body
 * @param next express middleware
 */

export const getLeaderBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  
  const  { limit, skip }  = req.query;
  
  if (limit && skip) {
    const response = await getUserIds(Number(limit) ,Number(skip));
    const result: LeaderBoardResponse[] = [];

    await Promise.all(response.map(async(user_id: string) => {
      const user: LeaderBoardResponse = await getUserLeaderBoard(user_id);
      result.push(user);
    }));
    
    res.status(200).send(result);
    next();
  } else {
    next(new HttpException(StatusCodes.BAD_REQUEST, "Please enter limit and skip values as parameters in the URL"));
  }
  
};

/**
 * Gets the leader board of given country with the ranking.
 * @router /leaderboard/:country_iso_code
 * @param req request body
 * @param res response body
 * @param next express middleware 
 */

export const getLeaderBoardWithCountryCode = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
  
  const  { limit, skip }  = req.query;

  const { country_iso_code } = req.params;
  
  if (limit && skip) {
    const response = await getUserIdsWithCountryCode(Number(limit),Number(skip),country_iso_code);
    const result: LeaderBoardResponse[] = [];

    await Promise.all(response.map(async(user_id: string) => {
      const user: LeaderBoardResponse = await getUserLeaderBoard(user_id);
      result.push(user); 
    }));
    
    res.status(200).send(result);
    next();
  } else {
    next(new HttpException(StatusCodes.BAD_REQUEST, "Please enter limit and skip values as parameters in the URL"));
  }
};