const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const ExpressError = require('../expressError');
const JWT_OPTIONS = { expiresIn: 60 * 60 }; // expires in 1 hour

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', function (req, res, next) {
    try {
        const { username, password } = req.body;
        const result = User.authenticate(username, password);
        if (result) {
            // create jwt token to pass back to client
            let payload = { username };
            let token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
            // update user last_logged_in
            User.updateLoginTimestamp(username);
            return res.json({ token });
        }
        throw new ExpressError("Invalid user/password", 400);
    } catch (err) {
        return next(err);
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', function (req, res, next) {
    try {
        const user = User.register(req.body);
        let payload = { username: user.username };
        let token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
        // update user last_logged_in
        User.updateLoginTimestamp(user.username);
        return res.json({ token });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;