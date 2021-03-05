import { MONGODB_URI,REDIS_PORT, REDIS_HOST, REDIS_PASSWORD   } from "../util/secrets";
import { User } from "../model/user";
import { uuid } from "../util/uuid";
import mongoose from "mongoose";
import bluebird from "bluebird";
import Redis from "ioredis";

const redis = new Redis.Cluster([REDIS_HOST, REDIS_PORT], {
  scaleReads: "all",
  slotsRefreshTimeout: 2000,
  redisOptions: {
    password: REDIS_PASSWORD,
  },
});

const mongoUrl = MONGODB_URI;

mongoose.Promise = bluebird;


mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(() => {
    const country = ["tr","en","fr","ru"];
    const query = User.collection.initializeUnorderedBulkOp();
    const pipeline = redis.pipeline();


    for (let index = 0; index <= 500000; index++) {
      const user = new User({
        _id: uuid(),
        display_name: "test-" + index,
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
      mongoose.disconnect();
    });

    pipeline.exec().then(res => {
      console.dir(res);
      process.exit(1);
    });
  }
).catch(err => {
  console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
  process.exit(0);
});

