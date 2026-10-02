(function(){
if(document.getElementById('mini-radio')) return;
const tracks=[
["The Stars and Stripes Forever","https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Stars_and_Stripes_Forever_-_U.S._Army_Band.ogg"],
["The Thunderer","https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Thunderer_-_U.S._Army_Band.ogg"],
["National Emblem March","https://commons.wikimedia.org/wiki/Special:Redirect/file/National_Emblem_-_U.S._Army_Band.ogg"],
["The Invincible Eagle","https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Invincible_Eagle_-_U.S._Army_Band.ogg"],
["Washington Post March","https://commons.wikimedia.org/wiki/Special:Redirect/file/Washington_Post_March_-_U.S._Army_Band.ogg"]
];
const wrap=document.createElement('div');wrap.className='mini-radio';wrap.id='mini-radio';wrap.setAttribute('aria-label','Airborne Radio music player');wrap.innerHTML='<div class="mini-radio-title"><span>82ND RADIO</span><b id="mini-track-name"></b></div><div class="mini-radio-controls"><button id="mini-prev" type="button" aria-label="Previous track">◀</button><button id="mini-play" type="button" aria-label="Play or pause">▶</button><button id="mini-next" type="button" aria-label="Next track">▶</button></div><div class="mini-radio-volume"><span>VOL</span><input id="mini-volume" type="range" min="0" max="1" step="0.01" value="0.65" aria-label="Volume"></div>';
document.body.appendChild(wrap);const audio=document.createElement('audio');audio.id='mini-audio';audio.preload='metadata';document.body.appendChild(audio);
let index=Number(localStorage.getItem('airborneRadioTrack')||0);if(!Number.isFinite(index)||index<0||index>=tracks.length)index=0;
const name=wrap.querySelector('#mini-track-name'),play=wrap.querySelector('#mini-play'),volume=wrap.querySelector('#mini-volume');
function load(i,auto){index=(i+tracks.length)%tracks.length;localStorage.setItem('airborneRadioTrack',index);name.textContent=tracks[index][0];audio.src=tracks[index][1];audio.volume=Number(volume.value);if(auto)audio.play().catch(()=>{});}
wrap.querySelector('#mini-prev').onclick=()=>load(index-1,true);wrap.querySelector('#mini-next').onclick=()=>load(index+1,true);play.onclick=async()=>{if(audio.paused){try{await audio.play()}catch(e){}}else audio.pause()};volume.oninput=()=>{audio.volume=Number(volume.value);localStorage.setItem('airborneRadioVolume',volume.value)};audio.onplay=()=>play.textContent='❚❚';audio.onpause=()=>play.textContent='▶';audio.onended=()=>load(index+1,true);load(index,false);const saved=localStorage.getItem('airborneRadioVolume');if(saved!==null){volume.value=saved;audio.volume=Number(saved)}
})();