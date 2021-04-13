const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Set ejs as view engine
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "SVB-Twitch": "https://www.twitch.tv/owsvb"
};

//
// Main Page
//

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  // Grab whatever user enters into the form and set it as the value to the generated short URL key
  // body-parser is a middleware which is populating the req.body object
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//
// Header stuff. Okay?
//

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

//
// New urls
//

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls/');
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  // req.params.shortURL points to the ' :/shortURL ' in the url. Which is whatever we generated from the app.post generateRandomString() block.
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  // Set templateVars from the url provided from get method and the database
  const templateVars = { shortURL, longURL, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  // USER MUST TYPE IN HTTP:// in order for this to work.
  res.redirect(longURL);
});

//
// Delete
//

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//
// Read
//

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
// Function(s)
//

const generateRandomString = function() {
  let randString = (Math.random() + 1).toString(36).substring(2, 8);
  return randString;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});