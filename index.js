// TODO: 
// DOMAIN
// smart server restarting
// disconnecting
// completation off
// extra stuff off
// GET HOST RECORD VIDEO BETTER THINGS.

var express = require('express'),
    sys = require('sys'),
    // TODO: NPM socket.io doesn't include jsonp-polling transport?
    // io = require('socket.io');
    io = require('./socket.io-node');
	

function _() {
    sys.debug(sys.inspect.apply(null, arguments));
}

function Channel() {
    this.debugger = null;
    this.clients = [];
}

var app = express.createServer(),
	socket = io.listen(app), //, {transports: ['websocket', 'jsonp-polling']}),
	channels = {};

app.get('/', function(req, res){
    res.sendfile(__dirname + '/public/jsconsole/index.html');
});

app.get('/debug/*', function(req, res){
    res.sendfile(__dirname + '/public/debug.js');
});

app.get('/test/*', function(req, res){
	res.sendfile(__dirname + '/public/test.html');
});

// TODO: express.staticProvider doesn't work for me.
app.get('/public/*', function(req, res){ 
    res.sendfile(__dirname + '/public/' + req.params[0]) 
}) 

app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

socket.on('connection', function(client) {
    client.on('message', function(message) {
        var data = JSON.parse(message),
        	channelName = data.channelName,
            channel;
        
        if (channels[channelName]) {
            channel = channels[channelName];
        } else {
            channel = new Channel();
            channels[channelName] = channel;
        }

        if (data.from == 'console') {
            if (channel.clients.indexOf(client) < 0) {
                channel.clients.push(client);
            }
        
            if (data.message && channel.debugger) {
                channel.debugger.send(data.message)
            }
        } else {
            channel.debugger = client;
            
            if (data.message) {
                for (var i = channel.clients.length; i--;) {
                    channel.clients[i].send(JSON.stringify(data.message));
                }
            }
        }        
    });
    
    // TODO: Remove disconnected clients.
    //client.on('disconnect', function(client) {
    //	_(client + ' disconnect.');
    //});
});

// ------------------------------------------------------------------------ INIT

var port = 8000,
	hostname = null;

if (process.argv.length > 2) {
	var bits = process.argv[2].split(':');
	port = bits.pop();
	hostname = bits.pop();
}
_(port, hostname);
app.listen(port, hostname);