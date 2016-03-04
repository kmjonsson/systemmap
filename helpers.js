systemmap_add_helper('randomColor',function(value) {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
});
systemmap_add_helper('degC',function(value) {
	return value + "°C";
});
systemmap_add_helper('colorRange',function(value,min,max) {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	if(value-min < 0) {
		value = min;
	}
	if(value-max > 0) {
		value = max;
	}
	h = Math.floor(255*((value-min)/(max-min)))
	color += letters[Math.floor(h/16)];
	color += letters[Math.floor(h%16)];
	color += "00";
	h = 255-h;
	color += letters[Math.floor(h/16)];
	color += letters[Math.floor(h%16)];
	return color;
});

systemmap_add_helper('timeNow',function(value) {
	var d = new Date();
	return d.toISOString().split("T",2)[1].split(".")[0];
});
