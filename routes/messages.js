const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const { ensureLoggedIn } = require('../middleware/auth');
const ExpressError = require('../expressError');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', function (req, res, next) {
    try {
        const message = Message.get(req.params.id);
        if (req.user.username == (message.from_user.username || message.to_user.username)) {
            return res.json({ message: message });
        }
        throw new ExpressError("Invalid Request", 400);
    } catch (err) {
        return next(err);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, function (req, res, next) {
    try {
        const { to_username, body } = req.body;
        const message = Message.create({ from_username: req.user.username, to_username, body });
        return res.json({ message: message });
    } catch (err) {
        return next(err);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post(':id/read', function (req, res, next) {
    try {
        const id = req.params.id;
        const message = Message.get(id);
        if (req.user.username == message.to_user.username) {
            const marked = Message.markRead(id);
            return res.json({ message: marked });
        }
        throw new ExpressError("Invalide Request", 400);
    } catch (err) {
        return next(err);
    }
})

module.exports = router;