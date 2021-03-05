import request from "supertest";
import { uuid } from "../../src/util/uuid";
import server from "../../src/app";
import { User } from "../../src/model/user";
import * as redisClient  from "../../src/db/redis-client";


beforeAll(async (done) => {
  // Create 100 different user

  const country = ["tr","en","fr","ru"];
  const listOfIds: string[] = [];
  const listOfUsers: any = {};
  for (let index = 0; index < 100; index++) {
    const user = new User({
        _id: uuid(),
        display_name: "new_user_" + index,
        password: "test",
        points: Math.floor(Math.random() * 10000),
        country: country[Math.floor(Math.random() * 4)]
    });
    listOfUsers[user._id] = user;
    listOfIds.push(user._id);
   
  }
  jest.spyOn(redisClient, "getUserIds").mockImplementation(async (limit,skip) => {
    return listOfIds.slice(skip, skip + limit);
  });

  jest.spyOn(redisClient, "getUserIdsWithCountryCode").mockImplementation(async (limit,skip,country) => {
    return listOfIds.filter(userId => listOfUsers[userId].country === country).slice(skip, skip + limit);
  });
  jest.spyOn(redisClient, "getUserLeaderBoard").mockImplementation(async (id: string) => {
    return {
      rank: Math.floor(Math.random() * 50),
      points: listOfUsers[id].points,
      display_name: listOfUsers[id].display_name,
      country: listOfUsers[id].country,
    };
  });
  done();
});

describe("GET /leaderboard", () => {
  
  it("user should get leader board", async (done) => {
    request(server)
      .get("/leaderboard?limit=10&skip=0")
      .expect(200)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body.length).toBe(10);
        done();
      });
  });

  it("user should not get leader board without limit and skip parameter", async (done) => {
    request(server)
      .get("/leaderboard")
      .expect(400)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Please enter limit and skip values as parameters in the URL" });
        done();
      });
  });
});

describe("GET /leaderboard/:country_iso_code", () => {
  
  
  it("user should get leader board", async (done) => {
    const country = "tr";
    request(server)
      .get(`/leaderboard/${country}?limit=10&skip=0`)
      .expect(200)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body.length).toBe(10);
        done();
      });
  });

  it("user should not get leader board without limit and skip parameter", async (done) => {
    const country = "en";
    request(server)
      .get(`/leaderboard/${country}`)
      .expect(400)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Please enter limit and skip values as parameters in the URL" });
        done();
      });
  });
});