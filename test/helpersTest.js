const { assert } = require('chai');

const { getUserByEmail, checkForDuplicate, urlsForUser } = require('../helpers.js');

const testUsers = {
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

const allURLs = {
  "shortURL": {
    longURL: "www.example.com",
    userID: "userRandomID"
  },
  "short2URL": {
    longURL: "www.Anotherexample.com",
    userID: "userRandomID"
  },
  "short3URL": {
    longURL: "www.YetAnotherexample.com",
    userID: "user2RandomID"
  }
};

describe('getUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";

    assert.equal(user, expectedOutput);
  });

  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail("IDoNotExist@example.com", testUsers);
    const expectedOutput = undefined;

    assert.equal(user, expectedOutput);
  });
});

describe('checkForDuplicate', () => {

  it("Should return true if email already exists in database", () => {
    const actual = checkForDuplicate('user@example.com', testUsers);
    const expectedOutput = true;

    assert.equal(actual, expectedOutput);
  });

  it("Should return false if email is not in database", () => {
    const actual = checkForDuplicate('google@example.com', testUsers);
    const expectedOutput = false;

    assert.equal(actual, expectedOutput);
  });

});

describe('urlsForUser', () => {

  it("Should return an object of urls for a specified user", () => {
    const actual = urlsForUser('userRandomID', allURLs);
    const expectedOutput = {
      "short2URL": "www.Anotherexample.com",
      "shortURL": "www.example.com"
    };

    assert.deepEqual(actual, expectedOutput);
  });

  it("[special case] Should return an object with 1 item for a specified user", () => {
    const actual = urlsForUser('user2RandomID', allURLs);
    const expectedOutput = {
      "short3URL": "www.YetAnotherexample.com"
    };

    assert.deepEqual(actual, expectedOutput);
  });

  it("Should return an empty object if specified user has no urls", () => {
    const actual = urlsForUser('user3RandomID', allURLs);
    const expectedOutput = {};

    assert.deepEqual(actual, expectedOutput);
  });
});