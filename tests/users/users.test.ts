import { User, createToken } from "../../src/model/user";
import request from "supertest";
import server from "../../src/app";
import { uuid } from "../../src/util/uuid";
import * as redisClient  from "../../src/db/redis-client";


describe("POST /user/create", () => {

  it("user should register successfully", (done) => {
    // Mock
    const user_id = uuid();
    User.findOne = jest.fn().mockImplementationOnce((err, cb) => cb(undefined, undefined));
    User.prototype.save = jest.fn().mockImplementationOnce(cb => cb(undefined, 
      {
        _id: user_id,
        display_name: "simple_user",
        password: "simple_password",
        country: "tr",
        points: 0,
        toJSON: () => JSON.stringify(null),
      }
    ));

    jest.spyOn(redisClient,"setUser").mockReturnValue(Promise.resolve("OK"));
    jest.spyOn(redisClient,"addMemberToLeaderBoard").mockReturnValue(Promise.resolve("1"));
    jest.spyOn(redisClient,"addMemberToCountryLeaderBoard").mockReturnValue(Promise.resolve("1"));


    jest.spyOn(redisClient,"getUser").mockReturnValue(Promise.resolve({
      user_id: user_id,
      display_name: "simple_user",
      points: 0,
      rank: 1,
    }));
     

    const user = {
      display_name: "simple_user",
      password: "simple_password",
      confirmPassword: "simple_password",
      country: "tr"
    };

    request(server)
      .post("/user/create")
      .send(user)
      .expect(201)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body.user.display_name).toBe("simple_user");
        done();
      });   
  });
  
  
  it("user should not register with existing display_name", (done) => {

    // Mock
    User.findOne = jest.fn().mockImplementationOnce((err, cb) => cb(undefined, {
      display_name: "simple_user"
    }));

    const user = {
      display_name: "simple_user",
      password: "simple_password",
      confirmPassword: "simple_password",
      country: "tr"
    };

    request(server)
      .post("/user/create")
      .send(user)
      .expect(409)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Account with that display name already exists." });
        done();
      });  
  });
  
  it("user should not register with wrong request body - country is missing ", (done) => {
    const user = {
      display_name: "test",
      password: "test",
      confirmPassword: "test",
    };
    request(server)
      .post("/user/create")
      .send(user)
      .expect(400)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "You must enter the country code" });
        done();
      });  
  });
  
  
});


describe("POST /user/login", () => {
  

  it("user should login successfully", (done) => {
    
    // Mock
    const user_id = uuid();
    User.findOne = jest.fn().mockReturnValue(Promise.resolve({
      _id: user_id,
      display_name: "simple_user",
      password: "simple_password",
      country: "tr",
      points: 0,
      comparePassword: (candidatePassword: string, cb: (err: any, isMatch: boolean) => void) => cb(undefined, true),
      createToken: createToken,
    }));

    jest.spyOn(redisClient,"getUser").mockReturnValue(Promise.resolve({
      user_id: user_id,
      display_name: "simple_user",
      points: 0,
      rank: 1,
    }));


    const user = {
      display_name: "simple_user",
      password: "simple_password",
    };
    request(server)
      .post("/user/login")
      .send(user)
      .expect(200)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body.result.user.display_name).toBe("simple_user");
        expect(response.body.result.user.points).toBe(0);
        expect(response.body.result.user.rank).toBe(1);
        done();
      });  
  });

  it("user should not login in with wrong request body - empty password", (done) => {
    const user = {
      display_name: "simple_user",
      password: "",
    };
    request(server)
      .post("/user/login")
      .send(user)
      .expect(400)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Password can not be empty" });
        done();
      });  
  });

  it("user should not login in with non-existing user", (done) => {
        
    // Mock
    User.findOne = jest.fn().mockReturnValue(undefined);
    const user = {
      display_name: "nonexisting_user",
      password: "12345",
    };
    request(server)
      .post("/user/login")
      .send(user)
      .expect(404)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "User not found." });
        done();
      });  
  });
  
  it("user should not login in with wrong credentials - wrong password", (done) => {

    // Mock
    const user_id = uuid();
    User.findOne = jest.fn().mockReturnValue(Promise.resolve({
      _id: user_id,
      display_name: "simple_user",
      password: "simple_password",
      country: "tr",
      points: 0,
      comparePassword: (candidatePassword: string, cb: (err: any, isMatch: boolean) => void) => cb(undefined, false),
      createToken: createToken,
    }));
    const user = {
      display_name: "simple_user",
      password: "12345",
    };
    request(server)
      .post("/user/login")
      .send(user)
      .expect(400)
      .end((err,response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "Wrong credentials" });
        done();
      });  
  });
});



describe("GET /user/profile/:user_guid", () => {
  it("should get profile of user with user_guid", (done) => {
    
    const user_guid = uuid();
    jest.spyOn(redisClient,"getUser").mockReturnValue(Promise.resolve({
      user_id: user_guid,
      display_name: "simple_user",
      points: 100,
      rank: 1,
    }));

    request(server)
      .get(`/user/profile/${user_guid}`)
      .expect(200)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body.user_id).toBe(user_guid);
        expect(response.body.display_name).toBe("simple_user");
        done();
      });
  });

  it("should not get profile of user with nonexisting user_guid", (done) => {

    jest.spyOn(redisClient,"getUser").mockReturnValue(Promise.resolve({
      user_id: "",
      display_name: "",
      points: 0,
      rank: 0,
    }));
    
    const user_guid = uuid();
    
    request(server)
      .get(`/user/profile/${user_guid}`)
      .expect(404)
      .end((err, response) => {
        if (err) return done(err);
        expect(response.body).toMatchObject({ "message": "User not found." });
        done();
      });
  }); 
});