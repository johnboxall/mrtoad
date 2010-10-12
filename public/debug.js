(function(window) {

function makeArray(obj) {
    return Array.prototype.slice.apply(obj);
}

function sendMessage(message) {
	// channelName
	// from
	// message
	var data = {channelName: channelName, from: 'debug'}
	if (message) {
		data.message = message;
	}
    socket.send(JSON.stringify(data));
}

function joinChannel() {
    sendMessage();
}

function sortci(a, b) {
	return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
}

function stringify(o, simple) {
	var json = '', 
		i, 
		type = ({}).toString.call(o), 
		parts = [], 
		names = [];
	
	if (type == '[object String]') {
		json = '"' + o.replace(/"/g, '\\"') + '"';
	} else if (type == '[object Array]') {
		json = '[';
		for (i = 0; i < o.length; i++) {
			parts.push(stringify(o[i], simple));
		}
		json += parts.join(', ') + ']';
		json;
	} else if (type == '[object Object]') {
		json = '{';
		for (i in o) {
			names.push(i);
		}
		names.sort(sortci);
		for (i = 0; i < names.length; i++) {
			parts.push(stringify(names[i]) + ': ' + stringify(o[names[i]], simple));
		}
		json += parts.join(', ') + '}';
	} else if (type == '[object Number]') {
		json = o + '';
	} else if (type == '[object Boolean]') {
		json = o ? 'true' : 'false';
	} else if (type == '[object Function]') {
		json = o.toString();
	} else if (o === null) {
		json = 'null';
	} else if (o === undefined) {
		json = 'undefined';
	} else {
		json = o + '';
	}	
	return json;
}

function cleanse(s) {
	return s.replace(/[<>&]/g, function (m) { 
		return {'&':'&amp;','>':'&gt;','<':'&lt;'}[m];
	});
}

var me = (function() {
		var scripts = makeArray(document.getElementsByTagName('script'));
		for (var i = scripts.length; i--;) {
			var script = scripts[i];
			if (script.src && /debug\/\w{5}\.js$/g.test(script.src)) {
				return script;
			}
		}
	})(),
	bits = me.src.split('/')[2].split(':'),
	hostname = bits.shift(),
	port = bits.pop() || 80,
	channelName = me.src.split('/').pop().split('.')[0],
	script = document.createElement('script');

script.type = 'text/javascript';
script.src = 'http://cdn.socket.io/stable/socket.io.js';
script.onload = function() {
	// TODO: cdn.socket.io doesn't include jsonp-polling transport.
	/*
	 The MIT license.
	 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	*/
	io.JSONP=[];JSONPPolling=io.Transport["jsonp-polling"]=function(){io.Transport.XHR.apply(this,arguments);this._insertAt=document.getElementsByTagName("script")[0];this._index=io.JSONP.length;io.JSONP.push(this)};io.util.inherit(JSONPPolling,io.Transport["xhr-polling"]);JSONPPolling.prototype.type="jsonp-polling";
	JSONPPolling.prototype._send=function(e){function c(){g();a._posting=false;a._checkSend()}function g(){a._iframe&&a._form.removeChild(a._iframe);try{d=document.createElement('<iframe name="'+a._iframeId+'">')}catch(i){d=document.createElement("iframe");d.name=a._iframeId}d.id=a._iframeId;a._form.appendChild(d);a._iframe=d}var a=this;if(!("_form"in this)){var b=document.createElement("FORM"),f=document.createElement("TEXTAREA"),h=this._iframeId="socket_io_iframe_"+this._index,d;b.style.position="absolute";
	b.style.top="-1000px";b.style.left="-1000px";b.target=h;b.method="POST";b.action=this._prepareUrl()+"/"+ +new Date+"/"+this._index;f.name="data";b.appendChild(f);this._insertAt.parentNode.insertBefore(b,this._insertAt);document.body.appendChild(b);this._form=b;this._area=f}g();this._posting=true;this._area.value=e;try{this._form.submit()}catch(j){}if(this._iframe.attachEvent)d.onreadystatechange=function(){a._iframe.readyState=="complete"&&c()};else this._iframe.onload=c};
	JSONPPolling.prototype._get=function(){var e=this,c=document.createElement("SCRIPT");if(this._script){this._script.parentNode.removeChild(this._script);this._script=null}c.async=true;c.src=this._prepareUrl()+"/"+ +new Date+"/"+this._index;c.onerror=function(){e._onDisconnect()};this._insertAt.parentNode.insertBefore(c,this._insertAt);this._script=c};JSONPPolling.prototype._=function(){this._onData.apply(this,arguments);this._get();return this};JSONPPolling.check=function(){return true};
	JSONPPolling.xdomainCheck=function(){return true};
	
	socket = new io.Socket(hostname, {port: port, transports: ['websocket', 'jsonp-polling']});
	socket.connect();
	socket.on('message', function(cmd) {
	    var className = 'response',
	    	rawoutput;
	
	    try {
	    	rawoutput = eval(cmd);
	    } catch (e) {
	    	rawoput = e.message;
	    	className = 'error';
	    }
	    
	    sendMessage({
	    	className: className, 
	    	result: cleanse(stringify(rawoutput))
	    });
	});
	
	socket.on('disconnect', function() {
	    joinChannel();
	});
	
	joinChannel();
	
	// Overwrite console.log.
	window.console.log = function() {
		var args = makeArray(arguments),
			output = args.length > 1 && args || args[0]
		
		sendMessage({
			className: 'console',
			result: cleanse(stringify(output))
		});
	}
}
me.parentNode.insertBefore(script, me);

})(this);