const express = require("express") // import and instantiate express
const path = require("path") 
const morgan = require("morgan") // middleware for nice logging of incoming HTTP requests
const multer = require("multer") // middleware to handle HTTP POST requests with file uploads
const mongoose = require("mongoose") // library for MongoDB
const cors = require("cors") // middleware for enabling CORS (Cross-Origin Resource Sharing) requests
const fs = require("fs") // module to handle readfile or writefile
const app = express() // instantiate an Express object
const allPosts = require("./post.json")

app.use(cors())
app.use(morgan("dev")) // use the morgan middleware to log all incoming http requests
app.use(express.json()) // decode JSON-formatted incoming POST data
app.use(express.urlencoded({ extended: true })) // decode url-encoded incoming POST data
app.use("/static", express.static("public")) // make 'public' directory publicly readable with static content

// demo: route for HTTP GET requests to the root document
app.get("/", (req, res) => {
    res.send("Welcome to Ranked!")
})

app.get("/posts", async (req, res) => {
  try {
    var home_posts = []
    allPosts.map(item => home_posts = home_posts.concat(item.posts))
    res.json({
        home_posts: home_posts,
        status: 'all good',
    })
} catch (err) {
    console.error(err)
    res.status(400).json({
        error: err,
        status: 'failed to retrieve messages from the database',
    })
}
})

app.get("/megathread/:gameId/posts", async (req, res) => {
  try {
      const game_posts = allPosts.find( element => 
          element.megathreadId == req.params.gameId).posts
      res.json({
          game_posts: game_posts,
          status: 'all good',
      })
  } catch (err) {
      console.error(err)
      res.status(400).json({
          error: err,
          status: 'failed to retrieve messages from the database',
      })
  }
})

app.get("/megathread/:gameId/subthread/:postId/post", async (req,res) => {
  try {
    const sub_post = allPosts.find( element => 
        element.megathreadId == req.params.gameId).posts.find( element =>
          element.post_id == req.params.postId)
        res.json({
            sub_post: sub_post,
            status: 'all good',
        })
        console.log(`${sub_post.postId}`)
  } catch (err) {
    console.error(err)
    res.status(400).json({
        error: err,
        status: 'failed to retrieve messages from the database',
    })
}
})

// verify user login
app.post("/login", (req, res) => {
    const username = req.body.username.toLowerCase()
    const password = req.body.password

    if(!username.trim() || !password){
        return res.json({
            missing: "Username or password missing!"
        })   
    }
    else{
        fs.readFile("./user.json", (err, data) => {
            if(err){
                console.log(err)
            }
            else{
                const user = JSON.parse(data)
                if(user.username != username){
                    return res.json({
                        notFound: "User not found!"
                    }) 
                }
                else{
                    return res.json({
                        success: "Login success!",
                        user: user
                    }) 
                }
            }
        })
    }
})

app.get("/aboutus", (req, res) => {
    res.sendFile("/public/AboutUs.txt", {root: __dirname})
})

app.get("/terms", (req, res) => {
    res.sendFile("/public/TermsConditions.txt", {root: __dirname})
})

app.get("/faq", (req, res) => {
    res.sendFile("/public/FAQ.txt", {root: __dirname})
})

// export the express app created to make it available to other modules
module.exports = app