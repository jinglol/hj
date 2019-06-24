
var options = {
controls: 'control',
preload: 'auto',
controlBar: {
    "volumeBar": false,
    "volumePanel":false,
    "currentTimeDisplay":true,
     "TimeDivider":true,
     "DurationDisplay":true
}
};
var time=20;

var player = videojs('video2', options, function onPlayerReady() {
videojs.log('播放器已经准备好了!');
// In this context, `this` is the player that was created by Video.js.<br>  // 注意，这个地方的上下文， `this` 指向的是Video.js的实例对像player
this.play();

});
