import app from "./app";
import errorHandler from "errorhandler";
import { mongoConnection } from "./db/mongo-db";
import logger from "./util/logger";
import morgan from "morgan";

if (process.env.NODE_ENV === "development") {
  app.use(errorHandler());
  app.use(morgan("dev"));
}

if (process.env.NODE_ENV !== "test") {
  mongoConnection();
  console.log("mongo");
}


const server = app.listen(app.get("port"), () => {
  logger.info(
    `App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`
  );
  logger.info("Press CTRL-C to stop");
});

export default server;