var express = require('express');
var app = express();
var http = require('http');
var Config = require('./app/config.js');

var server = http.createServer(app);
app.root = __dirname;
server.listen(8082);

app.use("/", express.static(__dirname + '/app'));
app.get('/', function (req, res) {
	res.sendFile('/app/index.html',{root: __dirname})
});