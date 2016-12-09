// audio
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var sourceNode = null;
var analyser = null;
var context; // audio context
var myAudioBuffer = null;
var filePlayOn = false;
var data_array;

// frequency band
var lower_freqs = [22,66,176,704,1408,2816,5632,11264];
var upper_freqs = [66,176,704,1408,2816,5632,11264,22050];

// Visualizer
var vis_view;
var WIDTH = 480;
var HEIGHT = 480;
var SOUND_METER_MIN_LEVEL = -72.0;  // dB
var a = 0; // visualizer hue value
var num = lower_freqs.length; // band number
var prev_r = new Array(num); 
for (var i=0; i <num; i++ ) {
	prev_r[i] = 0;
}
var R=WIDTH/3;
var maxdB = 20; //max dB for peaking filter
var k=0; // mouse up

// camera
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
var video;
var camera;
var videoContext;
var back_videoContext;
var cw;
var ch;
var random_interval; // setinterval function's name

// draw camera
var camera_filter="clear"; // no filter at first
var screen_num='1screen';
var video_filters=[];
var video_screen_num=[];
var draw_interval;
var screen_interval;
var invert=0;
var sepia=0;

// bpm
var beat_interval;
var bpm;

window.onload=function(){
	var control = document.getElementById("fileChooseInput");
	control.addEventListener("change", fileChanged, false);

	var demoAudio = document.getElementById("demoAudio");
	demoAudio.addEventListener("click", playFile, false);

	var audioBPM = document.getElementById("bpm");
	audioBPM.addEventListener("click",findBPM, false);

	// visualizer
	vis_view = document.getElementById("loudnessView");
	vis_view.width =  WIDTH;
	vis_view.height = HEIGHT;

	// camera
	camera = document.getElementById("videoElement");
	video = document.querySelector("#videoElement");
	if (navigator.getUserMedia) {
		navigator.getUserMedia({video: true}, handleVideo, videoError);
	}
	videoCanvas = document.getElementById("videoCanvas");
	videoContext = videoCanvas.getContext('2d');
	back_videoCanvas = document.getElementById("back_videoCanvas");
	back_videoContext = back_videoCanvas.getContext('2d');
	cw=videoCanvas.width;
	ch=videoCanvas.height;
	camera.addEventListener('play',function(){
		draw_camera(camera_filter,screen_num)
	},false);

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

// filter add
function filter_add(filter){
	if (document.getElementById(filter).checked){
		video_filters.push(filter);
	}
	else{
		var index=video_filters.indexOf(filter);
		video_filters.splice(index,1);
	}
}
function screen_num_add(screen_num){
	if (document.getElementById(screen_num).checked){
		video_screen_num.push(screen_num);
	}
	else{
		var index=video_screen_num.indexOf(screen_num);
		video_screen_num.splice(index,1);
	}
}
// camera
function handleVideo(stream) {
	video.src = window.URL.createObjectURL(stream);
}
function videoError(e) {
	console.log("video error");
}

var pre = SOUND_METER_MIN_LEVEL;
var gScale_env=0;
var saturate=1;
var f=1; //0 if first beat passed

function music_start() {
	// get samples 
	data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	// camera gray scale
	var gScale = data_array[4] + 26.5

	// color and filter with Kick
	if ( (data_array[4] > -25) && (pre + 5<data_array[4]) ){
		a = a + 100;
		a = a % 360;
		//saturate = 8;
		gScale_env = gScale;
		//first beat pass
		if (f==1){
			random_interval = setInterval(random_select,4*1000*beat_interval)
		}
		f=0;
	}
	else{
		gScale_env = gScale_env - 0.5;
		//saturate = saturate-0.3;
		if (gScale_env<0){
			gScale_env = 0;
		}
		//if (saturate<1){
		//	saturate=1;
		//}
	}
	pre = data_array[4];
	document.getElementById("videoCanvas").style.filter="blur(" + gScale_env +"px) saturate(" + saturate +") invert(" + invert +"%) sepia(" + sepia + "%)"

	draw_visualizer()
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

	filter.connect(analyser);

	// visualize audio animation 21.533msec = 0.021533sec
    animation_id = setInterval(music_start, context.sampleRate/analyser.fftSize);

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

    // camera filter
    document.getElementById("videoElement").style.filter="initial"
    saturate=1;
    sepia=0;
    invert=0;
    f=1;

	stopAnimation();
}

function stopAnimation() { 
    clearInterval(animation_id);
    clearInterval(random_interval);
}
