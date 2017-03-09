//var socket = io.connect('http://127.0.0.1:4050');
var socket = io.connect('http://game.jazcash.com:4050');

socket.on("connection", function(client) {
	console.log(client);
});

let doc = document.getElementById("pixiContainer");

var stage = new PIXI.Container(),
	renderer = PIXI.autoDetectRenderer(512, 512);

doc.appendChild(renderer.view);

PIXI.loader.add("treasureHunter.json").load(setup);

var player, dungeon, rectangle;
let myId;
let players = {};

function setup() {
	var dungeonTexture = PIXI.utils.TextureCache["images/dungeon.png"];
	dungeon = new PIXI.Sprite(dungeonTexture);
	stage.addChild(dungeon);

	socket.emit("ready");

	socket.on("init", function(initData){
		players = initData.players;
		myId = initData.id;

		var playerTexture = PIXI.utils.TextureCache["images/explorer.png"];
		player = new PIXI.Sprite(playerTexture);

		player.y = initData.x;
		player.x = initData.y;
		player.vx = 0;
		player.vy = 0;
		stage.addChild(player);

		for(var key in players){
			let localPlayer = new PIXI.Sprite(playerTexture);
			localPlayer.y = players[key].x;
			localPlayer.x = players[key].y;
			localPlayer.vx = 0;
			localPlayer.vy = 0;
			players[key] = localPlayer;
			stage.addChild(localPlayer);
		}

		var left = keyboard(37),
		up = keyboard(38),
		right = keyboard(39),
		down = keyboard(40);

		left.press = function () {
			player.vx = -3;
			player.vy = 0;
		};
		left.release = function () {
			if (!right.isDown && player.vy === 0) {
				player.vx = 0;
			}
		};

		up.press = function () {
			player.vy = -3;
			player.vx = 0;
		};
		up.release = function () {
			if (!down.isDown && player.vx === 0) {
				player.vy = 0;
			}
		};

		right.press = function () {
			player.vx = 3;
			player.vy = 0;
		};
		right.release = function () {
			if (!left.isDown && player.vy === 0) {
				player.vx = 0;
			}
		};

		down.press = function () {
			player.vy = 3;
			player.vx = 0;
		};
		down.release = function () {
			if (!up.isDown && player.vx === 0) {
				player.vy = 0;
			}
		};

		gameLoop();
	});

	socket.on("addPlayer", function(data){
		if (!(data.id in players)){
			var playerTexture = PIXI.utils.TextureCache["images/explorer.png"];
			var newPlayer = new PIXI.Sprite(playerTexture);

			newPlayer.y = data.x;
			newPlayer.x = data.y;
			newPlayer.vx = 0;
			newPlayer.vy = 0;
			players[data.id] = newPlayer;
			stage.addChild(newPlayer);
		}
	});

	socket.on("updatePlayers", function(playersData){
		for(var key in playersData){
			if (key !== myId){
				if (key in players){
					players[key].x = playersData[key].x;
					players[key].y = playersData[key].y;
				}
			}
		}
	});

	socket.on("deletePlayer", function(id){
		delete players[id];
	});
}

function gameLoop() {
	socket.emit("updatePlayer", {x: player.x, y: player.y});

	requestAnimationFrame(gameLoop);
	play();
	renderer.render(stage);
}

function play() {
	if (player){
		if (player.x + player.vx > 28 && player.x + player.vx < 464)
			player.x += player.vx;

		if (player.y + player.vy > 28 && player.y + player.vy < 448)
			player.y += player.vy
	}
}

function keyboard(keyCode) {
	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;

	key.downHandler = function (event) {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	key.upHandler = function (event) {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	window.addEventListener("keydown", key.downHandler.bind(key), false);
	window.addEventListener("keyup", key.upHandler.bind(key), false);
	return key;
}

function hitTestRectangle(r1, r2) {
	var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
	hit = false;

	r1.centerX = r1.x + r1.width / 2;
	r1.centerY = r1.y + r1.height / 2;
	r2.centerX = r2.x + r2.width / 2;
	r2.centerY = r2.y + r2.height / 2;

	r1.halfWidth = r1.width / 2;
	r1.halfHeight = r1.height / 2;
	r2.halfWidth = r2.width / 2;
	r2.halfHeight = r2.height / 2;

	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	if (Math.abs(vx) < combinedHalfWidths) {
		if (Math.abs(vy) < combinedHalfHeights) {
			hit = true;
		} else {
			hit = false;
		}
	} else {
		hit = false;
	}
	return hit;
};
