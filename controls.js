var x = document.getElementById("myAudio");
var audio = new Audio('./assets/poc.mp3');
enableAudio();

function enableAudio() { 
  x.loop = true;
  x.load();
  x.play();
  document.getElementById("pauseb").style.display = "block";
  document.getElementById("playb").style.display = "none";

} 

function disableAudio() { 
    x.loop = false;
    x.load();
    x.pause();
    document.getElementById("pauseb").style.display = "none";
    document.getElementById("playb").style.display = "block";
  } 