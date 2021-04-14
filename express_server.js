const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;


//
// Middleware
//

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//
// Set ejs as view engine
//

app.set("view engine", "ejs");

//
// Databases
//

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "testUser"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "testUser"
  },
  "SVB-Twitch": {
    longURL: "https://www.twitch.tv/owsvb",
    userID: "testUser"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//
// Function(s)
//

const generateRandomString = function() {
  let randString = (Math.random() + 1).toString(36).substring(2, 8);
  return randString;
};

// return true for duplicate, false for no duplicate
const checkForDuplicate = function(newEmail) {
  // console.log("check for ", newEmail, "in users databse------");
  for (const user in users) {
    // console.log("Checking...", user);
    // console.log("for...", newEmail);
    if (users[user].email === newEmail) {
      return true;
    }
  }
  return false;
};

// return urls for the specified id
const urlsForUser = function(id) {
  for (const user in users) {
    if (users[user] === id) {
      return user;
    }
  }
};

//
// Main Pages
//

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let personalURL = {};
  
  const templateVars = { urls: urlDatabase, users: users, userid: req.cookies['userid'] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase.longURL, users: users, userid: req.cookies['userid'] };
  res.render("register", templateVars);
});

// Add a toggle option to select either http:// or https://
// User must pick one of the other in order to create new shortURL
// Apply this to Edit featuer as well
app.get("/urls/new", (req, res) => {
  console.log("req.cookies", req.cookies);
  // console.log("req.cookie", req.cookie);
  const templateVars = { users: users, userid: req.cookies['userid'] };
  if (req.cookies['userid']) {
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  // req.params.shortURL points to the ' :/shortURL ' in the url. Which is whatever we generated from the app.post generateRandomString() block.
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  // Set templateVars from the url provided from get method and the database
  const templateVars = { shortURL, longURL, users: users, userid: req.cookies['userid'] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  // USER MUST TYPE IN HTTP:// in order for this to work.
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, users: users, userid: req.cookies['userid'] };
  res.render("login", templateVars);
});

// // // // // // Seperate login page for when the login does not exist // // //
// app.get("/login/oops", (req, res) => {
//   let shortURL = req.params.shortURL;
//   let longURL = urlDatabase[shortURL];
//   const templateVars = { shortURL, longURL, users: users, userid: req.cookies['userid'] };
//   res.render("login_oops", templateVars);
// });
// // // // // // // // // // // // // // // // // // // // // // // // // // //

//
// Login & Logout
//

app.post("/login", (req, res) => {
  for (const userID in users) {
    if (users[userID].email && users[userID].password === req.body.password) {
      res.cookie("userid", userID);
      res.redirect("/urls");
    }
  }
  res.send(`Error ${res.statusCode = 403}:` + "\nForbidden");
});


app.post("/logout", (req, res) => {
  res.clearCookie('userid');
  res.redirect("/urls");
});

//
// Register & Create URLs
//

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send(`Error ${res.statusCode}\nPlease ensure the email and password fields are filled out.`);
  }
  if (checkForDuplicate(req.body.email)) {
    res.status(400);
    res.send(`Error ${res.statusCode}\nThis email has already been registered.`);
    return;
  }

  let newUser = {
    id: generateRandomString(),
    email: req.body.email,
    password: req.body.password
  };

  users[newUser.id] = newUser;
  res.cookie('userid', newUser.id);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  // Grab whatever user enters into the form and set it as the value to the generated short URL key
  // body-parser is a middleware which is populating the req.body object
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.cookies.userid;
  
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});


//
// Delete
//

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//
// Read JSON
//

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});