const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const helpers = require('./helpers');

const app = express();
const PORT = 8080;

//
// Middleware
//

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key 1', '42 is an amazing number'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//
// Set ejs as view engine
//

app.set("view engine", "ejs");

//
// Databases
//

const urlDatabase = {};

const users = {};

//
// GET - Main Pages
//

app.get("/", (req, res) => {
  if (req.session.userid) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

// Main page - Show URLs specific to user logged in / redirect not logged in users to login page
app.get("/urls", (req, res) => {

  if (!req.session.userid) {
    return res.send(`Error ${res.statusCode = 403}: You must be logged in to view the URLs page`);
  }

  let urls = helpers.urlsForUser(req.session.userid, urlDatabase);
  const templateVars = { urls: urls, users: users, userid: req.session.userid };
  res.render("urls_index", templateVars);
});

// Register page
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase.longURL, users: users, userid: req.session.userid };
  res.render("register", templateVars);
});

// Create new shorten url page - Disallow those not logged in to view
app.get("/urls/new", (req, res) => {
  const templateVars = { users: users, userid: req.session.userid };
  if (req.session.userid) {
    return res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

// Results page of shortened URL creation - Disallow anyone besides who created it from viewing/editing link
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;

  if (!urlDatabase[shortURL]) {
    return res.send("This is an invalid shorten URL");
  }

  if (req.session.userid !== urlDatabase[shortURL].userID) {
    return res.send("You did not create this link, so you may not Edit it");
  }
  
  const templateVars = { shortURL, longURL: longURL, users: users, userid: req.session.userid };
  res.render("urls_show", templateVars);
});

// Redirect user to longURL website - Redirect users not logged in / Or those who did not create the link
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  
  if (!urlDatabase[shortURL]) {
    return res.send("This is an invalid shorten URL");
  }

  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Login page
app.get("/login", (req, res) => {
  const templateVars = { users: users, userid: req.session.userid };
  res.render("login", templateVars);
});

//
// POST - Login & Logout
//

app.post("/login", (req, res) => {
  let userID = helpers.getUserByEmail(req.body.email, users);
  
  if (!req.body.email || !req.body.password) {
    return res.send(`Error ${res.statusCode = 403}:` + "Missing login information. Please enter an email and password to login");
  }

  if (Object.keys(users).length === 0) {
    return res.send(`Error ${res.statusCode = 403}:` + "Login does not exist. Please go register");
  }

  if (!helpers.getUserByEmail(req.body.email, users)) {
    return res.send(`Error ${res.statusCode = 403}:` + "Email is not in our systems. Go register.");
  }
  
  if (users[userID].email !== req.body.email) {
    return res.send(`Error ${res.statusCode = 403}:` + "Bad email.");
  }

  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.send(`Error ${res.statusCode = 403}:` + "Wrong password");
  }

  req.session.userid = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//
// POST/PATCH - Register & Create URLs
//

// New user register
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Error ${res.statusCode}: Please ensure the email and password fields are filled out.`);
  }

  if (helpers.checkForDuplicate(req.body.email, users)) {
    return res.status(400).send(`Error ${res.statusCode}: This email has already been registered.`);
  }
  
  // Add user to database with the user entered information
  let newUser = {
    id: helpers.generateRandomString(),
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  users[newUser.id] = newUser;

  req.session.userid = newUser.id;
  res.redirect("/urls");
});

// Create shortURL and add to urlDatabase along with the userID that created it
app.post("/urls", (req, res) => {
  let shortURL = helpers.generateRandomString();
  if (req.session.userid) {
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.userid;
    return res.redirect(`/urls/${shortURL}`);
  }
  return res.status(403).send(`Error ${res.statusCode}: Only signed in users may create shortened URLs.`);
});

// Edit the longURL that a specific shortURL points towards - Disallow others from editing
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.userid === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

//
// Delete - Disallow anyone besides the user who created it from deleting
//

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.userid === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  }
  return res.status(400).send(`Error ${res.statusCode}: You do not have privallges to do this action.`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});