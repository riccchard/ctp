// mouse event functions
function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}
function XY2theta(X,Y){
	var t;
	if ((X > 0) && (Y >= 0)){
		t = Math.atan(Y/X);
	}
	else if ((X < 0) && (Y > 0)){
		t = Math.atan(Y/X) + Math.PI;
	}
	else if ((X < 0) && (Y <= 0)){
		t = Math.atan(Y/X) + Math.PI;
	}
	else if ((X > 0) && (Y < 0)){
		t = Math.atan(Y/X);
	}
	else if ((X == 0) && (Y > 0)){
		t = Math.PI/2;
	}
	else if ((X == 0) && (Y < 0)){
		t = Math.PI*3/2;
	}
	else{
		t = 0;
	}
	return t;
}
function mDown(evt){
	k = 1;
	filter.Q.value = 3;
	var mousePos = getMousePos(vis_view, evt);
	var mX = mousePos.x - WIDTH/2;
	var mY = -mousePos.y + HEIGHT/2;
	if ((mX == 0) && (mY == 0)){
		filter.gain.value = 0;
		return;
	}
	filter.gain.value = maxdB*Math.sqrt((Math.pow(mX,2)+Math.pow(mY,2))*2)/WIDTH;
	// theta is 0 when pos is middle of low and high
	var theta = -XY2theta(mX,mY) + Math.PI*3/2;
	if (theta < 0){
		theta = theta + Math.PI*2;
	}
	var i = Math.floor(theta*num/(2*Math.PI));
	filter.frequency.value = lower_freqs[i] + (upper_freqs[i] - lower_freqs[i])*((theta-Math.PI*2*i/num)/(Math.PI*2/num));
}
function mUp(){
	k = 0;
	filter.gain.value = 0;
	filter.Q.value = 0;
}
function mMove(evt){
	if (k == 1){
		filter.Q.value = 3;
		var mousePos = getMousePos(vis_view,evt);
		var mX = mousePos.x - WIDTH/2;
		var mY = -mousePos.y + HEIGHT/2;
		if ((mX == 0) && (mY == 0)){
			filter.gain.value = 0;
			return;
		}
		filter.gain.value = maxdB*Math.sqrt((Math.pow(mX,2)+Math.pow(mY,2))*2)/WIDTH;
		// theta is 0 when pos is middle of low and high
		var theta = -XY2theta(mX,mY) + Math.PI*3/2;
		if (theta < 0){
			theta = theta + Math.PI*2;
		}
		var i = Math.floor(theta*num/(2*Math.PI));
		var gap = (upper_freqs[i] - lower_freqs[i])/(360/num)
		filter.frequency.value = lower_freqs[i] + (upper_freqs[i] - lower_freqs[i])*((theta-Math.PI*2*i/num)/(Math.PI*2/num));
	}
}