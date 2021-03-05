import bluebird from "bluebird";
import mongoose from "mongoose";
import { MONGODB_URI, ENVIRONMENT } from "../util/secrets";
import logger from "../util/logger";

const mongoUrl = MONGODB_URI;

mongoose.Promise = bluebird;


const mongoConnection = async (): Promise<void> => {
  mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false }).then(
    () => {
    logger.info(`Connected MongoDB successfully in ${ENVIRONMENT} mode`);
    } 
  ).catch(err => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    process.exit(0);
  });
};

export {
  mongoConnection,
  mongoose
};