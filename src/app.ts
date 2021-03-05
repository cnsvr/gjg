import express, { Request, Response, NextFunction } from "express";
import process from "process";
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import  swaggerDocument from  "../swagger.json";


import { errorMiddleware } from "./middlewares/error";
import { authMiddleware } from "./middlewares/auth";

import * as userController from "./controllers/user";
import * as scoreController from "./controllers/score";
import * as leaderBoardController from "./controllers/leaderboard";




// Create Express server
const app = express();

// Express configuration
app.set("port", 8000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use("/api-docs", (req: Request, res: Response, next: NextFunction) => { 
  swaggerDocument.host = req.get("host");
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.post("/user/create", userController.postUserCreate);
app.post("/user/login", userController.postLogin);
app.post("/score/create", authMiddleware, scoreController.postScore);
app.get("/leaderboard", leaderBoardController.getLeaderBoard);
app.get("/leaderboard/:country_iso_code", leaderBoardController.getLeaderBoardWithCountryCode);
app.get("/user/profile/:user_guid", userController.getUserProfile);

app.use(errorMiddleware);

export default app;