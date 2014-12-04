var restify = require('restify');
var socketio = require('socket.io');

var server = restify.createServer();
var io = socketio.listen(server.server);

server.use(restify.CORS());
server.use(restify.queryParser());

var publishers = [];

io.sockets.on('connection', function (socket) {
    //console.log(socket);
    socket.emit('welcome', 'coucou !');

    socket.on('publish', function (name) {
        publishers.push({
            name: name,
            socket: socket
        });
        console.log('publish for : ' + name);
    });

    socket.on('listen', function(name) {
        console.log('listen to : ' + name);
        publishers.filter(function(publisher) {
            return publisher.name === name;
        }).forEach(function(publisher){
            publisher.socket.on('write', function(character){
                socket.emit('write', character);
            });
            publisher.socket.on('delete', function(){
                socket.emit('delete');
            });
            publisher.socket.on('moveSprite', function(newPosition){
                socket.emit('moveSprite', newPosition);
            });
        });
    });

    socket.on('publishers', function() {
        socket.emit('publishers', publishers.map(function(publisher) {
            return publisher.name;
        }));
    });
});

server.listen(3003, function () {
    console.log('socket.io server listening at %s', server.url);
});
