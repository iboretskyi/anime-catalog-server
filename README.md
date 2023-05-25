# 🎬 Anime Catalog Database Scripts

Welcome to the repository containing SQL scripts for our Anime Catalog Database. These scripts are designed to create a relational database which contains various entities like User, Anime, Genre, Reaction, and more. These are all the building blocks for a social platform where users can share and react to their favorite anime shows.

## 📝 Table Structures

The database consists of the following tables:

1. **User 👥**  
   This table stores the user details. Each user has a unique ID, email, password, username, role, and timestamps for when the user was created and last updated.

2. **Anime 🍿**  
   This table stores the details about various anime. Each anime has a unique ID, title, description, score, status ID, and an image URL.

3. **Genre 🏷️**  
   This table stores the different genres that an anime can belong to.

4. **Status 🔄**  
   This table keeps track of the status of an anime, like whether it's ongoing, completed, etc.

5. **Reaction 🗨️**  
   This table stores the reactions of users towards various anime. It includes the reaction message, upvotes, and timestamps.

6. **AnimeGenre, AnimeReaction, AnimeList, UserFollowers, UserFollowing, UserReactions, UserUpvotes ⚙️**  
   These are junction tables connecting various entities in the database, providing the ability to express many-to-many relationships.

## 💼 Stored Procedures and Functions

We have also included stored procedures and functions to make fetching and manipulating data easier. Here are some of the main ones:

- `getAnimeDetails(@animeId INT)`: Returns details about a specific anime.
- `getAnimeGenres(@animeId INT)`: Returns genres associated with a specific anime.
- `getAnimeReactions(@animeId INT)`: Returns reactions associated with a specific anime.
- `getUserById(@userId INT)`: Returns details about a specific user.
- `getUserFollowers(@userId INT)`: Returns followers of a specific user.
- `getUserFollowings(@userId INT)`: Returns users followed by a specific user.
- `getUserReactions(@userId INT)`: Returns reactions made by a specific user.
- `getUserAnimeList(@userId INT)`: Returns the anime list of a specific user.

## 🎯 Examples of Function Usage

To fetch user details based on user ID, you would use the `getUserById` function like this:
<pre>
SELECT * FROM dbo.getUserById(<userId>)
</pre>
To fetch anime details based on anime ID, you can use the getAnimeDetails function like this:

<pre>
SELECT * FROM dbo.getAnimeDetails(<animeId>)
</pre>
To fetch genres associated with an anime, you would use the getAnimeGenres function like this:

<pre>
SELECT * FROM dbo.getAnimeGenres(<animeId>)
</pre>
To fetch reactions associated with an anime, you would use the getAnimeReactions function like this:

<pre>
SELECT * FROM dbo.getAnimeReactions(<animeId>)
</pre>
Replace <id> with actual ID values when using these examples. Enjoy your anime journey! 🎉

That's it for this repository! 🚀

Just replace `userId` and `animeId` with actual values when you use these exampl
