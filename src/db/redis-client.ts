import  Redis  from "ioredis";
import logger from "../util/logger";
import { UserResponse } from "../interfaces/user";
import { LeaderBoardResponse } from "../interfaces/leaderboard";
import { ENVIRONMENT, REDIS_URL } from "../util/secrets";

const redis = new Redis(REDIS_URL);

redis.on("connect", () => {
  logger.info(`Connected to RedisDB successfully in ${ENVIRONMENT} mode`);
});

redis.on("close", () => {
  logger.info("Redis DB connection closed.");
});

redis.on("error", async (err: Error) => {
  logger.error(err.message);
  logger.info("Redis DB connection failed");
  await redis.disconnect();
});

if (ENVIRONMENT === "test") {
  redis.disconnect();
}


const key = "leaderboard";

/**
 * Sets the user in country leaderboard hashed set in REDIS DB.
 * Complexity -> O(log(N)) for each item added, where N is the number of elements in the sorted set.
 * @param id uuid of user
 * @param score score of user (Initial value is 0)
 */

const addMemberToLeaderBoard = async (id: string,score: number): Promise<string | number> => {
  const response = await redis.zadd(key, score, id);
  return response;
};

/**
 * Sets the user in country leaderboard hashed set in REDIS DB.
 * Complexity -> O(log(N)) for each item added, where N is the number of elements in the sorted set.
 * @param id uuid of user
 * @param country country of user
 * @param score score of user (Initial value is 0)
 */
const addMemberToCountryLeaderBoard = async (id: string, country: string, score: number): Promise<string | number> => {
  const response = await redis.zadd(key + "-" + country, score, id);
  return response;
  
};

/**
 * Updates points of user in REDIS DB sorted set. O
 * Complexity -> O(log(N)) where N is the number of elements in the sorted set.
 * @param id uuid of user
 * @param score new points of user
 */
const addScoreToMember = async (id: string, points: number, country: string): Promise<string> => {
  const globalResponse = await redis.zincrby(key, points, id);
  const counrtyResponse = await redis.zincrby(key + "-" + country, points, id);
  
  return globalResponse || counrtyResponse;
};


/**
 * Gets the current points of user and updates points of user by adding new points to current points in REDIS DB hash set.
 * Complexity -> O(1)
 * @param id uuid of user
 * @param points new points of user
 * @param country country of user
 */
const setPoints = async (id: string, points: number): Promise<number> => {
  
  const currentPoints = await redis.hget("user:" + id, "points");  // --> O(1)
  const updatedPoints = Number(currentPoints) + points;

  // Set
  const response =  await redis.hset("user:" + id, "points", updatedPoints);  // --> O(1)

  return response;
};

/**
 * Finds the users in REDIS DB.
 * Complexity -> O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. 
 *                If M is constant (e.g. always asking for the first 10 elements with LIMIT), 
 *                you can consider it O(log(N)).
 *                M is constant, so it is O(log(N)).
 * 
 * @param limit number of user
 * @param skip number of user skipped
 */

const getUserIds = async (limit: number, skip: number): Promise<string[]> => {
  /**
   * Gets users' ids with given parameters from highest to lowest score. It is thought as pagination structure.
   */
  const response = await redis.zrevrangebyscore(key , "+inf", "-inf", "LIMIT", skip, limit); 
  return response;
};

/**
 * Finds the users of given country code in REDIS DB.
 * Complexity -> O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. 
 *                If M is constant (e.g. always asking for the first 10 elements with LIMIT), 
 *                you can consider it O(log(N)).
 *                M is constant, so it is O(log(N)).
 * 
 * @param limit number of user
 * @param skip number of user skipped
 * @param country country of users.
 */
const getUserIdsWithCountryCode = async (limit: number, skip: number, country: string): Promise<string[]> => {
  /**
   * Gets users' ids with given parameters from highest to lowest score. It is thought as pagination structure.
   */
  const response = await redis.zrevrangebyscore(key + "-" + country, "+inf", "-inf", "LIMIT", skip, limit);  

  return response;
};


/**
 * Sets the user in hashed set with given parameters.
 * Complexity -> O(N) -> 8 fields -> O(8) --> It is constant.
 * @param id uuid of user
 * @param keys field key and values of user
 */
const setUser = async (id: string, keys: Map<string, Redis.ValueType> | Redis.ValueType[] | {
  [key: string]: Redis.ValueType }): Promise<"OK"> => {
  const response = await redis.hmset("user:" + id, keys); // User information in hash set. O(N) where N is the number of fields being set.
  return response;
};


/**
 * Finds the user in REDIS db with given id and returns user as UserResponse object.
 * Complexity -> O(logN) + O(8) -> O(logN)
 * @param id uuid of user.
 */
const getUser = async (id: string): Promise<UserResponse> => {
  const userData = await redis.hgetall("user:" + id);  //  User information in hash set. O(N) N is the size of the hash. O(8) -> 8 fields -> it is constant.
  const rank = await redis.zrevrank(key, id);          //  User global rank in sorted set. O(logN)  where N is the number of elements in the sorted set
  
  const user: UserResponse = {
    user_id: userData._id,
    display_name: userData.display_name,
    points: Number(userData.points),
    rank: rank + 1,
  };
  return user;
};

/**
 * Finds the user in REDIS db with given id and returns user as LeaderBoard object.
 * Complexity -> O(logN) + O(8) -> O(logN)
 * @param id uuid of user.
 */
const getUserLeaderBoard = async (id: string): Promise<LeaderBoardResponse> => {
  const userData = await redis.hgetall("user:" + id);  //  User information in hash set. O(N) N is the size of the hash. O(8) -> 8 fields -> it is constant.
  const rank = await redis.zrevrank(key, id);          //  User rank in sorted set. O(logN)  where N is the number of elements in the sorted set
  
  const user: LeaderBoardResponse = {
    rank: rank + 1,
    points: Number(userData.points),
    display_name: userData.display_name,
    country: userData.country,
  };
  return user;
};



export {
  addMemberToLeaderBoard,
  addMemberToCountryLeaderBoard,
  addScoreToMember,
  setPoints,
  getUserIdsWithCountryCode,
  getUserIds,
  setUser,
  getUser,
  getUserLeaderBoard,
  redis,
};