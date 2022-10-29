require("dotenv").config({ silent: true }) // load environmental variables from a hidden file named .env
const express = require("express") // import and instantiate express
const morgan = require("morgan") // middleware for nice logging of incoming HTTP requests
const mongoose = require("mongoose") // library for MongoDB
const cors = require("cors") // middleware for enabling CORS (Cross-Origin Resource Sharing) requests
const bcrypt = require("bcrypt") // module to hash incoming plain text password
const jwt = require("jsonwebtoken") // module for jwt authentication
const passport = require("passport") // middleware for handling authentication requests
const passportJWT = require("passport-jwt") // module to authenticate endpoints using a jwt
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy
const app = express() // instantiate an Express object
const _ = require("lodash")

app.use(passport.initialize()) // tell express to use passport middleware
app.use(cors())
app.use(morgan("dev", { skip: (req, res) => process.env.NODE_ENV === "test" })) // use the morgan middleware to log all incoming http requests
app.use(express.json({ limit: "25mb" })) // decode JSON-formatted incoming POST data
app.use(express.urlencoded({ limit: "25mb", extended: true })) // decode url-encoded incoming POST data
app.use("/client", express.static("client")) // create a static route that serves the front-end built code

// connect to database
mongoose
  .connect(`mongodb+srv://rankedadmin:rankedadmin@rankedcluster.9tvbag8.mongodb.net/test`)
  .then((data) => console.log(`Connected to MongoDB`))
  .catch((err) => console.error(`Failed to connect to MongoDB: ${err}`))

// grab db models
const { User } = require("./models/User")
const { Comment } = require("./models/Comment")
const { Post } = require("./models/Post")
const { Megathread } = require("./models/Megathread")
const { ThreadRequest } = require("./models/ThreadRequest")
const { StaticImg } = require("./models/StaticImg")
const { assert } = require("console")

// set up some jwt authentication options
let jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt") // look for the Authorization request header
jwtOptions.secretOrKey = process.env.JWT_SECRET // an arbitrary string used during encryption

// a middleware code for using JWT that will be passed to passport
const jwtStrategy = new JwtStrategy(jwtOptions, (payload, done) => {
  // find matching user in DB using the unique user ID stored in jwt's payload section
  const user = User.findById(payload.sub, (err, user) => {
    // error while fetching data from DB
    if (err) {
      done(null, false)
    }
    // user not found
    else if (!user) {
      done(null, false)
    }
    // user found
    else {
      done(null, user)
    }
  })
})
passport.use(jwtStrategy)

// GET route to check if a user is logged in or not
// if yes, return the user object to the front-end
// if not, passport will throw error so the front-end can catch it
app.get(
  "/isLoggedIn",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    return res.json({
      success: true,
      user: req.user,
    })
  }
)

// get all games (called on home page)
app.get("/games", async (req, res) => {
  try {
    const allGames = await Megathread.find({})
    res.json({
      games: allGames,
      status: "all good",
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: err,
      status: "failed to retrieve GAMES from the database",
    })
  }
})

// get all posts (for home page)
app.get("/posts", async (req, res) => {
  try {
    const allPosts = await Post.find({}).sort({ likes: -1 })
    res.json({
      home_posts: allPosts,
      status: "all good",
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: err,
      status: "failed to retrieve posts from the database",
    })
  }
})

// get all posts for a specific game/ megathread
app.get("/megathread/:gameId/posts", async (req, res) => {
  try {
    const allPosts = await Post.find({ toMegathread: req.params.gameId }).sort({
      likes: -1,
    })
    const game = await Megathread.findOne({ _id: req.params.gameId })
    res.json({
      game_posts: allPosts,
      gamename: game.gamename,
      status: "all good",
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: err,
      status: "failed to retrieve posts from the database",
    })
  }
})

// get the post content of a specific post
app.get("/:postId/post", async (req, res) => {
  try {
    const thisPost = await Post.findOne({ _id: req.params.postId })
    res.json({
      sub_post: thisPost,
      status: "all good",
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: err,
      status: "failed to retrieve post from the database",
    })
  }
})

// helper function to fill in replies array of a comment
const populateReplies = async (arr) => {
  try {
    for (i of arr) {
      const tempArr = await Comment.find({ replyTo: i._id })
      i.replies.push(...tempArr)
      await populateReplies(i.replies)
    }
  } catch (err) {
    throw err
  }
}

// get comments for a specific post (called on a subthread page)
app.get("/:postId/comments", async (req, res) => {
  try {
    let comments = await Comment.find({ postTo: req.params.postId }).sort({
      likes: -1,
    })
    await populateReplies(comments)
    res.json({
      comments: comments,
      status: "all good",
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: err,
      status: "failed to retrieve comments from the database",
    })
  }
})

// post a comment
app.post("/:id/comments/save", async (req, res) => {
  try {
    // try to save the comment to the database
    console.assert(!_.isEmpty(req.body.user))
    console.assert(!_.isEmpty(req.body.comment))
    let newComment = new Comment({
      user_id: req.body.user.username,
      user_image: req.body.user.photo,
      text: req.body.comment,
    })
    req.body.replyTo == "root"
      ? (newComment.postTo = req.params.id)
      : (newComment.replyTo = req.params.id)
    const saveComment = await newComment.save()
    return res.json({
      success: `You commented!`,
      comment: saveComment,
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to save the message to the database",
    })
  }
})

// helper function to push nested replies to a comment onto input array
const arrayOfAllReplies = async (e) => {
  try {
    e.arr.push(e.comment_id)
    const tempArr = await Comment.find({ replyTo: e.comment_id })
    for (i of tempArr) {
      await arrayOfAllReplies({ arr: e.arr, comment_id: i._id })
    }
  } catch (err) {
    throw err
  }
}

// delete a comment
app.post("/:id/comment/delete", async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id })
    assert(comment.user_id == req.body.user.username)
    const arrComments = []
    await arrayOfAllReplies({ arr: arrComments, comment_id: comment._id })
    await Comment.deleteMany({ _id: { $in: arrComments } })
    return res.json({
      success: `You deleted your comment`,
      comment: comment,
    })
  } catch (err) {
    return res.status(400).json({
      error: err,
      status: "failed to delete comment from database",
    })
  }
})

// like a comment
app.post("/:id/comment/like", async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id })
    if (comment.likedUsers.indexOf(req.body.user._id) === -1) {
      comment.likedUsers.push(req.body.user._id)
      comment.likes = comment.likedUsers.length
    } else {
      comment.likedUsers.splice(
        comment.likedUsers.indexOf(req.body.user._id),
        1
      )
      comment.likes = comment.likedUsers.length
    }
    await Comment.updateOne(
      { _id: req.params.id },
      { likedUsers: comment.likedUsers, likes: comment.likes }
    )
    return res.json({
      success: `You liked or unliked a comment`,
      comment: comment,
    })
  } catch (err) {
    return res.status(400).json({
      error: err,
      status: "failed to delete comment from database",
    })
  }
})

// make a new post
app.post(`/megathread/:gameId/save`, async (req, res) => {
  try {
    // try to save the comment to the database
    // console.assert(!_.isEmpty(req.body.user))
    // console.assert(!_.isEmpty(req.body.comment))
    let newPost = new Post({
      user_id: req.body.user.username,
      user_image: req.body.user.photo,
      title: req.body.title,
      body: req.body.body,
      tags: req.body.tags,
      image: req.body.photo,
      toMegathread: req.params.gameId,
    })
    const savePost = await newPost.save()
    return res.json({
      success: `You Posted!`,
      post: savePost,
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to save the message to the database",
    })
  }
})

// edit a post
app.post("/megathread/edit", async (req, res) => {
  try {
    // try to save the change to the database
    const post = await Post.findOne({ _id: req.body.id })
    assert(post.user_id == req.body.user.username)
    await Post.updateOne({ _id: req.body.id }, { body: req.body.body, tags: req.body.tags, image: req.body.photo })
    return res.json({
      success: "Post updated!"
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to save the message to the database",
    })
  }
})

// delete a post you made
app.post("/:id/post/delete", async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id })
    assert(post.user_id == req.body.user.username)
    const arrComments = await Comment.find({ postTo: req.params.id })
    const arrDeleteComments = []
    for (i of arrComments) {
      await arrayOfAllReplies({ arr: arrDeleteComments, comment_id: i._id })
    }
    await Comment.deleteMany({ _id: { $in: arrDeleteComments } })
    await Post.deleteOne({ _id: req.params.id })
    return res.json({
      success: `You deleted your post`,
      arrComments: arrDeleteComments,
    })
  } catch (err) {
    return res.status(400).json({
      error: err,
      status: "failed to delete post from database",
    })
  }
})

// like a post
app.post("/:id/post/like", async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id })
    if (post.likedUsers.indexOf(req.body.user._id) === -1) {
      post.likedUsers.push(req.body.user._id)
      post.likes = post.likedUsers.length
    } else {
      post.likedUsers.splice(post.likedUsers.indexOf(req.body.user._id), 1)
      post.likes = post.likedUsers.length
    }
    await Post.updateOne(
      { _id: req.params.id },
      { likedUsers: post.likedUsers, likes: post.likes }
    )
    return res.json({
      success: `You liked or unliked a comment`,
      post: post,
    })
  } catch (err) {
    return res.status(400).json({
      error: err,
      status: "failed to delete comment from database",
    })
  }
})

// handle thread request submitted by user
app.post("/threadrequest", (req, res) => {
  const dateObj = new Date()
  const year = dateObj.getFullYear()
  const month = ("0" + (dateObj.getMonth() + 1)).slice(-2)
  const date = ("0" + dateObj.getDate()).slice(-2)
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const seconds = dateObj.getSeconds()
  const gameName = req.body.gameName
  const willModerate = req.body.willModerate
  const friendsWillModerate = req.body.friendsWillModerate
  const reason = req.body.reason
  const username = req.body.username
  const userID = req.body.userID

  // each field of the form should not be empty or missing
  if (
    !gameName.trim() ||
    (willModerate !== 1 && willModerate !== 0) ||
    (friendsWillModerate !== 1 && friendsWillModerate !== 0) ||
    !reason.trim()
  ) {
    return res.json({
      missing: "Please fill out all parts!",
    })
  } else {
    const newThreadRequest = new ThreadRequest({
      gameName: gameName,
      willModerate: willModerate,
      friendsWillModerate: friendsWillModerate,
      reason: reason,
      requestedUsername: username,
      requestedUserId: userID,
      dateRequested: `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`,
      approvalStatus: "pending",
    })

    newThreadRequest.save((err) => {
      // something went wrong during the saving
      if (err) {
        console.log(err)
      } else {
        return res.json({
          success:
            "Request submitted! You can check the status of your request in your Account page.",
        })
      }
    })
  }
})

// helper function to generate a jwt
// payload (sub) section contains the id of that user
const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
    },
    jwtOptions.secretOrKey
  )
}

// handle user registration, using JWT authentication
app.post("/register", (req, res) => {
  const dateObj = new Date()
  const year = dateObj.getFullYear()
  const month = ("0" + (dateObj.getMonth() + 1)).slice(-2)
  const date = ("0" + dateObj.getDate()).slice(-2)
  const username = req.body.username.toLowerCase()
  const password = req.body.password
  const email = req.body.email.toLowerCase()

  // missing essential info from the register form
  if (!username.trim() || !email.trim() || !password) {
    return res.json({
      missing: "Please fill out all parts!",
    })
  } else if (!/^[A-Za-z0-9]+$/.test(username)) {
    return res.json({
      invalidNameFormat:
        "Only alphanumeric characters are allowed in username!",
    })
  } else {
    User.findOne({ username }, (err, result) => {
      // error retrieving data from the DB
      if (err) {
        console.log(err)
      }
      // prevent two users having the same username
      else if (result != null) {
        return res.json({
          duplicated: "User already exists!",
        })
      }
      // begin the registration and authentication process
      else {
        // hash the incoming plain text password and store it in DB
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          // something wrong while hashing the plain text password
          if (err) {
            console.log(err)
          } else {
            // create a new user object using the User schema
            // that we've defined in models/User.js
            const newUser = new User({
              username: username,
              password: hashedPassword,
              email: email,
              joinDate: year + "-" + month + "-" + date,
            })

            // try to save this new user object into DB
            newUser.save((err, user) => {
              if (err) {
                console.log(err)
              }
              // user successfully saved to db
              else {
                // generate the jwt using our signToken helper function
                const token = signToken(user)
                return res.json({
                  success: `Welcome to Ranked, ${user.username}!`,
                  token: token,
                })
              }
            })
          }
        })
      }
    })
  }
})

// POST route to handle user login authentication
app.post("/login", (req, res) => {
  const username = req.body.username.toLowerCase()
  const password = req.body.password

  if (!username.trim() || !password) {
    return res.json({
      missing: "Username or password missing!",
    })
  } else {
    User.findOne({ username: username }, (err, user) => {
      // error while retrieving data from the DB
      if (err) {
        console.log(err)
      }
      // user not found
      else if (!user) {
        return res.json({
          notFound: "User not found!",
        })
      }
      // user found, check for password match
      else {
        bcrypt.compare(password, user.password, (err, result) => {
          // something wrong while using the bcrypt module
          if (err) {
            console.log(err)
          }
          // input password does not match with what we have on file
          else if (result === false) {
            return res.json({
              incorrect: "Password incorrect!",
            })
          }
          // sign-in successful
          else {
            const token = signToken(user)
            return res.json({
              success: `Welcome back, ${user.username}!`,
              token: token,
            })
          }
        })
      }
    })
  }
})

app.get("/admin", (req, res) => {
  ThreadRequest.find({}, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      return res.json({
        threadRequestList: result,
      })
    }
  })
})

app.get("/search", async (req, res) => {
  try {
    const postsArray = await Post.find({})
    const gamesArray = await Megathread.find({})
    return res.json({
      gamesArray: gamesArray,
      postsArray: postsArray,
      success: "all good",
    })
  } catch (err) {
    return res.status(400).json({
      error: err,
      status: "failed to fetch all the posts (SEARCH BAR)",
    })
  }
})

// approve or reject a user submitted thread request
app.post("/admin", async (req, res) => {
  const adminDecision = req.body.approvalStatus
  const inputRequestID = req.body.requestID

  // process request form cannot be empty
  if (adminDecision !== 1 && adminDecision !== 0) {
    return res.json({
      missing: "Please select approve or reject first!",
    })
  } else {
    try {
      const matchedRequest = await ThreadRequest.findOne({
        _id: inputRequestID,
      })
      if (matchedRequest.approvalStatus === "pending") {
        matchedRequest.approvalStatus = adminDecision ? "Approved" : "Rejected"
        await matchedRequest.save()
        if (matchedRequest.approvalStatus == "Approved") {
          const newMegathread = new Megathread({
            gamename: matchedRequest.gameName,
            moderators: [],
          })
          await newMegathread.save()
          return res.json({
            newMegathread: newMegathread,
            success: "Approval status updated!",
          })
        } else {
          return res.json({
            success: "Approval status updated!",
          })
        }
      }
      // this request has been handled already
      else {
        return res.json({
          alreadyProcessed: "This request has already been processed!",
        })
      }
    } catch (err) {
      console.error(err)
      return res.status(400).json({
        error: err,
        status: "failed to save megathread requested",
      })
    }
  }
})

// show user's submitted thread requests in Account page
app.post("/account", (req, res) => {
  const userID = req.body.userID

  ThreadRequest.find({ requestedUserId: userID }, (err, result) => {
    // something wrong while querying the DB
    if (err) {
      console.log(err)
    }
    // return a list of thread requests submitted by this user
    else {
      return res.json({
        threadRequestList: result,
      })
    }
  })
})

// edit profile photo
app.post("/profile", async (req, res) => {
  const username = req.body.username
  const incomingImg = req.body.photo

  if (incomingImg.length === 0) {
    return res.json({
      missing: "Please select an image first!",
    })
  } else {
    try {
      await User.updateOne({ username: username }, { photo: incomingImg })
      await Post.updateMany({ user_id: username }, { user_image: incomingImg })
      await Comment.updateMany(
        { user_id: username },
        { user_image: incomingImg }
      )
      return res.json({
        success: "Profile image updated successfully!",
      })
    } catch (err) {
      console.error(err)
      return res.status(400).json({
        error: err,
        status: "failed to save the photo to the database",
      })
    }
  }
})

app.get("/staticImg", async (req, res) => {
  try {
    const allStaticImgs = await StaticImg.find({})
    return res.json({
      allStaticImgs: allStaticImgs[0],
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to retrieve data from the DB",
    })
  }
})

// POST route to delete account created during unit testing
app.post("/deleteAcc", async (req, res) => {
  const username = req.body.username.toLowerCase()
  try {
    await User.deleteOne({ username: username })
    return res.json({
      success: "account deleted!",
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to delete this account from the DB",
    })
  }
})

// POST route to delete thread request created during unit testing
app.post("/deleteThreadRequest", async (req, res) => {
  const gameName = req.body.gameName
  try {
    await ThreadRequest.deleteOne({ gameName: gameName })
    return res.json({
      success: "thread request deleted!",
    })
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: err,
      status: "failed to delete this thread request from the DB",
    })
  }
})

// export the express app created to make it available to other modules
module.exports = app