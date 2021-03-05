import { Request } from "express";
import { UserDocument } from "../model/user";

export interface UserResponse {
  user_id: string
  display_name: string
  points: number
  rank: number
}

export interface DataStoredInToken {
  _id: string;
}

export interface LogInData {
  display_name: string;
  password: string;
}

export interface RequestWithUser extends Request {
  user: UserDocument;
}