const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1 Returning list of players from player table

const ReturnPlayersList = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    SELECT 
      * 
     FROM player 
    ORDER BY player_id`;
  const playersArray = await db.all(getAllPlayers);
  const result = playersArray.map((eachPlayer) => {
    return ReturnPlayersList(eachPlayer);
  });
  response.send(result);
});

// API 2 Returning specific player based on player Id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
  SELECT * 
  FROM player_details 
  WHERE player_id=${playerId}`;
  const player = await db.get(getSpecificPlayerQuery);
  const result = ReturnPlayersList(player);
  response.send(result);
});

// API 3 update specific player based on player id

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playersDetails = request.body;
  const { playerName } = playersDetails;
  const updatePlayerQuery = `
  UPDATE player_details 
   SET player_name=${playerName}
   WHERE player_id=${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4 Returning match details of specific match based on match Id

const ReturningMatchDetailsBasedOnMatchId = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT 
     * 
  FROM match_details
  WHERE match_id=${matchId}`;
  const match = await db.get(getMatchQuery);
  const result = ReturningMatchDetailsBasedOnMatchId(match);
  response.send(result);
});

// API 5 Return list of all matches of player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
  SELECT * 
  FROM player_match_score NATURAL JOIN match_details 
  WHERE player_id=${playerId}`;
  const playerMatches = await db.all(getPlayerMatches);
  const result = playerMatches.map((eachPlayerMatch) => {
    return ReturningMatchDetailsBasedOnMatchId(eachPlayerMatch);
  });
  response.send(result);
});

//API 6 Returning all the players of specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
  SELECT 
    * 
  FROM player_match_score NATURAL JOIN player_details 
  WHERE 
       match_id=${matchId}`;
  const playersArray = await db.all(getMatchPlayersQuery);
  const result = playersArray.map((eachPlayer) => {
    return ReturnPlayersList(eachPlayer);
  });
  response.send(result);
});

// API 7 statistics of players total sixes fours and score
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersStatisticsQuery = `
  SELECT 
     player_id AS playerId,
     player_name AS playerName,
     SUM(score) AS totalScore,
     SUM(fours) AS totalFours,
     SUM(sixes) AS totalSixes,
  FROM 
      player_match_score 
         NATURAL JOIN 
       player_details        
  WHERE 
      player_id=${playerId}`;
  const playerMatchDetails = await db.get(getPlayersStatisticsQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
