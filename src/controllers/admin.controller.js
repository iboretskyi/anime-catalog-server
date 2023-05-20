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

  const { title, description, genre: genreString } = req.body;
  const genre = genreString.split(',');

  let filePath = req.file.path; // Full file path
  let imageUrl = `/${path.join('images', path.basename(filePath))}`; // This is the relative path

  try {
    const pool = await getConnection();
    
    // Insert into Anime table and get the inserted id
    const animeResult = await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('score', sql.Decimal(3, 2), 9.99)
      .input('imageUrl', sql.VarChar, imageUrl)
      .query('INSERT INTO Anime (title, description, score, imageUrl) OUTPUT INSERTED.id VALUES (@title, @description, @score, @imageUrl)');
    
    const animeId = animeResult.recordset[0].id;

    // Insert into AnimeGenre table
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

    const message = 'Added new anime to the database';
    res.status(201).json({ message: message, imageUrl: imageUrl }); // send the imageUrl back to the client
  } catch (err) {
    if (req.file) {
      clearImage(imageUrl); // delete the new image file if there was an error
    }
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
