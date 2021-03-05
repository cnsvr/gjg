import jwt from "jsonwebtoken";
import request from "supertest";
import server from "../../src/app";
import { uuid } from "../../src/util/uuid";
import { User } from "../../src/model/user";
import { Score } from "../../src/model/score";
import * as redisClient  from "../../src/db/redis-client";


describe("POST /score/create", () => {

  const user_id = uuid();

  User.findById = jest.fn().mockReturnValue(Promise.resolve({
    id: user_id,
    display_name: "simple_user",
    country: "tr"
  }));
  jwt.verify = jest.fn().mockReturnValueOnce({
    _id: user_id,
  });
  Score.prototype.save = jest.fn().mockImplementationOnce(cb => cb(undefined, {
    _id: uuid(),
    user_id: user_id,
    score_worth: 100
  }));

  jest.spyOn(redisClient,"addScoreToMember").mockReturnValue(Promise.resolve("1"));
  jest.spyOn(redisClient,"setPoints").mockReturnValue(Promise.resolve(1));

  User.findOneAndUpdate = jest.fn().mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValueOnce("done")} ));
  

  it("user should create score successfully", async (done) => {
    const score = {
      score_worth: 100
    };
    request(server)
      .post("/score/create")
      .set("Authorization","Bearer "+ "fake_token") // By pass the authorization
      .send(score)
      .expect(201)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body.score_worth).toBe(100);
        expect(response.body.user_id).toBe(user_id);
        done();
      });
  });
  

  it("user should not create score with wrong request body", async (done) => {

    User.findById = jest.fn().mockReturnValue(Promise.resolve({
      id: user_id,
      display_name: "simple_user",
      country: "tr"
    }));
    jwt.verify = jest.fn().mockReturnValueOnce({
      _id: user_id,
    });

    const score = {
      score_worth: "wrong_value"
    };
    request(server)
      .post("/score/create")
      .set("Authorization", "Bearer " + "fake_token")
      .send(score)
      .expect(400)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "You must the enter score as numeric." });
        done();
      });
  });

  it("user should not create score without authorization token", async (done) => {
    const score = {
      score_worth: 100
    };
    request(server)
      .post("/score/create")
      .send(score)
      .expect(400)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Token not found" });
        done();
      });
  });
  it("user should not create score without missing or wrong authorization token", async (done) => {
    const score = {
      score_worth: 100
    };
    request(server)
      .post("/score/create")
      .set("Authorization","Bearer ")
      .send(score)
      .expect(403)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Authentication failed" });
        done();
      });
  });
  
});