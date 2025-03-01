const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = {};
let gameStarted = false;

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    socket.on("joinGame", ({ username }) => {
        if (Object.keys(players).length < 2) {
            players[socket.id] = { username, score: 0 };
            socket.emit("playerAssigned", { id: socket.id,username });
            io.emit("updatePlayers", Object.values(players));

            if (Object.keys(players).length === 2) {
                gameStarted = true;
                io.emit("startGame");
            }
        } else {
            socket.emit("gameFull");
        }
    });

    socket.on("matchFound", ({ playerId }) => {
        if (players[playerId]) {
            players[playerId].score += 10;
            io.emit("updateScores", players);
        }
    });

    socket.on("submitGame", ({ playerId }) => {
        let winner = Object.values(players).reduce((a, b) => (a.score > b.score ? a : b));
        io.emit("gameOver", { winner: winner.username });
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", Object.values(players));
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
