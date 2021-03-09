# GJG Backend Coding Challenge

## General Information


Before starting the design of this system, I knew that I had little experience on the Client-Server systems but one of the most important challenges of this system is to design a system that gives response to users in a satisfied time, so in the backend side, I needed to manage all coming requests from the users and offload the network traffic to our server. To create a powerful system for big data, I need to choose the most proper database and use query optimization to get data from DB.  After I made some research about how to manage big data and choose the proper database, I found Redis DB that is an in-memory data structure store, used as a distributed, in-memory key–value database, cache and message broker, with optional durability. When I looked at the definition and usage of Redis, Redis, which stands for Remote Dictionary Server, is a fast, open-source, in-memory key-value data store for use as a database, cache, message broker, and queue. The project started when Salvatore Sanfilippo, the original developer of Redis, was trying to improve the scalability of his Italian startup. Redis now delivers sub-millisecond response times enabling millions of requests per second for real-time applications in Gaming, Ad-Tech, Financial Services, Healthcare, and IoT. Redis is a popular choice for caching, session management, gaming, leaderboards, real-time analytics, geospatial, ride-hailing, chat/messaging, media streaming, and pub/sub apps.

Then, I decided to use Redis DB. For the backup database to keep other information of users, I used MongoDB that is classified as a NoSQL database program and uses JSON-like documents with optional schemas. I chose the MongoDB (NoSQL database) because it has a flexible schema feature and all games need changes and new features. Therefore, developers can change their data layer just as quickly as change their game. MongoDB stores data as JSON-like documents and storing objects in the same structure makes our life easier. I have designed this case with these ideas.

In the Redis DB, I used the hash set to keep user information. For the Hash Set, I need the unique identifier to represent all users uniquely. To create a unique identifier, I used Timestamp, DOMHighResTimeStamp and a third-party library called nanoid. With concatenating all of them, a unique identifier of the user will be created. Even if any user creates a new account at the same time, with DOMHighResTimeStamp and nanoid, it is unlikely to create the same id. When any user creates a new account, his/her information will be stored in both RedisDB and MongoDB. In Redis DB, it stores in a hash set and the key will be “user:user_id” and value will be information of the user as field and value.


```bash
HGETALL user:8385048774012-6208863.728007-PWxQkRgWUCCrODPlPTwQq
```

```json
 1) "points"
 2) "100"
 3) "display_name"
 4) "furkan"
 5) "password"
 6) "$2b$10$2GKHXMyzV0gAYJ9CrdhmvODBHn35jB/43TzE8xJ5/qRCjHyGJ/4my"
 7) "country"
 8) "tr"
 9) "createdAt"
10) "Fri Mar 05 2021 13:33:45 GMT+0000 (Coordinated Universal Time)"
11) "updatedAt"
12) "Fri Mar 05 2021 13:33:45 GMT+0000 (Coordinated Universal Time)"
13) "_id"
14) "8385048774012-6208863.728007-PWxQkRgWUCCrODPlPTwQq"
```


And also, in two sorted set, one of them leaderboard and other one leaderboard-{country-code},
user_id and his/her updated points will be stored. For example, when any user from France(country code is “fr”) creates a new account,  in leaderboard and leaderboard-fr sorted sets ,his/her key will be id of user and value will be 0 (initial value). When any new score submission is done, his/her score will be updated in the both leaderboard set and alson points field in the hash set.

On the other side, in MongoDB, user information will be stored as a backup database and for login requests, it will be responsible. MongoDB uses the B-Tree index structure that is used by Mongo's query optimizer to quickly sort through and order the documents in a collection. When creating a User schema, I defined display_name field as a unique field..  With this property, MongoDB finds any user instance in a User collection with B-Tree instead of looking at all entries one by one.

## HOW TO RUN

# Install dependencies
  * Node
  * Redis
  * Mongo
  
# Environment Variables

```
NODE_ENV= development  | production | test
MONGODB_URI= Mongo Url for production
MONGODB_URI_LOCAL= Mongo Url for development
MONGODB_URI_TEST= Mongo Url for test
SESSION_SECRET= Session Secret Key

For production, you need to define redis credentials. In this case, Azure Redis Cache is used. For the local environment, you only need to start the redis server.
REDIS_PORT= Azure RedisCache Port
REDIS_HOST= Azure RedisCache Host
REDIS_PASSWORD= Azure RedisCache Password

```

