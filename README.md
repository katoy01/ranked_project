# ranked_project
I've  created this repository to add my own mongoDB after the old one was terminated <br/>
Here is the original working github repository we used during class: 
https://github.com/software-assignments-spring2022/final-project-ranked <br/>
Note that our Digital Ocean account has been terminated, but I made a new mongoDB account accessible from any IP address, so you should still be able to run this MERN project locally following the instructions below!

# README.md

[![CircleCI](https://circleci.com/gh/software-assignments-spring2022/final-project-ranked/tree/master.svg?style=shield)](https://circleci.com/gh/software-assignments-spring2022/final-project-ranked/tree/master)

## Link to Our App Live on the Web
[Ranked](http://157.245.85.16:3000/)

## Product Vision Statement
Ranked is a game forum site that provides developers with instant access to feedback on game updates, balance changes, and more, along with creating a community that players can refer to when looking for advice, ideas, or even whether or not the game is worth it. When a game they want to post about isn't on our app, they're able to send a Thread Request directly to our admins who ensure the game is real and has a following. Additionally, users will eventually be able to act as moderators and verify themselves with their game accounts. We (as the Ranked team) will eventually serve the community with stats on gameplay, eSports, and perceived community sentiment to further establish ourselves as an *authority* in the industry.

By creating a platform for players to directly communicate on games they love, we are building a *community* in the gaming space while also providing very different utility than currently available. Rather than developing a second-hand *influencer* market (imagine Twitch and Youtube) in which several big personalities dominate across the platform, Ranked is dominated by the collective. Our utility is that users from around the world can discuss and joke on topics (games) that they are *equally interested in and equally love*. Finding someone who has the same interests and goals as you is rare, but that is exactly why gaming excels and Ranked will thrive. 

### MVP
- Users are able to create an account based on their email address and a unique username 
- Users can search for megathreads (games) and view current posts and comments related to each
- Verified users can post, comment, and vote on posts 
- Users can send requests for new megathreads if theirs of choice does not currently exist

### Necessary Features for Each Theme
- User account creation 
- User find megathreads
- User posting, commenting, and voting

### Themes
- As a User, I want to be able to ask general questions related to a game, so that I can get answers.
  - Theme name: **General Questions**
  - Example Posts: What power level should you be for the last boss? What’s a good lineup for Raze on Ascent? How does the new competitive system work on Brawl Stars?
  - User in-game verification is **“Nice-to-Have”**
- As a User, I want to be able to post memes, so that I can enjoy a good laugh.
  - Theme name: **Memes**
  - Example Posts: What's the solution to x = CS:GO + Valorant? x = The Same Game!
- As a User, I want to be able to comment and vote on posts, so that my voice can be heard and I can react to the content I'm seeing.
  - Theme name: **Reaction**
  - Examples: Upvote, downvote, comment, save, share, or create post based on similar information.
  - Save, Share, or Create Similar are **"Nice-To-Haves"**
- As a User, I want to request new games to be added to the platform, so that I don't have to go anywhere else to get answers/discuss it.
  - Theme name: **Thread Request**
  - Example Thread Request: "Request: Valorant, Reason: I love the game and it's not here., Will I moderate: Yes, Will my friends moderate: No"


### Future Features
- Verified users can act as moderators for specific megathreads if they are a part of the group that created it and/or we approve them
- Verified users can participate in daily and/or monthly polls on how much they like whichever game their current megathread is
- Game developers and studios can be verified/approved with us then create their own megathread pertaining to their games, however they do not moderate it

## Core Team Members
**Christopher Chen** - https://github.com/chrisXchen  
**India Daniel** - https://github.com/igdaniel-1  
**Xuelong(Phillip) Jiang** - https://github.com/Phillip-XuelongJiang  
**Sid Wang** - https://github.com/sid2002CN  
**Jason Lai** - https://github.com/M2JT  
**Yoshiaki Kato** - https://github.com/katoy01 

## Brief History and Contributions
The idea for Ranked started with Chris, but none of the progress made would’ve been possible without India, Phillip, Sid, Jason, and Yoshiaki, so all credit goes to them. Originally, the idea was for a video game social media site where you could post clips of your gameplay. However it became obvious the utility of that is more limited than an open forum and thus Ranked was born. If you’d like to contribute to our project, please reference the [Contributions Document](https://github.com/software-assignments-spring2022/final-project-ranked/blob/master/CONTRIBUTING.md), then message any of us on Github. We’ll be happy to get in touch with you!

## Instructions for Building and Testing
### In the Back-end Directory
#### Set Up and Run the Back-end
1. Run `npm install` to install all dependencies listed in `package.json` onto your local machine. This is necessary before running our app, as the 3rd-party dependency code is excluded from version control by the `.gitignore` git settings file.
2. Run `npm install -g nodemon` to install nodemon globally on your machine. Notice that the server will restart when you make changes, since nodemon handles stopping and restarting the server with each code change.
3. Create a `.env` file and save it in the current directory. To ensure this file is configured with the correct environmental variables, please contact our Ranked developers for more information, as those data are sensitive and not allowed to be publicly shared on GitHub.
4. Run `nodemon server` to start the back-end. In your terminal, the initial few lines of output should contain: 
      > Server running on port: {port} <br>
      > Connected to MongoDB

### In the Front-end Directory
#### Set Up and Run the Front-end
1. Run `npm install` to install all dependencies listed in `package.json` onto your local machine. This is necessary before running our app, as the 3rd-party dependency code is excluded from version control by the `.gitignore` git settings file.
2. Create a `.env` file and save it in the current directory. To ensure this file is configured with the correct environmental variables, please contact our Ranked developers for more information, as those data are sensitive and not allowed to be publicly shared on GitHub.
3. Run `npm start` to start the front-end.
4. Open [http://localhost:3000](http://localhost:3000) to view our app in your browser. The page will reload when you make changes, and you may also see any lint errors in the console.
5. For the best viewing experience, please adjust your browser dimensions by doing the following (using Chrome as an example): <br>
    1. open `Developer Tools`
    2. click `Toggle device toolbar`
    3. select `Responsive` from the dropdown menu at the top
    4. change the `Dimensions` to `400x700`
    5. enjoy using our app!
  
### Unit Testing
* Our back-end directory includes unit tests built with [mocha](https://mochajs.org/) and [chai](https://www.chaijs.com/) assertion library, while combining with [chai-http](https://www.chaijs.com/plugins/chai-http/) plugin to simplify testing for back-end routes. Code coverage analysis is provided by the `nyc` module.
* To run unit tests, `cd` to the `back-end` directory and `npm test`. Once the script is finished running, you will be able to see all the test results and the overall code coverage analysis in the console.

## Other Important Documents / Links
1. [UX Design Document](https://github.com/software-assignments-spring2022/final-project-ranked/blob/master/UX-DESIGN.md)
2. [Contributions Document](https://github.com/software-assignments-spring2022/final-project-ranked/blob/master/CONTRIBUTING.md)
