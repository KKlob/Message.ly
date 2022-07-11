/** User class for message.ly */
const client = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const ExpressError = require('../expressError');


/** User of the site. */

class User {
  constructor(id, username, first_name, last_name, phone) {
    this.id = id;
    this.username = username;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    // hash password
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // get current timestamp and pass in for join_at and last_login_at
    const date = new Date();

    const result = await client.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, password, first_name, last_name, phone`, [username, hashed_password, first_name, last_name, phone, date, date]);

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await client.query(
      `SELECT password FROM users WHERE username = $1`, [username]);

    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
      else {
        return false;
      }
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const date = new Date();

    await client.query(
      `UPDATE users SET last_login_at = $1 WHERE username = $2`, [date, username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await client.query(
      `SELECT username, first_name, last_name, phone FROM users`);

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await client.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
        WHERE username = $1`, [username]);

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await client.query(
      `SELECT m.id,
                  m.to_username AS to_user,
                  t.username,
                  t.first_name,
                  t.last_name,
                  t.phone,
                  m.body,
                  m.sent_at,
                  m.read_at
          FROM messages as m
            LEFT JOIN users as t ON m.to_username = t.username
          WHERE m.from_username = $1`, [username]);

    for (let message of result.rows) {
      const { username, first_name, last_name, phone } = message;
      delete message.username;
      delete message.first_name;
      delete message.last_name;
      delete message.phone;
      message.to_user = { username, first_name, last_name, phone };
    }

    return result.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await client.query(
      `SELECT m.id,
                  m.from_username AS from_user,
                  f.username,
                  f.first_name,
                  f.last_name,
                  f.phone,
                  m.body,
                  m.sent_at,
                  m.read_at
          FROM messages as m
            LEFT JOIN users as f ON m.from_username = f.username
          WHERE m.to_username = $1`, [username]);

    for (let message of result.rows) {
      const { username, first_name, last_name, phone } = message;
      delete message.username;
      delete message.first_name;
      delete message.last_name;
      delete message.phone;
      message.from_user = { username, first_name, last_name, phone };
    }

    return result.rows;
  }
}


module.exports = User;