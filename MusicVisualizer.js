var context;
var source = null;
var myAudioBuffer = null;

var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var vis_view;

var WIDTH = 480;
var HEIGHT = 480;
var SOUND_METER_GAP = 10;
var SOUND_METER_WIDTH = 60;
var SOUND_METER_HEIGHT = HEIGHT;
var SOUND_METER_MIN_LEVEL = -72.0;  // dB

var filePlayOn = false;

// frequency band
var lower_freqs = [22,66,176,704,1408,2816,5632,11264];
var upper_freqs = [66,176,704,1408,2816,5632,11264,22050];

var num = lower_freqs.length; // band number
var maxdB = 20; //max dB for filter
var prev_r = new Array(num); 
for (var i=0; i <num; i++ ) {
	prev_r[i] = 0;
}
var R=WIDTH/3;
var k=0; // mouse up
var a = 0; // hue value
var TOTAL_MIN = SOUND_METER_MIN_LEVEL + Math.log10(6);

// load demo audio files
var demo_buffer;

window.onload=function(){

	var demoAudio = document.getElementById("demoAudio");
	demoAudio.addEventListener("click", playFile, false);

	var visMod1 = document.getElementById("visMode1");
	visMod1.addEventListener("click", function(){
			setAnimationFunction(1)	
	}, false);

	var visMod2 = document.getElementById("visMode2");
	visMod2.addEventListener("click", function(){
			setAnimationFunction(2)	
	}, false);

	vis_view = document.getElementById("loudnessView");
	vis_view.width =  WIDTH;
	vis_view.height = HEIGHT;
	
	// create audio context
	context = new AudioContext();
	
	// Band pass filter
	filter = context.createBiquadFilter();
	filter.type = "peaking";
	filter.Q.value = 3;
	filter.gain.value = 0; // 12

	// click event
	vis_view.addEventListener('mousedown', mDown);
	vis_view.addEventListener('mousemove', mMove);
	vis_view.addEventListener('mouseup', mUp);
	vis_view.addEventListener('mouseleave', mUp);

	// analyzer
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;		

	var control = document.getElementById("fileChooseInput");
	control.addEventListener("change", fileChanged, false);

    animation_function = draw_MyOwn;
}

// file upload
function fileChanged(e){
	var file = e.target.files[0];
	var fileReader = new FileReader();
	fileReader.onload = fileLoaded;
	fileReader.readAsArrayBuffer(file);
}
function fileLoaded(e){
	context.decodeAudioData(e.target.result, function(buffer) {
	  myAudioBuffer = buffer;
	});
	console.log("File has been loaded.")
}

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

function setAnimationFunction (mode_num) {
	if (mode_num == 1) {
		animation_function = draw_MyOwn;
	}
	else if(mode_num == 2) {
		animation_function = Camera;		
	}
}
var pre = SOUND_METER_MIN_LEVEL;

function draw_MyOwn() {
	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = calc_octaveband_my_own(data_array)

	// color
	if ( (data_array[4] > -25) && (pre + 3<data_array[4]) ){
		a = a + 50;
		a = a % 360;
	}
	pre = data_array[4];

	// rotation
	//if (data_array[2]>-25){
	//	theta = theta + Math.PI/300;
	//}

	// 2d canvas context
	var drawContext = vis_view.getContext('2d');

	// canvas size
	//if (k == 1){
	//	console.log('H = 720')
	//	HEIGHT = 720;
	//	vis_view.height = 720;
	//	k = 0;
	//}

	// fill rectangular (for the entire canvas)
	drawContext.fillStyle = 'rgb(0,0,0)';
	drawContext.fillRect(0,0,WIDTH,HEIGHT)
	drawContext.clearRect(2, 2, WIDTH-4,HEIGHT-4);

	drawContext.font = '12pt Calibri';
	drawContext.fillStyle = 'black';
	drawContext.fillText("Low", WIDTH/3 - 15, HEIGHT - 10);
	drawContext.fillText("High", WIDTH*2/3 - 15, HEIGHT - 10);
	// total value
	//var total_value = 0;
	//for (var j=0; j<6; j++) {
	//	total_value = total_value + Math.pow(10,octaveband_level_db[j]/10);
	//}
	//total_value = 10.0*Math.log10(total_value);

	// alpha value for png image
	//var alpha = (total_value-TOTAL_MIN)/(50-TOTAL_MIN)*1
	//drawContext.globalAlpha = alpha;

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

// success callback
function onStream(stream) {
    mediaSourceNode = context.createMediaStreamSource(stream);
	
	// Connect graph
	mediaSourceNode.connect(analyser);
						  
	// visualize audio animation
    animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
}

function playFile() {
    if (filePlayOn) {
    	turnOffFileAudio();
    	return;
    }

    sourceNode = context.createBufferSource();

    sourceNode.buffer = myAudioBuffer;
    sourceNode.connect(filter);
    filter.connect(context.destination)

    // music end
    sourceNode.onended = turnOffFileAudio;

    sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
    animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	filePlayOn = true;
	
	var demoAudio = document.getElementById("demoAudio");
	demoAudio.innerHTML = 'Audio Stop'
}

function turnOffFileAudio() {
	var demoAudio = document.getElementById("demoAudio");
	demoAudio.innerHTML = 'Audio Play'
	if (sourceNode != null){
		sourceNode.stop(0);
	    sourceNode = null;
	}
    filePlayOn = false;

	stopAnimation();
}

function stopAnimation() { 
    clearInterval(animation_id);
}
