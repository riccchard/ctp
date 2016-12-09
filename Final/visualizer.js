function draw_visualizer(){
	var octaveband_level_db = calc_octaveband_my_own(data_array)
	var drawContext = vis_view.getContext('2d');

	// fill rectangular (for the entire canvas)
	drawContext.fillStyle = 'rgb(0,0,0)';
	drawContext.fillRect(0,0,WIDTH,HEIGHT)
	drawContext.clearRect(2, 2, WIDTH-4,HEIGHT-4);

	drawContext.font = '12pt Calibri';
	drawContext.fillStyle = 'black';
	drawContext.fillText("Low", WIDTH/3 - 15, HEIGHT - 10);
	drawContext.fillText("High", WIDTH*2/3 - 15, HEIGHT - 10);

	//draw r
	for (var i=0; i<num; i++) {
		// fill samll circle (for the sound level)
		var r = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(-10-SOUND_METER_MIN_LEVEL)*(R*Math.sin(Math.PI/num));
		var r_env;

		if (prev_r[i] < r){
			r_env = r;
		}
		else{
			r_env = prev_r[i] - R/128
		}

		prev_r[i] = r_env;

		if (r_env < 0){
			r_env = 0;
		}

		// shape
		drawContext.beginPath();
		var x = (WIDTH/2) + R*Math.cos(-Math.PI/2 - Math.PI/num - Math.PI*2/num*i)
		var y = (HEIGHT/2) - R*Math.sin(-Math.PI/2 - Math.PI/num - Math.PI*2/num*i)
		drawContext.arc(x, y, r_env, 0, Math.PI*2, true);

		// color
		var hue = a;
		var saturation = 255;
		var value = 255;
		var rgb = hsvToRgb(hue, saturation, value);
		drawContext.fillStyle='rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; 
		drawContext.fill();
	}
}