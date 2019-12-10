const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const objectId = require("mongodb").ObjectID;
const cors = require("cors");

const app = express();
const jsonParser = express.json();

// const port = process.env.PORT || 3000;

const http = require("http");
const port = 3000;

const mongoClient = new MongoClient(
  "mongodb+srv://atlas:antantayarik322@users1-5hw5p.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

let dbClient;

app.use(cors());
app.use(express.static(__dirname + "/public"));

const requestHandler = (request, response) => {
  console.log(request.url);
  response.end("Hello Node.js Server!");
};
const server = http.createServer(requestHandler);
server.listen(port, err => {
  if (err) {
    return console.log("something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
  mongoClient.connect((err, client) => {
    if (err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("users1").collection("users");
    app.listen(3000, () => {
      console.log("-----------Success connecting to the server!-----------");
    });
  });
});

app.get("/users", (req, res) => {
  let newObj = [];
  const collection = req.app.locals.collection;
  collection.find({}).toArray((err, users) => {
    if (err) return console.log(err);
    users.map(value => {
      newObj.push(Object.values(value)[1]);
    });
    console.log(newObj);
    res.send(newObj);
  });
});

app.post("/users", jsonParser, (req, res) => {
  if (!req.body) return res.sendStatus(400);
  const login = req.body.login;
  const pass = req.body.pass;
  const db = req.app.locals.collection;
  db.find({})
    .sort({ _id: 1 })
    .toArray((err, result) => {
      result.map(value => {
        if (
          Object.values(value)[1] == login &&
          Object.values(value)[2] == pass
        ) {
          res.send(result);
          console.log(login + " sign in");
        }
      });
    });
});

app.post("/new", jsonParser, (req, res) => {
  if (!req.body) return res.sendStatus(400);
  let usersCount =
    parseInt(fs.readFileSync("./src/assets/count.txt", "utf8")) + 1;
  const db = req.app.locals.collection;
  let myobj = {
    _id: usersCount,
    login: req.body.login,
    pass: req.body.pass,
    email: req.body.email
  };

  db.findOne({ login: req.body.login }, (err, resLog) => {
    if (resLog == null) {
      db.findOne({ email: req.body.email }, (err, resEmail) => {
        if (resEmail == null) {
          db.insertOne(myobj, () => {
            console.log("New user register: " + req.body.login);
            res.sendStatus(200);
          });
          fs.writeFileSync("./src/assets/count.txt", usersCount);
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(403);
    }
  });
});

process.on("SIGINT", () => {
  dbClient.close();
  process.exit();
});
