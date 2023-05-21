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

    // Fetch anime details
    const animeResult = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query(`
        SELECT 
          Anime.* 
        FROM Anime 
        WHERE Anime.id = @animeId
      `);

    if (!animeResult.recordset[0]) {
      const err = new Error('Not a valid URL');
      err.statusCode = 404;
      throw err;
    }

    // Fetch genres
    const genresResult = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query(`
        SELECT 
          Genre.name AS genreName
        FROM AnimeGenre 
        LEFT JOIN Genre ON AnimeGenre.genreId = Genre.id
        WHERE AnimeGenre.animeId = @animeId
      `);

    // Fetch reactions
    const reactionsResult = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query(`
        SELECT 
          Reaction.*, [User].username 
        FROM Reaction 
        INNER JOIN [User] ON Reaction.userId = [User].id
        WHERE Reaction.animeId = @animeId
      `);

    const anime = animeResult.recordset[0];
    anime.genres = genresResult.recordset.map(g => g.genreName);
    anime.reactions = reactionsResult.recordset;

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

    // Get user
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM [User] WHERE id = @userId');
    const user = result.recordset[0];
    if (!user) throw new Error('no user found');

    // Get followers
    const followers = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT U.id, U.username 
        FROM UserFollowers UF
        INNER JOIN [User] U ON UF.followerId = U.id
        WHERE UF.userId = @userId
      `);

    // Get followings
    const followings = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT U.id, U.username 
        FROM UserFollowing UF
        INNER JOIN [User] U ON UF.followingId = U.id
        WHERE UF.userId = @userId
      `);

    // Get reactions
    const reactions = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Reaction.*, Anime.title AS animeTitle, Anime.imageUrl AS animeImageUrl, [User].username AS reactedByUsername
        FROM UserReactions 
        INNER JOIN Reaction ON UserReactions.reactionId = Reaction.id
        INNER JOIN Anime ON Reaction.animeId = Anime.id
        INNER JOIN [User] ON Reaction.userId = [User].id
        WHERE UserReactions.userId = @userId
      `);

    // Get anime list
    const animeList = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT AnimeList.*, Anime.title, Anime.imageUrl 
        FROM AnimeList 
        INNER JOIN Anime ON AnimeList.animeId = Anime.id 
        WHERE AnimeList.userId = @userId
      `);

    const message = 'fetched user successfully';
    res.status(200).json({
      message: message,
      user: {
        _id: user.id,
        username: user.username,
        role: user.role,
        followers: followers.recordset,
        followings: followings.recordset,
        reactions: reactions.recordset,
        animeList: animeList.recordset,
      },
    });
  } catch (err) {
    errorHandler(err, next);
  }
};
