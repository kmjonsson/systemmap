SystemMap.addHelper('randomColor',function(data) {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
});
SystemMap.addHelper('degC',function(data) {
	return data.value + "°C";
});
SystemMap.addHelper('colorRange',function(data,min,max) {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	if(data.value-min < 0) {
		data.value = min;
	}
	if(data.value-max > 0) {
		value = max;
	}
	h = Math.floor(255*((data.value-min)/(max-min)))
	color += letters[Math.floor(h/16)];
	color += letters[Math.floor(h%16)];
	color += "00";
	h = 255-h;
	color += letters[Math.floor(h/16)];
	color += letters[Math.floor(h%16)];
	return color;
});

SystemMap.addHelper('timeNow',function(data) {
	var d = new Date();
	return d.toLocaleTimeString();
});
