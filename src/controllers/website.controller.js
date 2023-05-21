import { getConnection, sql } from '../database';
import { errorHandler } from '../helper';

export const getHome = async (req, res, next) => {
  let limit = req.params.limit === 'no-limit' ? null : Number(req.params.limit);
  let statusName = req.params.status === 'all' ? null : req.params.status;
  try {
    const pool = await getConnection();
    let result;
    let outputMessage = "";
    result = await pool.request()
      .input('limit', sql.Int, limit)
      .input('statusName', sql.VarChar, statusName)
      .output('outputMessage', sql.NVarChar(255), outputMessage)
      .execute('getHomeWithLimitAndStatus');

    if (outputMessage === 'could not fetch from database') {
      throw new Error('could not fetch from database');
    }

    res.status(200).json({ message: outputMessage, animeList: result.recordset, status: statusName });
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
          *
        FROM dbo.getAnimeDetails(@animeId)
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
          *
        FROM dbo.getAnimeGenres(@animeId)
      `);

    // Fetch reactions
    const reactionsResult = await pool.request()
      .input('animeId', sql.Int, animeId)
      .query(`
        SELECT 
          *
        FROM dbo.getAnimeReactions(@animeId)
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
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM dbo.getUserById(@userId)');
      
    const user = userResult.recordset[0];
    if (!user) throw new Error('no user found');

    // Get followers
    const followers = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM dbo.getUserFollowers(@userId)');

    // Get followings
    const followings = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM dbo.getUserFollowings(@userId)');

    // Get reactions
    const reactions = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM dbo.getUserReactions(@userId)');

    // Get anime list
    const animeList = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM dbo.getUserAnimeList(@userId)');

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
