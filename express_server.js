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
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});

// After createing new URL, show this page
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlsForUser(req.cookies['userid'])[shortURL];
  const templateVars = { shortURL, longURL, users: users, userid: req.cookies['userid'] };
  res.render("urls_show", templateVars);
});

// Redirect user to longURL website
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (!req.cookies['userid']) {
    res.send("Please go Login");
  }
  if (req.cookies['userid'] !== urlDatabase[shortURL].userID) {
    res.send("This is not your link");
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

// New user register
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