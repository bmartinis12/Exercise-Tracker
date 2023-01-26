const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require("body-parser");
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const { Schema } = mongoose;

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})
const userSchema = new Schema({
  username: String, 
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post('/api/users', (req, res) => {
  const newUser = new User({
    username: req.body.username
  });
  newUser.save((err, data) => {
    if(err){
      res.send("There was an error saving a new user");
    }else{
      res.json(data)
    }
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const { description, duration } = req.body;
  const date = ( req.body.date !== undefined ? new Date(req.body.date) : new Date() );
  User.findById(id, (err, userData) => {
    if(err){
      res.send("could not find user");
    } else {
      const newExercise = new Exercise({
        userId: id, 
        description,
        duration,
        date: new Date(date),
      })
      newExercise.save((err, data) => {
        if(err){
          res.send("There was an error saving the exercise");
        }else{
          const { duration, description, date, _id } = data;
          res.json({
            username: userData.username,
            description,
            duration,
            date: date.toDateString(),
            _id: userData.id
          })
        }
      })
    }
  })
})

app.get("/api/users/:id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const {id} = req.params;
  User.findById(id, (err, userData) => {
    if(err || !userData) {
      res.send("Could not find user");
    }else{
      let dateObj = {}
      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
      }
      let filter = {
        userId: id
      }
      if(from || to ){
        filter.date = dateObj
      }
      let nonNullLimit = (limit !== null && limit !== undefined) ? limit : 500;
      Exercise.find(filter).limit(+nonNullLimit).exec((err, data) => {
        if(err || !data){
          res.json([])
        }else{
          const count = data.length
          const rawLog = data
          const {username, _id} = userData;
          const log= rawLog.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))
          if(log.date === null){
            
          }
          res.json({username, count, _id, log})
        }
      })
    } 
  })
})

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if(!data){
      res.send("No users")
    }else{
      res.json(data)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
