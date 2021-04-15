const getUserByEmail = function(email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
      return userID;
    }
  }
};

const generateRandomString = function() {
  let randString = (Math.random() + 1).toString(36).substring(2, 8);
  return randString;
};

// return true for duplicate, false for no duplicate
const checkForDuplicate = function(newEmail, database) {
  for (const user in database) {
    if (database[user].email === newEmail) {
      return true;
    }
  }
  return false;
};

// return urls for the specified id in an object
const urlsForUser = function(id, database) {
  let myURLs = {};
  for (const short in database) {
    if (id === database[short].userID) {
      myURLs[short] = database[short].longURL;
    }
  }
  return myURLs;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  checkForDuplicate,
  urlsForUser
};