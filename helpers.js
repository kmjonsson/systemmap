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
