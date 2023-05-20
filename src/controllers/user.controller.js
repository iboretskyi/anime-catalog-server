import { getConnection, sql } from "../database";
import { errorHandler } from "../helper";

export const addToLibrary = async (req, res, next) => {
  const { animeId, status } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM [User] WHERE id = @userId');
    if (result.recordset.length === 0) throw new Error('no user found');
    const user = result.recordset[0];
    const foundResult = await pool.request()
      .input('userId', sql.Int, user.id)
      .input('animeId', sql.Int, animeId)
      .query('SELECT * FROM AnimeList WHERE userId = @userId AND animeId = @animeId');
    if (foundResult.recordset.length > 0) throw new Error('anime already in your library');
    await pool.request()
      .input('userId', sql.Int, user.id)
      .input('animeId', sql.Int, animeId)
      .input('status', sql.NVarChar, status)
      .query('INSERT INTO AnimeList (userId, animeId, status) VALUES (@userId, @animeId, @status)');
    const message = 'added anime to your library';
    res.status(200).json({
      message: message,
      // animeList: updatedUser.animelist,
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const pool = await getConnection();

    // Get user
    const user = await pool
      .request()
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM [User] WHERE id = @userId');

    if (!user.recordset[0]) throw new Error('no user found');

    // Get anime list
    const animeList = await pool
    .request()
    .input('userId', sql.Int, req.userId)
    .query(`
      SELECT AnimeList.*, Anime.title, Anime.imageUrl 
      FROM AnimeList 
      INNER JOIN Anime ON AnimeList.animeId = Anime.id 
      WHERE AnimeList.userId = @userId
    `);

    // Get followers
    const followers = await pool
      .request()
      .input('userId', sql.Int, req.userId)
      .query(`
        SELECT U.id, U.username 
        FROM UserFollowers UF
        INNER JOIN [User] U ON UF.followerId = U.id
        WHERE UF.userId = @userId
      `);

    // Get followings
    const followings = await pool
      .request()
      .input('userId', sql.Int, req.userId)
      .query(`
        SELECT U.id, U.username 
        FROM UserFollowing UF
        INNER JOIN [User] U ON UF.followingId = U.id
        WHERE UF.userId = @userId
      `);

    // Get reactions
    const reactions = await pool
      .request()
      .input('userId', sql.Int, req.userId)
      .query(`
        SELECT Reaction.*, Anime.title AS animeTitle, Anime.imageUrl AS animeImageUrl, [User].username AS reactedByUsername
        FROM UserReactions 
        INNER JOIN Reaction ON UserReactions.reactionId = Reaction.id
        INNER JOIN Anime ON Reaction.animeId = Anime.id
        INNER JOIN [User] ON Reaction.userId = [User].id
        WHERE UserReactions.userId = @userId
      `);

    // Get upvoted reactions
    const upvotedList = await pool
      .request()
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM UserUpvotes WHERE userId = @userId');

    const message = 'fetched user successfully';
    res.status(200).json({
      message: message,
      user: {
        _id: user.recordset[0].id,
        username: user.recordset[0].username,
        email: user.recordset[0].email,
        role: user.recordset[0].role,
        // add other user fields here...
        animeList: animeList.recordset,
        followers: followers.recordset,
        followings: followings.recordset,
        reactions: reactions.recordset,
        upvotedList: upvotedList.recordset,
      },
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const followUser = async (req, res, next) => {
  targetUserId = req.body.targetUserId;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, req.userId)
      .input('targetUserId', sql.Int, targetUserId)
      .query(`
        INSERT INTO UserFollowing (userId, followingId) 
        VALUES (@userId, @targetUserId);
        INSERT INTO UserFollowers (userId, followerId) 
        VALUES (@targetUserId, @userId);
      `);
    const message = 'target user followed';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const unfollowUser = async (req, res, next) => {
  const targetUserId = req.body.targetUserId;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('userId', sql.Int, req.userId)
      .input('targetUserId', sql.Int, targetUserId)
      .query(`
        DELETE FROM UserFollowing 
        WHERE userId = @userId AND followingId = @targetUserId;
        DELETE FROM UserFollowers 
        WHERE userId = @targetUserId AND followerId = @userId;
      `);
    const message = 'unfollowed the target user successfully';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const postReaction = async (req, res, next) => {
  const { animeId, reactionMessage } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, req.userId)
      .input('animeId', sql.Int, animeId)
      .input('reactionMessage', sql.NVarChar, reactionMessage)
      .query(`
        INSERT INTO Reaction (userId, animeId, reactionMessage) 
        VALUES (@userId, @animeId, @reactionMessage);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    const reactionId = result.recordset[0].id;
    await pool.request()
      .input('userId', sql.Int, req.userId)
      .input('reactionId', sql.Int, reactionId)
      .query(`
        INSERT INTO UserReactions (userId, reactionId) 
        VALUES (@userId, @reactionId);
      `);
    const message = 'posted reaction successfully';
    res.status(201).json({ message: message, reactionId: reactionId });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const putReaction = async (req, res, next) => {
  const { reactionId, reactionMessage } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('reactionId', sql.Int, reactionId)
      .input('reactionMessage', sql.NVarChar, reactionMessage)
      .query(`
        UPDATE Reaction 
        SET reactionMessage = @reactionMessage 
        WHERE id = @reactionId;
      `);
    const message = 'updated reaction message successfully';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const deleteReaction = async (req, res, next) => {
  const reactionId = req.body.reactionId;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('reactionId', sql.Int, reactionId)
      .input('userId', sql.Int, req.userId)
      .query(`
        DELETE FROM UserReactions 
        WHERE reactionId = @reactionId AND userId = @userId;
        DELETE FROM Reaction WHERE id = @reactionId;
      `);
    const message = 'deleted reaction successfully';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const putUpvote = async (req, res, next) => {
  const reactionId = req.body.reactionId;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('reactionId', sql.Int, reactionId)
      .input('userId', sql.Int, req.userId)
      .query(`
        UPDATE Reaction SET upvote = upvote + 1 WHERE id = @reactionId;
        INSERT INTO UserUpvotes (userId, reactionId) 
        VALUES (@userId, @reactionId);
      `);
    const message = 'upvoted a reaction';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};

export const putUnUpvote = async (req, res, next) => {
  const reactionId = req.body.reactionId;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('reactionId', sql.Int, reactionId)
      .input('userId', sql.Int, req.userId)
      .query(`
        UPDATE Reaction SET upvote = upvote - 1 WHERE id = @reactionId;
        DELETE FROM UserUpvotes 
        WHERE reactionId = @reactionId AND userId = @userId;
      `);
    const message = 'un-upvoted successfully';
    res.status(200).json({ message: message });
  } catch (err) {
    errorHandler(err, next);
  }
};
