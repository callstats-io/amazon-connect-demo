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

const mongo = require('mongodb').MongoClient
const mongoUrl = Config.config.mongoUrl;
const mongoDatabase = Config.config.mongoDatabase;
const mongoCollection = Config.config.mongoCollection;
var mongoClient;

var options = {
	keepAlive: 1, 
	connectTimeoutMS: 30000,
	useNewUrlParser: true
  };

if (mongoUrl) {
	mongo.connect(url, options, function(err, client) {
		if (err) throw err;
		mongoClient = client;
	});
}

function insertToMongo(data) {
	if (!mongoClient) {
		return;
	}
	const db = mongoClient.db(mongoDatabase);
	const collection = db.collection(mongoCollection);
	collection.insertOne(data, (err, result) => {
		if (err) throw err;
	});
}

var io = null;
io = require('socket.io').listen(server);
console.log("IO created");

io.sockets.on('connection', function (socket){
	socket.on('data', function (data) {
		var obj = JSON.parse(data);
		insertToMongo(obj);
	});
});