
var tmpCanvas = document.createElement('canvas');
var tmpContext = tmpCanvas.getContext('2d');

function random_select(){
	// randomly select video effect (including no effect)
	if (video_filters.length==0){
		camera_filter="clear"
	}
	else {
		var ran = Math.floor(Math.random()*video_filters.length); // 0,1,2...,9
		camera_filter = video_filters[ran]
	}
	if (video_screen_num.length==0){
		screen_num='1screen';
	}
	else {
		var ran2 = Math.floor(Math.random()*video_screen_num.length);
		screen_num = video_screen_num[ran2]
	}
	draw_camera(camera_filter,screen_num);
}

function draw_camera(camera_filter,screen_num){
	if (camera_filter!=='freeze'){
		clearInterval(draw_interval);
	}
	clearInterval(screen_interval);
	if ((camera_filter!=='invert')&&(camera_filter!=='freeze')){
		invert = 0;
	}
	if ((camera_filter!=='sepia')&&(camera_filter!=='freeze')){
		sepia = 0;
	}
	if ((camera_filter!=='saturate')&&(camera_filter!=='freeze')){
		saturate = 1;
	}
	if ((camera_filter!=='contrast')&&(camera_filter!=='freeze')){
		contrast = 100;
	}
	switch (camera_filter){
		case 'clear':
			document.getElementById("videoCanvas").style.filter='none';
			draw_interval = setInterval(clear,22);
			break;
		case 'gray':
			draw_interval = setInterval(gray,22);
			break;
		case 'threshold':
			draw_interval = setInterval(threshold,22);
			break;
		case 'brightness':
			draw_interval = setInterval(brightness,22);
			break;
		case 'sharpen':
			draw_interval = setInterval(sharpen,22);
			break;
		case 'sobel':
			draw_interval = setInterval(sobel,22);
			break;
		case 'invert':
			invert = 100;
			draw_interval = setInterval(clear,22);
			break;
		case 'sepia':
			sepia = 100;
			draw_interval = setInterval(clear,22);
			break;
		case 'saturate':
			saturate = 8;
			draw_interval = setInterval(clear,22);
			break;
		case 'contrast':
			contrast = 200;
			draw_interval = setInterval(clear,22);
			break;
		case 'embossed':
			draw_interval = setInterval(embossed,22);
			break;
		case 'freeze':
			//sleep(1000*beat_interval);
			switch (screen_num){
				case '1screen':
					one_screen();
					screen_interval = setInterval(one_screen,1000*beat_interval);
					break;
				case '2screen':
					two_screen();
					screen_interval = setInterval(two_screen,1000*beat_interval);
					break;
				case '4screen':
					four_screen();
					screen_interval = setInterval(four_screen,1000*beat_interval);
					break;
			}
			break;
	}

	if (camera_filter!=='freeze'){
		switch (screen_num){
			case '1screen':
				one_screen
				screen_interval = setInterval(one_screen,22);
				break;
			case '2screen':
				two_screen
				screen_interval = setInterval(two_screen,22);
				break;
			case '4screen':
				four_screen
				screen_interval = setInterval(four_screen,22);
				break;
		}
	}
}
function sleep(num){
	var now = new Date();
	var stop = now.getTime() + num;
	while(true){
		now = new Date();
		if(now.getTime() > stop)return;
	}
}
function clear(){
	back_videoContext.drawImage(camera,0,0,cw,ch);
}
function threshold(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var d = idata.data;

	for (var i=0; i<d.length; i+=4){
		var r = d[i];
		var g = d[i+1];
		var b = d[i+2];
		var v = (0.2126*r + 0.7152*g + 0.0722*b >= 100) ? 255 : 0;
		d[i] = d[i+1] = d[i+2] = v;
	}
	idata.data = d;
	back_videoContext.putImageData(idata,0,0)
}
function gray(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var d = idata.data;
	for (var i=0; i<d.length; i+=4) {
		var r = d[i];
		var g = d[i+1];
		var b = d[i+2];
		var v = 0.2126*r + 0.7152*g + 0.0722*b;
		d[i] = d[i+1] = d[i+2] = v
	}
	idata.data = d;
	back_videoContext.putImageData(idata,0,0)
}
function brightness(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var d = idata.data;
	var adjustment = 40
	for (var i=0; i<d.length; i+=4) {
		d[i] += adjustment;
		d[i+1] += adjustment;
		d[i+2] += adjustment;
	}
	idata.data = d;
	back_videoContext.putImageData(idata,0,0)
}
function embossed(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var d = idata.data;
	var w = idata.width;
	for (var i=0; i<d.length; i++) {
		if (i%4==3) continue;
		d[i] = 127 + 2*d[i] - d[i+4] - d[i+w*4];
	}
	idata.data = d;
	back_videoContext.putImageData(idata,0,0);
}
function convolution(pixels,weights, opaque){
	var side = Math.round(Math.sqrt(weights.length));
	var halfSide = Math.floor(side/2);
	var src = pixels.data;
	var sw = pixels.width;
	var sh = pixels.height;
	// pad output by the convolution matrix
	var w = sw;
	var h = sh;
	var output = tmpContext.createImageData(w, h);
	var dst = output.data;
	// go through the destination image pixels
	var alphaFac = opaque ? 1 : 0;
	for (var y=0; y<h; y++) {
		for (var x=0; x<w; x++) {
			var sy = y;
			var sx = x;
			var dstOff = (y*w+x)*4;
			// calculate the weighed sum of the source image pixels that
			// fall under the convolution matrix
			var r=0, g=0, b=0, a=0;
			for (var cy=0; cy<side; cy++) {
				for (var cx=0; cx<side; cx++) {
					var scy = sy + cy - halfSide;
					var scx = sx + cx - halfSide;
					if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
						var srcOff = (scy*sw+scx)*4;
						var wt = weights[cy*side+cx];
						r += src[srcOff] * wt;
						g += src[srcOff+1] * wt;
						b += src[srcOff+2] * wt;
						a += src[srcOff+3] * wt;
					}
				}
			}
			dst[dstOff] = r;
			dst[dstOff+1] = g;
			dst[dstOff+2] = b;
			dst[dstOff+3] = a + alphaFac*(255-a);
		}
	}
	return output;
}
function sharpen(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var weights = [0,-2,0,-2,9,-2,0,-2,0];
	idata = convolution(idata,weights);
	back_videoContext.putImageData(idata,0,0)
}
function sobel(){
	backContext.drawImage(camera,0,0,cw,ch);
	var idata = backContext.getImageData(0,0,cw,ch);
	var d = idata.data;

	for (var i=0; i<d.length; i+=4) {
		var r = d[i];
		var g = d[i+1];
		var b = d[i+2];
		var v = 0.2126*r + 0.7152*g + 0.0722*b;
		d[i] = d[i+1] = d[i+2] = v
	}
	idata.data = d;
	var gray_scale = idata;
	var vertical = convolution(gray_scale,[-1,0,1,-2,0,2,-1,0,1]);
	var horizontal = convolution(gray_scale,[-1,-2,-1,0,0,0,1,2,1]);
	var final_image = tmpContext.createImageData(vertical.width,vertical.height);
	for (var i=0; i<final_image.data.length; i+=4){
		var v = Math.abs(vertical.data[i]);
		final_image.data[i] = v;
		var h = Math.abs(horizontal.data[i]);
		final_image.data[i+1] = h;
		final_image.data[i+2] = (v+h)/4;
		final_image.data[i+3] = 255;
	}
	back_videoContext.putImageData(final_image,0,0)
}

function one_screen(){
	videoContext.drawImage(back_videoCanvas,0,0,cw,ch);
}
function two_screen(){
	videoContext.drawImage(back_videoCanvas,0,0,cw/2,ch);
	videoContext.drawImage(back_videoCanvas,cw/2,0,cw/2,ch);
}
function four_screen(){
	videoContext.drawImage(back_videoCanvas,0,0,cw/2,ch/2);
	videoContext.drawImage(back_videoCanvas,cw/2,0,cw/2,ch/2);
	videoContext.drawImage(back_videoCanvas,0,ch/2,cw/2,ch/2);
	videoContext.drawImage(back_videoCanvas,cw/2,ch/2,cw/2,ch/2);
}