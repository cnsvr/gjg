import { ENVIRONMENT, MONGODB_URI } from "../util/secrets";
import { User } from "../model/user";
import { uuid } from "../util/uuid";
import mongoose from "mongoose";
import bluebird from "bluebird";
import { redis } from "./redis-client";
import logger from "../util/logger";
import bcrypt from "bcrypt";



const mongoUrl = MONGODB_URI;

// mongoose.Promise = bluebird;

if (process.argv[2] === undefined) {
  logger.info("Enter the number of users you want to create.");
  redis.disconnect();
} else {
  const numberOfUsers = Number(process.argv[2]);
  
  mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(async () => {

    logger.info(`Connected MongoDB successfully in ${ENVIRONMENT} mode`);
    const country = ["tr","en","fr","ru"];
    const query = User.collection.initializeUnorderedBulkOp();
    const pipeline = redis.pipeline();


    for (let index = 0; index < numberOfUsers; index++) {
      const user_id = uuid();
      const user = new User({
        _id: user_id,
        display_name: "test-" + user_id,
        password: "test",
        points: Math.floor(Math.random() * 10000),
        country: country[Math.floor(Math.random() * 4)]
      });      
      query.insert(user);
      pipeline.hmset("user:" + user._id,user.toJSON());
      pipeline.zadd("leaderboard",user.points, user._id);
      pipeline.zadd("leaderboard-" + user.country ,user.points, user._id);
    }

    query.execute((err, result) => {
      if (err) { console.dir(err); }
      console.dir(result);
      pipeline.exec().then(res => {
        console.dir(res);
      }).finally(() => {
        redis.disconnect();
        mongoose.connection.close();
      });
    });

    
  }).catch(err => {
    logger.error(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    process.exit(0);
  });
}

