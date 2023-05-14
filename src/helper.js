import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

export const errorHandler = (err, next) => {
  if (!err.statusCode) err.statusCode = 500;
  return next(err);
};

export const isAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  console.log(authHeader);
  if (!authHeader) {
    const err = new Error('not authenticated');
    err.statusCode = 401;
    throw err;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'secret-my-kitsu');
  } catch (err) {
    throw err;
  }
  if (!decodedToken) {
    const err = new Error('not authenticated');
    err.statusCode = 401;
    throw err;
  }
  req.userId = decodedToken.userId;
  next();
};

export const clearImage = async (filePath) => {
  filePath = path.join(__dirname, filePath);
  await fs.unlink(filePath);
};
