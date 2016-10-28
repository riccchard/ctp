# Homework 2: Music Visualizer


![Music Visualizer Example 1](./music_visualizer1.png)
![Music Visualizer Example 2](./music_visualizer2.png)


Your second mission is designing music visualizers that convert music audio to colorful animations. The start-up code is provided so that you can easily work on it. To begin with, you should change the filenames from "MusicVisualizer_startup.js" to "MusicVisualizer.js" and "octave_band_startup.js" to "octave_band.js".  


## Step #1 
In the first example, you are going to implement a 10-subband level meter, which visualizes the sound levels separately for each frequency band. You need to complete the following parts by filling out the empty part of the start-up code:

- Summarizing FFT spectrum to 10 subbands over frequency
- Adding an envelope follower to each subband level 


The subband frequencies are provided as a set of lower, center and upper frequencies in the "octave_band.js" file. In order to obtain the sound level of a subband, you should sum the magnitude powers that belong to the subband.  

The envelope follower takes the subband level as input. When the input level is greater than previously tracked level, it returns the input level right away. However, when the input level is less than the previously tracked level, it returns a decayed value from the tracked level by a factor of 0.95 or so. 


## Step #2
Write a visualiation function that takes the 10-subband levels and renders an interesting animation. Regarding drawing, you can refer to the following tutorials:  

- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes

You will be able to get some ideas from the following examples:

- https://en.wikipedia.org/wiki/Music_visualization
- https://en.wikipedia.org/wiki/Atari_Video_Music
- https://preziotte.com/partymode/

Other visualization examples (which are not directly related to homework but might be useful later)

- http://mattdesl.github.io/polartone/
- http://srchea.com/apps/sound-visualizer-web-audio-api-webgl/
- http://mdn.github.io/violent-theremin/
- https://airtightinteractive.com/demos/js/reactive/




