// Weirdness if express imported before socket.io
var io = require('./lib/socket.io');

require.paths.unshift('lib/express/lib');
require('express');
require('express/plugins');

var sys = require("sys");
var utils = require('express/utils');
var http = require('express/http');

configure(function(){
  use(Logger)
  use(MethodOverride)
  use(ContentLength)
  use(Cookie)
  use(Static)
  set('root', __dirname)
})

get('/stats/', function() {
    // channels
})

get('/:channelName/debug.js', function() {
    this.sendfile(__dirname + "/public/js/debug.js");
})

get('/:channelName', function(){
    this.render('console.html.ejs', {
        locals: {
            title: 'Console',
            channelName: this.param('channelName')
        },
        layout: false
    })
})

get('/favicon.ico', function(){
    this.notFound()
})

var server = run();

var channels = {};

function Channel() {
    this.debugger_ = null;
    this.clients = [];
}


io.listen(server, {
	onClientMessage: function(data, client) {  
        // data = {channelName: "channel", message: {}, from: "debug"}
        var channelName = data.channelName;
        var channel = channels[channelName] = channels[channelName] || new Channel();
                
        if (data.from == "debug") {
            channel.debugger_ = client;
            if (data.message) {
                for (var i = 0; i < channel.clients.length; i++) {
                    channel.clients[i].send(data.message);
                }
            }
        }
        
        if (data.from == "console") {
            channel.clients = [client];
            if (data.message && channel.debugger_ != null) {
                channel.debugger_.send(data.message);
            }
        }
	}
});