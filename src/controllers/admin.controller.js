import { validationResult } from 'express-validator';
import { getConnection, sql } from '../database';
import { errorHandler, clearImage } from '../helper';

export const isAdmin = async (req, res, next) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM [User] WHERE id = @userId');
    const user = result.recordset[0];
    if (user.role !== 'admin') {
      const err = new Error('not authorized');
      err.statusCode = 401;
      throw err;
    }
    next();
  } catch (err) {
    errorHandler(err, next);
  }
};

export const postAnime = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('invalid input');
    err.data = errors.array();
    err.statusCode = 403;
    return next(err);
  }
  // const imageUrl = '/' + req.file.path;
  const { title, description, genre, imageUrl } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('score', sql.Decimal(3, 2), 9.99)
      .input('genre', sql.VarChar, genre)
      .input('imageUrl', sql.VarChar, imageUrl)
      .query('INSERT INTO Anime (title, description, score, genre, imageUrl) VALUES (@title, @description, @score, @genre, @imageUrl)');
    const message = 'added new anime to the db';
    console.log(message);
    res.status(201).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const putAnime = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('invalid input');
    err.data = errors.array();
    err.statusCode = 403;
    return next(err);
  }
  const imageUrl = req.file ? '/' + req.file.path : null;
  const { title, description, genre, animeId } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query('SELECT * FROM Anime WHERE id = @animeId');
    const anime = result.recordset[0];
    if (!anime) {
      const err = new Error('invalid anime id');
      err.statusCode = 404;
      throw err;
    }
    if (imageUrl) {
      clearImage(anime.imageUrl);
      anime.imageUrl = imageUrl;
    }
    await pool.request()
      .input('title', sql.VarChar, title || anime.title)
      .input('description', sql.VarChar, description || anime.description)
      .input('genre', sql.VarChar, genre ? genre : anime.genre)
      .input('imageUrl', sql.VarChar, anime.imageUrl)
      .input('animeId', sql.Int, animeId)
      .query('UPDATE Anime SET title = @title, description = @description, genre = @genre, imageUrl = @imageUrl WHERE id = @animeId');
    const message = 'updated anime successfully';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};
