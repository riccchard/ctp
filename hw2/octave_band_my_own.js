function calc_octaveband_my_own(input_array) {
	var lower_freqs = [22,44,88,355,1420,3550];
	var upper_freqs = [44,88,355,1420,3550,22720];
	//var center_freqs = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

	// compute FFT power (linear scale) 
	var fft_power = new Array(input_array.length);
	for (var i = 0; i < input_array.length; i++) {
		fft_power[i] = Math.pow(10.0, input_array[i]/10.0);
	}

	var band_power = new Array(6);


	for (var i = 0; i < 6; i++) {
		band_power[i] = 0;
		for (var j = Math.floor(lower_freqs[i]/22.1875); j < Math.floor(upper_freqs[i]/22.1875); j++){
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