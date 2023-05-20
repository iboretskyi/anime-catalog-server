import { validationResult } from 'express-validator';
import { getConnection, sql } from '../database';
import { errorHandler, clearImage } from '../helper';
import path from 'path';

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

  const { title, description, genre: genreString, animeId } = req.body;
  const genre = genreString.split(',');
  const filePath = req.file.path;
  const imageUrl = `/${path.join('images', path.basename(filePath))}`;

  try {
    const pool = await getConnection();

    await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('score', sql.Decimal(3, 2), 9.99)
      .input('imageUrl', sql.VarChar, imageUrl)
      .input('animeId', sql.Int, animeId)
      .query('UPDATE Anime SET title=@title, description=@description, score=@score, imageUrl=@imageUrl WHERE id=@animeId');

    await pool.request()
      .input('animeId', sql.Int, animeId)
      .query('DELETE FROM AnimeGenre WHERE animeId=@animeId');

    await Promise.all(genre.map(async (genreName) => {
      const genreResult = await pool.request()
        .input('name', sql.VarChar, genreName.trim())
        .query('SELECT id FROM Genre WHERE name = @name');

      if (genreResult.recordset.length > 0) {
        const genreId = genreResult.recordset[0].id;
        await pool.request()
          .input('animeId', sql.Int, animeId)
          .input('genreId', sql.Int, genreId)
          .query('INSERT INTO AnimeGenre (animeId, genreId) VALUES (@animeId, @genreId)');
      }
    }));

    res.status(200).json({ message: 'Updated anime record in the database', imageUrl: imageUrl });
  } catch (err) {
    if (req.file) {
      clearImage(imageUrl);
    }
    errorHandler(err, next);
  }
};
