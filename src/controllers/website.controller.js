import { getConnection, sql } from '../database';
import { errorHandler } from '../helper';

export const getHome = async (req, res, next) => {
  let limit = req.params.limit === 'no-limit' ? null : Number(req.params.limit);
  let statusName = req.params.status === 'all' ? null : req.params.status;
  try {
    const pool = await getConnection();
    let result;
    let query = '';
    if (statusName) {
      query = `SELECT ${limit ? `TOP (@limit)` : ''} Anime.id, Anime.title, Anime.description, Anime.score, Anime.imageUrl, Status.name AS status 
                FROM Anime 
                INNER JOIN Status ON Anime.statusId = Status.id 
                WHERE Status.name = @statusName`;
    } else {
      query = `SELECT ${limit ? `TOP (@limit)` : ''} Anime.id, Anime.title, Anime.description, Anime.score, Anime.imageUrl, Status.name AS status 
                FROM Anime 
                INNER JOIN Status ON Anime.statusId = Status.id`;
    }
    result = await pool.request()
      .input('statusName', sql.VarChar, statusName)
      .input('limit', sql.Int, limit)
      .query(query);
    if (result.recordset.length === 0) {
      throw new Error('could not fetch from database');
    }
    const message = 'fetched anime from db successfully';
    res.status(200).json({ message: message, animeList: result.recordset, status: statusName });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const getEachAnime = async (req, res, next) => {
  const animeId = req.params.animeId;
  try {
    const pool = await getConnection();

    // Fetch anime with genres
    const result = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query(`
        SELECT 
          Anime.*, 
          Genre.name AS genreName
        FROM Anime 
        LEFT JOIN AnimeGenre ON Anime.id = AnimeGenre.animeId 
        LEFT JOIN Genre ON AnimeGenre.genreId = Genre.id
        WHERE Anime.id = @animeId
      `);
    
    if (!result.recordset[0]) {
      const err = new Error('Not a valid URL');
      err.statusCode(404);
      throw err;
    }

    // Group genres together
    const anime = result.recordset.reduce((acc, curr) => {
      if (!acc.id) {
        acc = { ...curr, genres: [] };
      }
      if (curr.genreName) {
        acc.genres.push(curr.genreName);
      }
      return acc;
    }, {});

    const message = 'Fetched anime from DB successfully';
    res.status(200).json({ message: message, anime: anime });

  } catch (err) {
    errorHandler(err, next);
  }
};

export const getEachReaction = async (req, res, next) => {
  const reactionId = req.params.reactionId;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('reactionId', sql.Int, reactionId)
      .query('SELECT * FROM Reaction WHERE id = @reactionId');
    const reaction = result.recordset[0];
    if (!reaction) {
      const err = new Error('failed to fetch the reaction');
      err.statusCode = 404;
      throw err;
    }
    const message = 'fetched reaction successfully';
    res.status(200).json({ message: message, reaction: reaction });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const getOtherUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM User WHERE id = @userId');
    const user = result.recordset[0];
    if (!user) throw new Error('no user found');
    const message = 'fetched user successfully';
    res.status(200).json({
      message: message,
      user: user, // You'll need to manually join related data such as AnimeList, UserFollowing, etc.
    });
  } catch (err) {
    errorHandler(err, next);
  }
};
