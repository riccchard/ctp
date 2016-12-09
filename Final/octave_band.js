function calc_octaveband_my_own(input_array) {
	var lower_freqs = [22,66,176,704,1408,2816,5632,11264];
	var upper_freqs = [66,176,704,1408,2816,5632,11264,22050];
	var num = lower_freqs.length;
	//var center_freqs = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

	// compute FFT power (linear scale) 
	var fft_power = new Array(input_array.length);
	for (var i = 0; i < input_array.length; i++) {
		fft_power[i] = Math.pow(10.0, input_array[i]/10.0);
	}

	var band_power = new Array(num);

	for (var i = 0; i < num; i++) {

		var lower_bin = Math.floor(lower_freqs[i]/22050.0*input_array.length);
		var upper_bin = Math.floor(upper_freqs[i]/22050.0*input_array.length);
		//var center_bin = Math.ceil(center_freqs[i]/22050.0*input_array.length);

		if (upper_bin >= fft_power.length) {
			upper_bin = fft_power.length-1;
		}

		band_power[i] = 0;
		for (var j=lower_bin; j<upper_bin; j++ ) {
			band_power[i] = band_power[i] + fft_power[j];
		}
	}


	var band_level_db = new Array(band_power.length);

	for (var i = 0; i < band_level_db.length; i++) {
		band_level_db[i] = 10.0*Math.log10(band_power[i]);

		if (band_level_db[i] < SOUND_METER_MIN_LEVEL) {
			band_level_db[i] = SOUND_METER_MIN_LEVEL;
		}

	}

	return band_level_db;
}