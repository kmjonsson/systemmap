
function SystemMap(cfg) {
	// Check for required cfg's
	if(cfg.ws === undefined) { return null; }
	if(cfg.id === undefined) { return null; }
	if(cfg.uri === undefined) { return null; }
	// set defaults
	if(cfg.autoconnect !== undefined) { cfg.autoconnect = true; }
	if(cfg.interval === undefined) { cfg.interval = 300; } // 300s
	if(cfg.onopen === undefined) { 
                cfg.onopen = function() { show_error("Connected :-)"); }
	}
	if(cfg.onclose === undefined) { 
                cfg.onclose = function() { show_error("Lost connection :-("); }
	}
	this.cfg = cfg;
	this.svg = Snap(cfg.id);
	var sm = this;
	Snap.load(cfg.uri, function ( loadedFragment ) { 
			var svgElement = loadedFragment.select("svg");
			if(svgElement.attr('viewBox') === undefined) {
				if(svgElement.attr('width') !== undefined &&
				   svgElement.attr('height') !== undefined) {
					svgElement.attr('viewBox',"0 0 " + 
						parseFloat(svgElement.attr('width')) + " " + 
						parseFloat(svgElement.attr('height')));
				}
			}
			svgElement.attr('width','100%');
			svgElement.attr('height','100%');
			svgElement.attr('preserveAspectRatio',"xMaxYMax");
			sm.svg.append( loadedFragment ); 
			sm.loadDone();
	});
	return this;
}

// Default members
SystemMap.prototype.cfg     = null;
SystemMap.prototype.svg     = null;
SystemMap.prototype.meta    = {};
SystemMap.prototype.timer   = null;
SystemMap.prototype.socket  = null;
SystemMap.prototype.onopen  = null;
SystemMap.prototype.onclose = null;
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
	var action  = [];
	$.each(updates,function(i,update) {
		var kdfa = update.split(":");
		var a = {
			"key"  : kdfa[0], 
			"dest" : kdfa[1], 
			"func" : kdfa[2], 
			"args" : kdfa.splice(3)
		};
		if(sm.helpers[a.func] === undefined) {
			show_error("helper function: " + a.func + " is undefined :-(");
			return;
		}
		if(sm.sending[a.key] === undefined) { sm.sending[a.key] = []; } 
		sm.sending[a.key].push(id);
		action.push(a);
	});
        sm.meta[id] = { "id"   : id, "action" : action, };
}

SystemMap.prototype.connect = function() {
	var sm = this;
	if ("WebSocket" in window) {
		this.socket = new WebSocket(this.cfg.ws);
	}
	else if ("MozWebSocket" in window) {
		this.socket = new MozWebSocket(this.cfg.ws);
	}

        this.socket.onclose = function() {
		// Call callback function
		sm.cfg.onclose.apply(sm);
		// Set socket null to define socket not open.
		sm.socket = null;
        }

        // Init
        this.socket.onopen = function(){
		// Call callback function
		sm.cfg.onopen.apply(sm);
		// Do init if not done before
		if(Object.keys(sm.sending).length == 0) {
			sm.svg.selectAll('*').forEach(function(el) {
				if(el.attr('systemmap:update') != null) { 
					sm.initElement(el); 
				}
			});
		}
		sm.socket.send(JSON.stringify($.grep(Object.keys(sm.sending), function(e) { return e != '' })));
        };

        // Receiving messages
        this.socket.onmessage = function(msg) {
                var list = JSON.parse(msg.data);
		list.push({ "key":"", "value":"", "meta":""});
		// For each key in list
		$.each(list,function(i,data) {
			// For each #id with need for key
			$.each(sm.sending[data.key],function(i,id) {
				var meta = sm.meta[id];
				if(meta === undefined) {
					show_error("Unknown id in message: " + id);
					return;
				}
				// For each action
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
}

/* Callback after loading done */ 
SystemMap.prototype.loadDone = function() { 
	var sm = this;
	
	// Initial connect.
	sm.connect();

        // Every 30 sec.
        this.timer = $.timer(sm.cfg.interval*1000,function() {
		if(sm.socket == null) {
			sm.connect();
		} else {
			sm.socket.send(JSON.stringify($.grep(Object.keys(sm.sending), function(e) { return e != '' })));
		}
        });
}

function show_error(data) {
        alert(JSON.stringify(data));
}
function debug(data) {
        alert(JSON.stringify(data));
}
