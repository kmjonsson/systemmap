var systemmap = {
	'svg': null,
	'socket': null,
	'timer': null,
	'meta': {},
	'uri': null,
	'ws': null,
	'helpers': {},
};

function systemmap_add_helper(name,fn) {
        if(systemmap.helpers[name] !== undefined) {
                error("helper: " + name + " already exists");
                return;
        }
        systemmap.helpers[name] = fn;
}

// Add default helper
systemmap_add_helper('value', function(value) {
                return value;
});

function systemmap_init(uri,ws) {
	systemmap.uri = uri;
	systemmap.ws  = ws;
        $('#svg').svg({onLoad: systemmap_load});
}

function systemmap_load(svg) {
        // Load svg file.
        svg.load(systemmap.uri, {changeSize: false, onLoad: systemmap_loadDone}); 
}

function systemmap_initElement(elm) {
        var id = "#" + $(elm).attr("id");
        var updates = $(elm).attr("systemmap:update").split(";");
	var sending = {};
	var action = [];
	$.each(updates,function(i,input) {
		var update = input.split(":");
		var key  = update[0];
		var dest = update[1];
		var func = update[2];
		var args = update.splice(3);
		if(systemmap.helpers[func] === undefined) {
			debug("helper function: " + func + " is undefined :-(");
			return;
		}
		if(sending[key] === undefined) {
			sending[key] = JSON.stringify({
				"id"    : id,
				"key"   : key,
			});
		}
		action.push({
			"key" : key,
			"dest" : dest,
			"func" : func,
			"args" : args,
		});
	});
        systemmap.meta[id] = {
                        "id"   : id,
                        "send" : $.map(sending,function(value,key) { return value }),
                        "action" : action,
                };
	$.each(systemmap.meta[id].send,function(i,send) {
		systemmap.socket.send(send);
	});
}

/* Callback after loading done */ 
function systemmap_loadDone(svg, error) { 
        systemmap.svg = svg;
        systemmap.socket = new WebSocket(systemmap.ws);

        systemmap.socket.onclose = function() {
                debug("Lost connection :-(");
        }

        // Init
        systemmap.socket.onopen = function(){
		$.each(['text','tspan','rect'],function(i,tag) {
			$(tag, systemmap.svg.root())
			.filter(function() { 
				return $(this).attr('systemmap:update'); 
			})
			.each(function() { 
				systemmap_initElement(this); 
			});
		});
        };

        // Receiving messages
        systemmap.socket.onmessage = function(msg) {
                var data = JSON.parse(msg.data);
                var meta = systemmap.meta[data.id];
		if(meta === undefined) {
			debug("Unknown id in message: " + data.id);
			return;
		}
		$.each(meta.action,function(i,action) {
			if(action.key !== data.key) { return; }
			var args = [data.value].concat(action.args);
                        var value = systemmap.helpers[action.func]
				.apply($(data.id, systemmap.svg.root()),args);
			if(value === undefined) { return; }
			if(action.dest === 'text') {
				$(data.id, systemmap.svg.root()).text(value);
			} else {
				$(data.id, systemmap.svg.root()).each(function() {
					this.style[action.dest] = value;
				});
			}
		});
        };

        // Every 30 sec.
        systemmap.timer = $.timer(30*1000,function() {
                $.each(systemmap.meta, function(id,meta) { 
			$.each(meta.send,function(i,send) {
				systemmap.socket.send(send);
			});
		});
        });
}

function error(data) {
        alert(JSON.stringify(data));
}
function debug(data) {
        alert(JSON.stringify(data));
}
