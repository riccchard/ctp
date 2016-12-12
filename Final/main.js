// audio
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
var sourceNode = null;
var analyser = null;
var context; // audio context
var offlineContext // for BPM
var myAudioBuffer = null;
var source;
var filePlayOn = false;
var data_array;
var format;
var slider_value;

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
var contrast=100;

var back = document.createElement('canvas');
var backContext = back.getContext('2d');

// bpm
var beat_interval;
var bpm;
var count_value=8;
var loading_interval;
var loading_i;

window.onload=function(){
	var control = document.getElementById("fileChooseInput");
	control.addEventListener("change", fileChanged, false);

	var demoAudio = document.getElementById("demoAudio");
	demoAudio.addEventListener("click", playFile, false);

	var count = document.getElementById("count_change");
	count.addEventListener("click",count_change,false);

	var blur_slider = document.getElementById("blur_effect_threshold");
	slider_value = blur_slider.value;
	blur_slider.addEventListener("change", changeSliderValue, false);
	document.getElementById("blur_value").innerHTML=blur_slider.value+"dB";

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
	videoCanvas.width=480;
	videoCanvas.height=360;
	videoContext = videoCanvas.getContext('2d');

	back_videoCanvas = document.getElementById("back_videoCanvas");
	back_videoCanvas.width=480;
	back_videoCanvas.height=360;
	back_videoContext = back_videoCanvas.getContext('2d');

	back.width=480;
	back.height=360;

	cw = videoCanvas.width;
	ch = videoCanvas.height;


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
	var dot_locate = e.target.value.lastIndexOf(".");
	format = e.target.value.slice(dot_locate+1);
	// video
	if ((format == "mp4") || (format == "WebM") || (format == "ogg")){
		camera = document.getElementById("uploaded_video");
		camera.width = 480;
		var isError = camera.canPlayType==='no';
		if (isError){
			console.log("error")
			return
		}
		console.log("Video has been loaded")
		var fileURL = URL.createObjectURL(file)
		camera.src = fileURL;
	}
	else{
		camera = document.getElementById("videoElement");
		videoCanvas.height = 360;
		back_videoCanvas.height = 360;
		back.height = 360;
		ch = 360;		
	}
	var fileReader = new FileReader();
	fileReader.onload = fileLoaded;
	fileReader.readAsArrayBuffer(file);
}

function fileLoaded(e){
	context.decodeAudioData(e.target.result, function(buffer) {
		myAudioBuffer = buffer;
		offlineContext = new OfflineContext(2, myAudioBuffer.length, 44100);
		source = offlineContext.createBufferSource();
		source.buffer = myAudioBuffer;
		findBPM()
	});
	loading_i=1;
	loading_interval = setInterval(function(){
		var loading = "L O A D I N G"
		document.getElementById("bpm_output").innerHTML=loading.slice(0,loading_i);
		loading_i = loading_i + 1;
		if (loading_i>13){
			loading_i=1;
		}
	},125)
	
	console.log("Audio has been loaded.")
}
// slider value
function changeSliderValue(e){
	slider_value = e.target.value;
	document.getElementById("blur_value").innerHTML=slider_value+"dB";
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

function check_all_toggle(checked){
	var checkboxes = document.getElementsByName('check');
	for (var i=0; i<checkboxes.length; i++){
		if (checkboxes[i].checked !== checked){
			checkboxes[i].checked = checked;
			filter_add(checkboxes[i].id);
		}
	}
}
function check_all_toggle2(checked){
	var checkboxes2 = document.getElementsByName('check2');
	for (var i=0; i<checkboxes2.length; i++){
		if (checkboxes2[i].checked !== checked){
			checkboxes2[i].checked = checked;
			screen_num_add(checkboxes2[i].id);			
		}
	}
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
	if ( (data_array[4] > slider_value) && (pre + 5<data_array[4]) ){
		a = a + 100;
		a = a % 360;
		gScale_env = gScale;
		//first beat pass
		if (f==1){
			random_select();
			random_interval = setInterval(random_select,count_value*1000*beat_interval)
		}
		f=0;
	}
	else{
		gScale_env = gScale_env - 0.5;
		//saturate = saturate-0.3;
		if (gScale_env<0){
			gScale_env = 0;
		}
		else if (gScale_env>10){
			console.log(gScale_env)
			gScale_env=10;
		}
	}
	pre = data_array[4];
	document.getElementById("videoCanvas").style.filter="blur(" + gScale_env +"px) saturate(" + saturate +") invert(" + invert +"%) sepia(" + sepia + "%) contrast(" + contrast +"%)";
	draw_visualizer()
}

function playFile() {
    if (filePlayOn) {
    	turnOffFileAudio();
    	return;
    }
    // video play
    if ((format == "mp4") || (format == "WebM") || (format == "ogg")){
    	camera.style.display="block";
		var nH = camera.offsetHeight;
		videoCanvas.height = nH;
		back_videoCanvas.height = nH;
		back.height = nH;
		ch = nH;
		camera.style.display="none";
    	camera.currentTime = 0;
    	camera.play();
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
	demoAudio.innerHTML = 'Stop'
}

function turnOffFileAudio() {
	// video stop
    if ((format == "mp4") || (format == "WebM") || (format == "ogg")){
    	camera.pause();
    }
	var demoAudio = document.getElementById("demoAudio");
	demoAudio.innerHTML = 'Play'
	if (sourceNode != null){
		sourceNode.stop();
	    sourceNode = null;
	}
    filePlayOn = false;

    // camera filter
    draw_camera('clear','1screen');
    f=1;

	stopAnimation();
}

function stopAnimation() { 
    clearInterval(animation_id);
    clearInterval(random_interval);
}
