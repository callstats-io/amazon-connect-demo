var express = require('express');
var app = express();
var http = require('http');

var server = http.createServer(app);
app.root = __dirname;
server.listen(8082);

app.use("/", express.static(__dirname + '/app'));
app.get('/', function (req, res) {
	res.sendFile('/app/index.html',{root: __dirname})
});

const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
const mongoClient;

mongo.connect(url, function(err, client) {
	if (err) throw err;
	mongoClient = client;
});

function insertToMongo(data) {
	if (!mongoClient) throw err;
	const db = mongoClient.db('kennel')
	const collection = db.collection('dogs')
	collection.insertOne(data, (err, result) => {
		if (err) throw err;
    	console.log("1 document inserted");
    	db.close();
	})
}

var io = null;
if (process.env.SSL == 'true') {
    var options = {
        key:    fs.readFileSync('ssl/server.key'),
        cert:   fs.readFileSync('ssl/server.crt'),
        ca:     fs.readFileSync('ssl/ca.crt'),
        requestCert:        true,
        rejectUnauthorized: false,
        passphrase: "v2ZIZj2jKUap",
    };
    var httpsServer = https.createServer(options, app);
    httpsServer.listen(4430);

    io = require('socket.io').listen(httpsServer);
		console.log('with https');
} else {
    io = require('socket.io').listen(server);
}

console.log("IO created");

io.sockets.on('connection', function (socket){
	socket.on('data', function (message) {
		console.log('got data ', message);
	});
});