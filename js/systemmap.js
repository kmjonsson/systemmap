
function SystemMap(id, uri, ws) {
	this.ws  = ws;

	this.svg = Snap(id);
	var sm = this;
	Snap.load(uri, function ( loadedFragment ) { 
			sm.svg.group().append( loadedFragment ); 
			sm.loadDone();
	});
}

// Default members
SystemMap.prototype.ws      = null;
SystemMap.prototype.svg     = null;
SystemMap.prototype.meta    = {};
SystemMap.prototype.timer   = null;
SystemMap.prototype.socket  = null;
SystemMap.prototype.sending = {};
SystemMap.prototype.helpers = {
	// Default function
	'value':  function(data) { return data.value; },
	'meta':   function(data) { return data.meta; },
};

// Adds helpers to the prototype (can't be added to object after constructor)
SystemMap.addHelper = function(name,fn) {
        if(SystemMap.prototype.helpers[name] !== undefined) {
                show_error("helper: " + name + " already defined");
                return;
        }
        SystemMap.prototype.helpers[name] = fn;
}

SystemMap.prototype.initElement = function(elm) {
	var sm = this;
        var id = "#" + elm.attr("id");
        var updates = elm.attr("systemmap:update").split(";");
	var sending = {};
	var action = [];
	$.each(updates,function(i,update) {
		var kdfa = update.split(":");
		var key  = kdfa[0];
		var dest = kdfa[1];
		var func = kdfa[2];
		var args = kdfa.splice(3);
		if(sm.helpers[func] === undefined) {
			show_error("helper function: " + func + " is undefined :-(");
			return;
		}
		if(sm.sending[key] === undefined) { sm.sending[key] = []; } 
		sm.sending[key].push(id);
		action.push({
			"key" : key,
			"dest" : dest,
			"func" : func,
			"args" : args,
		});
	});
        sm.meta[id] = { "id"   : id, "action" : action, };
}

/* Callback after loading done */ 
SystemMap.prototype.loadDone = function() { 
	var sm = this;
	if ("WebSocket" in window) {
		this.socket = new WebSocket(this.ws);
	}
	else if ("MozWebSocket" in window) {
		this.socket = new MozWebSocket(this.ws);
	}

        this.socket.onclose = function() {
                show_error("Lost connection :-(");
        }

        // Init
        this.socket.onopen = function(){
		sm.svg.selectAll('*').forEach(function(el) {
			if(el.attr('systemmap:update') != null) { 
				sm.initElement(el); 
			}
		});
		sm.socket.send(JSON.stringify($.grep(Object.keys(sm.sending), function(e) { return e != '' })));
        };

        // Receiving messages
        this.socket.onmessage = function(msg) {
                var list = JSON.parse(msg.data);
		list.push({ "key":"", "value":"", "meta":""});
		$.each(list,function(i,data) {
			$.each(sm.sending[data.key],function(i,id) {
				var meta = sm.meta[id];
				if(meta === undefined) {
					show_error("Unknown id in message: " + id);
					return;
				}
				$.each(meta.action,function(i,action) {
					if(action.key !== data.key) { return; }
					var args = [$.extend({}, data)].concat(action.args);
					var value = sm.helpers[action.func]
						.apply(sm.svg.select(id),args);
					if(value === undefined) { return; }
					if(action.dest === 'text') {
						$(sm.svg.select(id).node).text(value);
					} else {
						$(sm.svg.select(id).node).css(action.dest,value);
					}
				});
			});
		});
        };

        // Every 30 sec.
        this.timer = $.timer(30*1000,function() {
		sm.socket.send(JSON.stringify($.grep(Object.keys(sm.sending), function(e) { return e != '' })));
        });
}

function show_error(data) {
        alert(JSON.stringify(data));
}
function debug(data) {
        alert(JSON.stringify(data));
}
