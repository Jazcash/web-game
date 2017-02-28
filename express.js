let fs = require("fs");
let express = require("express");
let handlebars = require("handlebars");
let layouts = require("handlebars-layouts");
let helpers = require('handlebars-helpers')();
let handlebarsWax = require('handlebars-wax');
let glob = require("glob");
let favicon = require("serve-favicon");
let logger = require("morgan");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let compress = require("compression");
let methodOverride = require("method-override");

module.exports = function(app){
	let wax = handlebarsWax(handlebars)
		.partials('src/partials/**/*.{hbs,js}')
		.partials('src/layouts/**/*.{hbs,js}')
		.helpers(layouts)
		.helpers(helpers);

	app.engine("hbs", wax.engine);
	app.set("view engine", "hbs");
	app.set("views", "src/pages/");
	app.use(logger("dev"));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(cookieParser());
	app.use(compress());
	app.use(methodOverride());
	app.use(express.static("build"));

	app.get("/", function (req, res) {
		res.render("index");
	});

	app.use(function (req, res, next) {
		res.status(404).send("Sorry can't find that!")
	})

	glob("src/pages/**/*.hbs", {}, function(err, files){
		let routes = files.map(x => x.split("src/pages/")[1].slice(0, -4));
		routes.forEach(function(route){
			app.get("/" + route, function (req, res) {
				res.render(route);
			});
		});
	});
}
