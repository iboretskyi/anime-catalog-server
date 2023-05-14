import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../helper';
import { getConnection, sql } from '../database';

export const signup = async (req, res, next) => {
  console.log(req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('invalid input');
    err.data = errors.array();
    err.statusCode = 403;
    return next(err);
  }
  const { email, password, username } = req.body;
  const role = req.body.role ? req.body.role : 'user';
  try {
    const pool = await getConnection();
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM [User] WHERE email = @email');
    if (result.recordset.length > 0) {
      const err = new Error('email already exist');
      err.statusCode = 409;
      throw err;
    }
    result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM [User] WHERE username = @username');
    if (result.recordset.length > 0) {
      const err = new Error('username already exist');
      err.statusCode = 409;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('username', sql.NVarChar, username)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO [User] (email, password, username, role) VALUES (@email, @password, @username, @role)');
    const message = 'signed up successfully';
    res.status(201).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM [User] WHERE email = @email');
    if (result.recordset.length === 0) {
      const err = new Error('no user with this email');
      err.statusCode = 401;
      throw err;
    }
    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('wrong password');
      err.statusCode = 401;
      throw err;
    }
    const token = jwt.sign(
      {
        userId: user.id,
      },
      'secret-my-kitsu',
      { expiresIn: '1h' }
    );
    const message = 'logged in successfully';
    res.status(200).json({ token: token, message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};
