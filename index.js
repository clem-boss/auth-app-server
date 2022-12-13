const express = require('express')
const yaml = require('js-yaml');
const fs   = require('fs');
const { MongoClient } = require('mongodb');
var cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
process.env.ACCESS_TOKEN_SECRET;

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1800s' });
}

class Connection {
  constructor() {
    this.username = '';
    this.password = '';
  }
}

function initMongoConnection (username, password) {
  Connection.username = username;
  Connection.password = password;
};


const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.post('/users', (req, res) => {
    try {
      const doc = yaml.load(fs.readFileSync('./users.yaml', 'utf8'));
      const userIndex = doc.users.findIndex(user => user.user == req.body.username && user.pwd == req.body.password);
      
      if (userIndex > -1) {
        const accessToken = generateAccessToken(doc.users[userIndex]);
        initMongoConnection(req.body.username, req.body.password)     
        res.status(200);
        res.send({accessToken, username: req.body.username});
      } else {
          res.status(400);
          res.json("User not found, connection is not posible.")
      }
    } catch (e) {
      console.log(e);
    }
})

app.post('/todos', authenticateToken, (req, res) => {   
  const uri = `mongodb+srv://${Connection.username}:${Connection.password}@cluster0.coo3aqp.mongodb.net?retryWrites=true&w=majority`
  const client = new MongoClient(uri);
  const newTodo = req.body;

  client.db("auth-app")
  .collection("todos")
  .insertOne(newTodo, function (err, _result) {
    if (err) {
      res.status(401).json(err);
    } else {
      res.json(`Successfully added: ${newTodo.title}`);
    }
  })
})

app.get('/todos', authenticateToken, (req, res) => {
  const uri = `mongodb+srv://${Connection.username}:${Connection.password}@cluster0.coo3aqp.mongodb.net?retryWrites=true&w=majority`
  const client = new MongoClient(uri);
  
  client.db("auth-app")
  .collection("todos")
  .find({}).limit(50)
  .toArray(function (err, result) {
    if (err) {
      res.status(400).json(err);
    } else {
      res.json(result);
    }
  });
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401)
    }
    req.user = user;
    next();
  });
}