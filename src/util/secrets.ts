import fs from "fs";
import dotenv from "dotenv";
import logger from "./logger";
import process from "process";


if(fs.existsSync(".env")) {
  logger.debug("Using .env file to supply config environment variables");
  dotenv.config({ path: ".env" });
} else {
  logger.debug("Using .env.example file to supply config environment variables");
  dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}

export const ENVIRONMENT = process.env.NODE_ENV;
export const REDIS_URL = process.env["REDIS_URL"];
const prod = ENVIRONMENT === "production";
const development = ENVIRONMENT === "development";
const test = ENVIRONMENT === "test";

export const SESSION_SECRET = process.env["SESSION_SECRET"];

export const REDIS_PORT = process.env["REDIS_PORT"];
export const REDIS_HOST = process.env["REDIS_HOST"];
export const REDIS_PASSWORD = process.env["REDIS_PASSWORD"];

export const MONGODB_URI = prod ? process.env["MONGODB_URI"] : test ? process.env["MONGODB_URI_TEST"] : process.env["MONGODB_URI_LOCAL"];

if (!SESSION_SECRET) {
  logger.error("No client secret. Set SESSION_SECRET environment variable.");
  process.exit(1);
}

if (!MONGODB_URI) {
  if (prod) {
      logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
  } else if (development) {
      logger.error("No mongo connection string. Set MONGODB_URI_LOCAL environment variable.");
  }
  process.exit(1);
}

