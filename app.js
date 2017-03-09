let express = require('express');
let app = express();
require("./express")(app);
let server = require('http').createServer(app);
let io = require('socket.io')(server);

server.listen("4050", function () {
	console.log("Express server listening on port 4050");
});

let players = {};

io.on("connection", function(client) {
	console.log("Client connected");

	client.on("ready", function(){
		client.emit("init", {id: client.id, x: 100, y: 100, players: players});
		client.broadcast.emit("addPlayer", {id: client.id, x: 100, y: 100, players: players});
		players[client.id] = {x: 100, y: 100};
	});

	client.on("updatePlayer", function(data){
		if (client.id in players){
			players[client.id].x = data.x;
			players[client.id].y = data.y;
		}
	});

	client.on("disconnect", function(){
		console.log("Client disconnected");
		delete players[client.id];
		io.sockets.emit("deletePlayer", client.id);
	});
});

setInterval(function(){
	io.sockets.emit("updatePlayers", players);
}, 10);
