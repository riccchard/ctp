//
// "main" file for music visualizers
//

var context;
var source = null;
var myAudioBuffer = null;

var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var vis_view;
var vis_value;

var WIDTH = 720;
var HEIGHT = 480;
var SOUND_METER_GAP = 10;
var SOUND_METER_WIDTH = 60;
var SOUND_METER_HEIGHT = HEIGHT;
var SOUND_METER_MIN_LEVEL = -72.0;  // dB

var micOn = false;
var filePlayOn = false;

var animation_function;
var animation_id;

var prev_band_level = new Array(6); 
for (var i=0; i <10; i++ ) {
	prev_band_level[i] = 0;
}
var R=240;

var prev_r = new Array(6); 
for (var i=0; i <6; i++ ) {
	prev_r[i] = 0;
}

var k=1; // window size
var a = 0; // hue value
var theta = 0; // theta value
var TOTAL_MIN = SOUND_METER_MIN_LEVEL + Math.log10(6);

// load demo audio feils
var demo_buffer;

window.onload=function(){

	var micAudio = document.getElementById("micInput");
	micAudio.addEventListener("click", playMic, false);

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
	vis_value = document.getElementById("loudnessValue");
	vis_view.width =  WIDTH;
	vis_view.height = HEIGHT;
	
	// create audio context
	context = new AudioContext();
	
	// analyzer
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;		

	var demoReq = new XMLHttpRequest();
    demoReq.open("Get","demo1.mp3",true);
    demoReq.responseType = "arraybuffer";
    demoReq.onload = function(){
        context.decodeAudioData(demoReq.response, function(buffer){demo_buffer = buffer;});
    }
    demoReq.send();
    animation_function = draw_octaveband;
}

function setAnimationFunction (mode_num) {
	if (mode_num == 1) {
	    animation_function = draw_octaveband;
	}
	else if(mode_num == 2) {
	    animation_function = draw_MyOwn;		
	}

    if (filePlayOn || micOn) {
		stopAnimation();

		// restart visualize audio animation
    	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
	}
}
var loudness = SOUND_METER_MIN_LEVEL;
var pre = SOUND_METER_MIN_LEVEL;
function draw_octaveband() {
	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = calc_octaveband(data_array)


	// display the loudness value (this is for verifying if the level is correctly computed.)
	
	//if ( (octaveband_level_db[4] > -25) && (pre + 3<octaveband_level_db[4]) ){
	//	loudness = octaveband_level_db[4];
	//}
	//pre = octaveband_level_db[4]
	//if (octaveband_level_db[2] >-25){
	//	loudness = octaveband_level_db[2];
	//}
	loudness = octaveband_level_db[0];
	vis_value.innerHTML = '32Hz-Band Level (dB): ' + loudness + ' dB'

	// 2d canvas context
	var drawContext = vis_view.getContext('2d');

	// canvas size
	if (k == 0){
		console.log('H = 480')
		HEIGHT = 480;
		vis_view.height = 480;
		k = 1;
	}
	// fill rectangular (for the entire canvas)
	drawContext.fillStyle = 'rgb(0,0,0)';
	drawContext.fillRect(0, 0, WIDTH, HEIGHT);

	for (var i=0; i<10; i++) {

		// fill rectangular (for the sound level)
		var sound_level = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(0-SOUND_METER_MIN_LEVEL)*SOUND_METER_HEIGHT;
		var sound_level_env;

		///// asymmetric envelope detector
		// fill out here with your code
		// note that you can use "prev_band_level" array defined above to store the decaying level
		
		if (prev_band_level[i] < sound_level){
			sound_level_env = sound_level;
		}

		else{
			sound_level_env = prev_band_level[i]-HEIGHT/64;
		}
		prev_band_level[i] = sound_level_env;

		// shape
		drawContext.beginPath();
		var x = SOUND_METER_GAP + (SOUND_METER_WIDTH+SOUND_METER_GAP)*i;
		drawContext.rect(x, SOUND_METER_HEIGHT, SOUND_METER_WIDTH, -sound_level_env);

		// color
		var hue = Math.floor(255/10*i);
		var saturation = 255;
		var value = 255;
		var rgb = hsvToRgb(hue, saturation, value);
		drawContext.fillStyle='rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; 
		drawContext.fill();
	}

}

function draw_MyOwn() {


	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = calc_octaveband_my_own(data_array)

	// display the loudness value (this is for verifying if the level is correctly computed.)
	loudness = octaveband_level_db[0];
	vis_value.innerHTML = '32Hz-Band Level (dB): ' + loudness + ' dB';

	// color
	if ( (data_array[4] > -25) && (pre + 3<data_array[4]) ){
		a = a + 50;
		a = a % 360;
		//loudness = data_array[4];
	}
	pre = data_array[4];

	// ratation
	if (data_array[2]>-25){
		theta = theta + Math.PI/300;
		//loudness = data_array[3];
	}

	// 2d canvas context
	var drawContext = vis_view.getContext('2d');

	// canvas size
	if (k == 1){
		console.log('H = 720')
		HEIGHT = 720;
		vis_view.height = 720;
		k = 0;
	}

	// fill rectangular (for the entire canvas)
	//drawContext.fillStyle = 'rgb(0,0,0)';
	//drawContext.fillRect(0, 0, WIDTH, HEIGHT);
	drawContext.fillStyle = 'rgb(255,255,255)';
	drawContext.fillRect(2, 2, WIDTH-4,HEIGHT-4);

	// total value
	var total_value = 0;
	for (var j=0; j<6; j++) {
		total_value = total_value + Math.pow(10,octaveband_level_db[j]/10);
	}
	total_value = 10.0*Math.log10(total_value);

	// alpha value for png image
	var alpha = (total_value-TOTAL_MIN)/(50-TOTAL_MIN)*1
	//drawContext.globalAlpha = alpha;

	//draw r
	for (var i=0; i<6; i++) {
		// fill samll circle (for the sound level)
		var r = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(-10-SOUND_METER_MIN_LEVEL)*(R/2);
		var r_env;

		///// asymmetric envelope detector
		// fill out here with your code
		// note that you can use "prev_band_level" array defined above to store the decaying level
		if (prev_r[i] < r){
			r_env = r;
		}
		else{
			r_env = prev_r[i] - R/256
		}
		prev_r[i] = r_env;
		//console.log(r_env);

		if (r_env < 0){
			r_env = 0;
		}
		// shape
		drawContext.beginPath();
		var x = (WIDTH/2) + R*Math.cos(Math.PI/2 + Math.PI/3*i + theta)
		var y = (HEIGHT/2) - R*Math.sin(Math.PI/2 + Math.PI/3*i + theta)
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

function playMic()
{
    if (filePlayOn) {
    	turnOffFileAudio();
    }

    if (micOn) {
		turnOffMicAudio();
		return;
    }

	if (!navigator.getUserMedia)
		navigator.getUserMedia = (navigator.getUserMedia({audio: true}) || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
							  
	if (!navigator.getUserMedia)
		alert("Error: getUserMedia not supported!");
						
	// get audio input streaming 				 
	navigator.getUserMedia({audio: true}, onStream, onStreamError)

	micOn = true;

	var mic = document.getElementById("micInput");
	mic.innerHTML = 'Mic Off'
}


// success callback
function onStream(stream) {
    mediaSourceNode = context.createMediaStreamSource(stream);
	
	// Connect graph
	mediaSourceNode.connect(analyser);
						  
	// visualize audio animation
    animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
}

// errorCallback			 
function onStreamError(error) {
	console.error('Error getting microphone', error);

	micOn = false;
}


function playFile() {
    if (filePlayOn) {
    	turnOffFileAudio();
    	return;
    }

    if (micOn) {
		turnOffMicAudio();
    }

    sourceNode = context.createBufferSource();

    sourceNode.buffer = demo_buffer;
    sourceNode.connect(context.destination);

    // music end
    sourceNode.onended = turnOffFileAudio;

    sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
    animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	filePlayOn = true;
	
	var demoAudio = document.getElementById("demoAudio");
	demoAudio.innerHTML = 'Demo Audio Stop'
}


function turnOffMicAudio() {
	var mic = document.getElementById("micInput");		
	mic.innerHTML = 'Mic On'
	mediaSourceNode = null;
	micOn = false;

	stopAnimation();
}

function turnOffFileAudio() {
	var demoAudio = document.getElementById("demoAudio");
	demoAudio.innerHTML = 'Demo Audio Play'
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




