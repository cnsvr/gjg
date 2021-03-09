import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { uuid } from "../util/uuid";
import { SESSION_SECRET } from "../util/secrets";
import { DataStoredInToken } from "../interfaces/user";



export type UserDocument = mongoose.Document & {
  _id: string;
  display_name: string;
  password: string;
  country: string;
  points: number;
  comparePassword: comparePasswordFunction;
  createToken: createTokenFunction;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: boolean) => void) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type createTokenFunction = () => any;

const userSchema = new mongoose.Schema<UserDocument>(
  {
    _id: { type: String },
    display_name: { type: String, unique: true },
    password: String,
    country: String,
    points: { type: Number, default: 0, index: true }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Password hash middleware.
 */

userSchema.pre("save", function save(next) {
  const user = this as UserDocument;
  user._id = uuid();  // GUID for user_id;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});


export const createToken: createTokenFunction = function () {
  const user = this as UserDocument;
  const expiresIn = 60 * 60; // an hour
  const dataStoredInToken: DataStoredInToken = {
    _id: user._id,
  };
  return {
    expiresIn,
    token: jwt.sign(dataStoredInToken, SESSION_SECRET, { expiresIn }),
  }; 
};

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  const user = this as UserDocument;
  bcrypt.compare(candidatePassword, user.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePassword = comparePassword;
userSchema.methods.createToken = createToken;




export const User = mongoose.model<UserDocument>("User", userSchema);