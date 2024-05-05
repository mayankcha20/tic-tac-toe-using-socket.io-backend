const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path= require("path");
const express =require("express");
const app=express();
const httpServer = createServer();
app.use(cors());
const io = new Server(httpServer, {
  cors:process.env.FRONTEND,
});
//.................................Deployment........................




const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
  allUsers[socket.id] = {
    socket: socket,
    online: true,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.online && !user.playing && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }

    if (opponentPlayer) {
      allRooms.push({
        player1: opponentPlayer,
        player2: currentUser,
      });

      currentUser.socket.emit("OpponentFound", {
        opponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponentName: currentUser.playerName,
        playingAs: "cross",
      });

      currentUser.socket.on("playerMoveFromClient", (data) => {
        opponentPlayer.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });

      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        currentUser.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
    } else {
      currentUser.socket.emit("OpponentNotFound");
    }
  });

  socket.on("disconnect", function () {
    const currentUser = allUsers[socket.id];
    currentUser.online = false;
    currentUser.playing = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];

      if (player1.socket.id === socket.id) {
        player2.socket.emit("opponentLeftMatch");
        break;
      }

      if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeftMatch");
        break;
      }
    }
  });
});
// const __dirname1=path.resolve();
// if(process.env.NODE_ENV==="production"){
//   console.log("hello");
//   app.use(express.static(path.join(__dirname1, "/Client/dist")));

//   app.get('*',(req,res)=>{
//     res.sendFile(path.join(__dirname1, "Client", "dist" ,"index.html"));
//   });
// }
// const PORT=process.env.PORT || 3000;
// app.listen(PORT,()=> console.log(`Listen on port ${PORT}`))
httpServer.listen(3000);
