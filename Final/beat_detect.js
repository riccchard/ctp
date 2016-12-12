// original code from beats-audio-api-gh-pages
function getPeaks(data) {

  var partSize = 22050,
      parts = data[0].length / partSize,
      peaks = [];

  for (var i = 0; i < parts; i++) {
    var max = 0;
    for (var j = i * partSize; j < (i + 1) * partSize; j++) {
      var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
      if (!max || (volume > max.volume)) {
        max = {
          position: j,
          volume: volume
        };
      }
    }
    peaks.push(max);
  }

  // We then sort the peaks according to volume...

  peaks.sort(function(a, b) {
    return b.volume - a.volume;
  });

  // ...take the loundest half of those...

  peaks = peaks.splice(0, peaks.length * 0.5);

  // ...and re-sort it back based on position.

  peaks.sort(function(a, b) {
    return a.position - b.position;
  });

  return peaks;
}

function getIntervals(peaks) {

  var groups = [];

  peaks.forEach(function(peak, index) {
    for (var i = 1; (index + i) < peaks.length && i < 10; i++) {
      var group = {
        tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
        count: 1
      };

      while (group.tempo < 90) {
        group.tempo *= 2;
      }

      while (group.tempo > 180) {
        group.tempo /= 2;
      }

      group.tempo = Math.round(group.tempo);

      if (!(groups.some(function(interval) {
        return (interval.tempo === group.tempo ? interval.count++ : 0);
      }))) {
        groups.push(group);
      }
    }
  });
  return groups;
}

function findBPM(){
  // Beats, or kicks, generally occur around the 100 to 150 hz range.
  // Below this is often the bassline.  So let's focus just on that.

  // First a lowpass to remove most of the song.

  var lowpass = offlineContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 150;
  lowpass.Q.value = 1;

  // Run the output of the source through the low pass.

  source.connect(lowpass);

  // Now a highpass to remove the bassline.

  var highpass = offlineContext.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 100;
  highpass.Q.value = 1;

  // Run the output of the lowpass through the highpass.

  lowpass.connect(highpass);

  // Run the output of the highpass through our offline context.

  highpass.connect(offlineContext.destination);

  // Start the source, and render the output into the offline conext.

  source.start(0);
  offlineContext.startRendering();

  offlineContext.oncomplete = function(e) {
  var buffer = e.renderedBuffer;
  var peaks = getPeaks([buffer.getChannelData(0), buffer.getChannelData(1)]);
  var groups = getIntervals(peaks);

  var top = groups.sort(function(intA, intB) {
    return intB.count - intA.count;
  }).splice(0, 5);

  bpm = top[0].tempo;
  beat_interval = 60/bpm //sec
  beatMax = Math.round(4*60*(1000/(context.sampleRate/analyser.fftSize))/bpm)
  clearInterval(loading_interval);
  document.getElementById("bpm_output").innerHTML=' BPM is '+bpm;
  };
}

function count_change(){
  clearInterval(random_interval)
  count_value = document.getElementById('count').value;
  f=1;
}