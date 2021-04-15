const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// const morgan = require("morgan");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

//
// Middleware
//

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(morgan('dev'));

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
  }
};

const users = {};

//
// Function(s)
//

const generateRandomString = function() {
  let randString = (Math.random() + 1).toString(36).substring(2, 8);
  return randString;
};

// return true for duplicate, false for no duplicate
const checkForDuplicate = function(newEmail) {
  for (const user in users) {
    if (users[user].email === newEmail) {
      return true;
    }
  }
  return false;
};

// return urls for the specified id in an object
const urlsForUser = function(id) {
  let myURLs = {};
  for (const short in urlDatabase) {
    if (id === urlDatabase[short].userID) {
      myURLs[short] = urlDatabase[short].longURL;
    }
  }
  return myURLs;
};

const findIdByEmail = function(email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return userID;
    }
  }
};

//
// Main Pages
//

app.get("/", (req, res) => {
  if (req.cookies['userid']) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

// Main page - URLs specific to user logged in
app.get("/urls", (req, res) => {
  const templateVars = { userURls: urlsForUser(req.cookies['userid']), urls: urlDatabase, users: users, userid: req.cookies['userid'] };
  console.log("users database -> ", users);
  res.render("urls_index", templateVars);
});

// Register page
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase.longURL, users: users, userid: req.cookies['userid'] };
  res.render("register", templateVars);
});

// Create url page
app.get("/urls/new", (req, res) => {
  const templateVars = { users: users, userid: req.cookies['userid'] };
  if (req.cookies['userid']) {
    return res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

// After createing new URL, show this page
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlsForUser(req.cookies['userid'])[shortURL];
  if (req.cookies['userid'] === urlDatabase[shortURL].userID) {
    const templateVars = { shortURL, longURL, users: users, userid: req.cookies['userid'] };
    return res.render("urls_show", templateVars);
  }
  return res.send("You did not create this link, so you may not Edit it");
});

// Redirect user to longURL website
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (!req.cookies['userid']) {
    return res.send("Please go Login");
  }
  if (req.cookies['userid'] !== urlDatabase[shortURL].userID) {
    return res.send("This is not your link, so you may not Use it");
  }
  let longURL = urlsForUser(req.cookies['userid'])[shortURL];
  res.redirect(longURL);
});

// Display login page
app.get("/login", (req, res) => {
  const templateVars = { users: users, userid: req.cookies['userid'] };
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
  let userID = findIdByEmail(req.body.email);
  
  if (!req.body.email || !req.body.password) {
    return res.send(`Error ${res.statusCode = 403}:` + "Missing login information. Please enter an email and password to login");
  }

  if (Object.keys(users).length === 0) {
    return res.send(`Error ${res.statusCode = 403}:` + "Login does not exist. Please go register");
  }

  if (!findIdByEmail(req.body.email)) {
    return res.send(`Error ${res.statusCode = 403}:` + "Email is not in our systems. Go register.");
  }
  
  if (users[userID].email !== req.body.email) {
    return res.send(`Error ${res.statusCode = 403}:` + "Bad email.");
  }

  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.send(`Error ${res.statusCode = 403}:` + "Wrong password");
  }

  res.cookie("userid", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('userid');
  res.redirect("/urls");
});

//
// Register & Create URLs
//

// New user register
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send(`Error ${res.statusCode}\nPlease ensure the email and password fields are filled out.`);
  }
  if (checkForDuplicate(req.body.email)) {
    res.status(400);
    return res.send(`Error ${res.statusCode}\nThis email has already been registered.`);
  }

  let newUser = {
    id: generateRandomString(),
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };

  users[newUser.id] = newUser;
  res.cookie('userid', newUser.id);
  res.redirect("/urls");
});

// Generate shortURL and add to urlDatabase along with the userID that created it
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.cookies.userid;
  
  res.redirect(`/urls/${shortURL}`);
});

// Edit
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.cookies.userid === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

//
// Delete
//

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.userid === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
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