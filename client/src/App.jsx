import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import Login from "./Login.jsx";
import Lobby from "./Lobby.jsx";
import GameView from "./GameView.jsx";
import GameInProgress from './GameInProgress.jsx';
const ENDPOINT = "http://localhost:3000";

function App() {
  const [connection, setConnection] = useState({});
  const [message, setMessage] = useState("");
  const [gameState, setGameState] = useState("");
  const [lobbyParticipants, setLobbyParticipants] = useState([]);
  const [play, setPlay] = useState(false);
  const [myId, setMyId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [timer, setTimer] = useState("");
  const [day, setDay] = useState(true);
  const [endGame, setEndGame] = useState(null);
  const [preGame, setPreGame] = useState(true);
  const [wereWolves, setWerewolves] = useState(0);
  const [villagers, setVillagers] = useState(0);
  const [werewolfMessages, setWereWolfMessages] = useState([]);
  const [gameInProgress, setGameInProgress] = useState(false);
  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    document.body.style = "background: grey";

    setConnection(socket);
    socket.on("gameInProgress", (bool) => {
      setGameInProgress(bool);
    });
    socket.on("myId", (id) => {
      setMyId(id);
    });
    // socket.on("checkGameInProgress", (currentGame) => {
    //   if (progress) {
    //     // set up a check for player within gamestate before rendering
    //     // setGameState(currentGame)
    //   }
    // });
    socket.on("GetWerewolfChat", (data) => {
      setWereWolfMessages(data);
    });

    socket.on("GetParticipants", (data) => {
      setLobbyParticipants(data);
    });

    socket.on("PreGame", (gameState) => {
      let werewolves = 0;
      let villagers = 0;
      gameState.players.map((player) => {
        if (player.role === "werewolf" && player.alive) {
          werewolves += 1;
        }
        if (player.role !== "werewolf" && player.alive) {
          villagers += 1;
        }
      });

      setWerewolves(werewolves);
      setVillagers(villagers);
      setGameState(gameState);
      setPlay(true);
    });
    socket.on("updateVotes", (newGameState) => {
      let votes = Object.values(newGameState.votes);
      votes.forEach((vote) => {
        for (let x = 0; x < newGameState.players.length; x++) {
          let player = newGameState.players[x];
          if (vote === player.id) {
            player.targeted += 1;
            return;
          }
        }
      });
      setGameState(newGameState);
    });
    socket.on("timer", (timer) => {
      setTimer(timer);
    });

    socket.on("endGame", (whoWon) => {
      setEndGame(whoWon);
    });

    //////reset game listener
    socket.on("resetGame", (data) => {
      console.log("reset game was clicked");
      setPlay(false);
      setGameState(data);
      setDay(true); //recent added causing client disconnect
      setPreGame(true); //recentlyAdded client Disconnect
      setEndGame(null);
      setTimer("");
      setMessage("");
    });

    socket.on("changePhase", (gameState) => {
      let werewolves = 0;
      let villagers = 0;
      gameState.players.map((player) => {
        if (player.role === "werewolf" && player.alive) {
          werewolves += 1;
        }
        if (player.role !== "werewolf" && player.alive) {
          villagers += 1;
        }
      });
      setWerewolves(werewolves);
      setVillagers(villagers);
      setDay(gameState.day);
      setPreGame(false);
      setGameState(gameState);
    });
  }, []);

  const handleGameStart = () => {
    //set state of currentGame = gameState
    connection.emit("StartGame");
  };

  const handleLogin = (username, callback) => {
    let double = false;
    lobbyParticipants.forEach((player) => {
      if (player.name === username) {
        double = true;
      }
    })

    if (double) {
      callback()
    } else {
      connection.emit("Login", username);
      setLoggedIn(true);
    }

  };
  const handleSignup = (username, password, email) => {
    connection.emit("Signup", username, password, email);
  };

  //////////reset game logic ////////////
  const handleResetGame = () => {
    // emit to server to end => server handles the reset stuff => server emits to all clients to reset states
    connection.emit("initializeReset");
  };
  // socket.on('resetGame', () => {
  //   setPlay(false);
  // });
  //socket listener for returning to lobby
  //////////////////////////////////////
  const vote = (data) => {
    let vote = {
      me: myId,
      vote: data,
    };
    connection.emit("vote", vote);
  };

  const docChoice = (data) => {
    let docChoice = {
      me: myId,
      vote: data,
    };
    connection.emit("docChoice", docChoice);
  };
  const handleWerewolfChat = (message) => {
    connection.emit("werewolfMessages", message);
  };
  if (gameInProgress) {
    return < GameInProgress />
  } else {
    if (play) {
      return (
        <GameView
          myId={myId}
          gameState={gameState}
          timer={timer}
          day={day}
          vote={vote.bind(this)}
          docChoice={docChoice.bind(this)}
          endGame={endGame}
          preGame={preGame}
          werewolves={wereWolves}
          villagers={villagers}
          werewolfMessages={werewolfMessages}
          handleWerewolfChat={handleWerewolfChat.bind(this)}
          handleResetGame={handleResetGame.bind(this)}
        />
      );
    }
    ////whooooaaaaaa
    return (
      <div className="werewolfApp">
        {loggedIn ? null : (
          <Login
            handleLogin={handleLogin.bind(this)}
            handleSignup={handleSignup.bind(this)}
          />
        )}
        <Lobby
          participants={lobbyParticipants}
          handleGameStart={handleGameStart.bind(this)}
          loggedIn={loggedIn}
        />
      </div>
    );
  }
}

export default App;
