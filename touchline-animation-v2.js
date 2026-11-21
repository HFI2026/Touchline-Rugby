/* Touchline Motion Studio V2 — two-sided rugby animation designer */
(function(){
'use strict';
const previousRender=render, X=window;
let selectedSide='attack', selectedNumber=1, dragging=null, playing=false, requestId=0, timeAt=0, playhead=0, speed=1, loop=false, showTrails=true, lastMoveId='', prevTime=0;
const MAX=24;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const clone=o=>JSON.parse(JSON.stringify(o));
const escapeText=v=>esc(v);
const clock=()=>performance.now();
function defaultFormation(n,side){
  const out={};const attackers=side==='attack';
  const core=Math.min(8,n);
  for(let i=1;i<=n;i++){
    let x,y;
    if(i<=core){x=attackers?23+(i%3)*4:54+(i%3)*4;y=29+Math.floor((i-1)/3)*15+(i%3)*3}
    else {const j=i-core,wide=n-core;x=(attackers?31:62)+j*(attackers?51:27)/Math.max(1,wide);y=26+(j%3)*18}
    out[i]={x:clamp(x,5,95),y:clamp(y,8,92)};
  }return out;
}
function activeMove(){
 state.plays??=[];if(!Array.isArray(state.plays))state.plays=[];
 if(!state.plays.length)state.plays.push({id:uid('play'),name:'New attacking move',description:'',frames:[{positions:defaultFormation(size(),'attack'),opposition:defaultFormation(size(),'defence'),ball:{x:33,y:54}}]});
 let p=state.plays.find(x=>x.id===state.activePlay)||state.plays[0];state.activePlay=p.id;
 if(!Array.isArray(p.frames)||!p.frames.length)p.frames=[{positions:defaultFormation(size(),'attack')}];
 for(const f of p.frames){
   if(!f.positions||typeof f.positions!=='object')f.positions=defaultFormation(size(),'attack');
   if(!f.opposition||typeof f.opposition!=='object')f.opposition=defaultFormation(size(),'defence');
   if(!f.ball||!Number.isFinite(Number(f.ball.x))||!Number.isFinite(Number(f.ball.y))){
      const q=f.positions[9]||f.positions[1]||{x:35,y:50};
      f.ball={x:q.x+2,y:q.y};
   }
 }
 return p;
}
function frameCount(){return activeMove().frames.length}
function frameAt(i){const p=activeMove();return p.frames[clamp(i,0,p.frames.length-1)]}
function pos(f,side,num){
  if(side==='ball')return f.ball;
  const key=side==='attack'?'positions':'opposition';const map=f[key];
  if(!map[num])map[num]=defaultFormation(size(),side)[num]||{x:50,y:50};
  return map[num];
}
function mix(a,b,t){return a+(b-a)*t}
function interpolated(t){
 const p=activeMove(),last=p.frames.length-1,step=clamp(Math.floor(t),0,last-1),u=last===0?0:clamp(t-step,0,1),a=frameAt(step),b=frameAt(Math.min(last,step+1));
 const r={attack:{},defence:{},ball:{}};
 for(const side of ['attack','defence'])for(let i=1;i<=size();i++){
  const q=pos(a,side,i),w=pos(b,side,i);
  r[side][i]={x:mix(q.x,w.x,u),y:mix(q.y,w.y,u)};
 }
 const z=pos(a,'ball'),v=pos(b,'ball');r.ball={x:mix(z.x,v.x,u),y:mix(z.y,v.y,u)};return r;
}
function makeTrail(f1,f2,side,i){
 const p=pos(f1,side,i),q=pos(f2,side,i);
 if(Math.hypot(p.x-q.x,p.y-q.y)<1)return '';
 const colour=side==='attack'?'#e7e9da':'#ffb5af';
 return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" stroke="'+colour+'" stroke-width=".65" stroke-dasharray="1.7 1.3" opacity=".68"/>';
}
function trails(){
 if(!showTrails)return '';
 const p=activeMove(),i=clamp(Number(state.activeFrame)||0,0,p.frames.length-1);
 if(i>=p.frames.length-1)return '';
 let paths='';
 for(const side of ['attack','defence'])for(let n=1;n<=size();n++)paths+=makeTrail(p.frames[i],p.frames[i+1],side,n);
 const a=p.frames[i].ball,b=p.frames[i+1].ball;
 if(Math.hypot(a.x-b.x,a.y-b.y)>1)paths+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#ffe3a5" stroke-width=".8" stroke-dasharray="2 1.2"/>';
 return '<svg class="tl2-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+paths+'</svg>';
}
function marker(side,i,point){
 const tag=side==='ball'?'●':i,selected=(selectedSide===side && selectedNumber===i);
 const name=side==='ball'?'Ball':side==='attack'?'Attacker '+i:'Defender '+i;
 return '<button type="button" class="tl2-dot '+side+(selected?' is-selected':'')+'" data-side="'+side+'" data-number="'+i+'" aria-label="Move '+name+'" style="left:'+point.x+'%;top:'+point.y+'%">'+tag+'</button>';
}
function board(){const f=interpolated(playhead);let dots='';
 for(let i=1;i<=size();i++)dots+=marker('defence',i,f.defence[i]);
 for(let i=1;i<=size();i++)dots+=marker('attack',i,f.attack[i]);
 dots+=marker('ball',0,f.ball);
 return '<div class="tl2-pitch" id="tl2Pitch" role="group" aria-label="Editable rugby tactics pitch">'+
 '<div class="tl2-fieldlines"><div class="tl2-tryline left"></div><div class="tl2-tryline right"></div><div class="tl2-twenty left"></div><div class="tl2-twenty right"></div><div class="tl2-half"></div><div class="tl2-sideline top"></div><div class="tl2-sideline bottom"></div><div class="tl2-centre"></div></div>'+
 trails()+dots+'</div>';
}
function frameName(i){let s='';let j=i;do{s=String.fromCharCode(65+j%26)+s;j=Math.floor(j/26)-1}while(j>=0);return s}
function studioPage(){
 const p=activeMove(),len=p.frames.length,frame=clamp(Number(state.activeFrame)||0,0,len-1);
 const track=Array.from({length:len},(_,i)=>'<button class="tl2-key '+(frame===i?'selected':'')+'" onclick="tl2Step('+i+')">'+frameName(i)+'</button>').join('');
 return head('Move animator','Build and demonstrate rugby plays with moving attackers, defenders and the ball.')+
 '<section class="tl2-panel"><div class="tl2-heading"><div><div class="eyebrow">Touchline coaching studio</div><h2>Rugby move designer</h2></div><button class="btn alt sm" onclick="tl2New()">+ New move</button></div>'+
 '<div class="tl2-topbar"><select class="field" aria-label="Select saved move" id="tl2MoveSelect" onchange="tl2Choose(this.value)">'+state.plays.map(m=>'<option '+(m.id===p.id?'selected':'')+' value="'+escapeText(m.id)+'">'+escapeText(m.name||'Untitled move')+'</option>').join('')+'</select><button class="btn alt sm" onclick="tl2Duplicate()">Duplicate</button><button class="btn alt sm" onclick="tl2Delete()">Delete</button></div>'+
 '<div class="tl2-grid"><div class="tl2-main"><div class="tl2-pitchbar"><div class="tl2-legend"><span><i class="tl2-legattack"></i>'+escapeText(state.team||'Your team')+'</span><span><i class="tl2-legdefence"></i>Opposition</span><span><i class="tl2-legball"></i>Ball</span></div><button class="btn alt sm" onclick="tl2Fullscreen()">Expand pitch</button></div>'+
 board()+'<div class="tl2-hint">Drag a numbered player or the ball to a position. Move to the next step and drag again to create movement.</div>'+
 '<div class="tl2-playerbar"><label><input type="checkbox" '+(showTrails?'checked':'')+' onchange="tl2Trails(this.checked)"> Show movement guides</label><div class="tl2-selecthint">Editing: <b id="tl2SelectedLabel">'+(selectedSide==='ball'?'Ball':selectedSide==='attack'?'Attacker #'+selectedNumber:'Defender #'+selectedNumber)+'</b></div></div>'+
 '</div><aside class="tl2-sidebar"><div class="fieldbox"><label class="label" for="tl2Title">Move name</label><input class="field" maxlength="100" id="tl2Title" value="'+escapeText(p.name)+'" oninput="tl2SaveMeta(\'name\',this.value)"></div>'+
 '<div class="fieldbox"><label class="label" for="tl2Description">Description / coaching instructions</label><textarea id="tl2Description" class="field" rows="4" maxlength="800" oninput="tl2SaveMeta(\'description\',this.value)">'+escapeText(p.description||'')+'</textarea></div>'+
 '<div class="tl2-section"><div class="label">Animation steps</div><div class="tl2-track">'+track+'</div><div class="tl2-stepbar"><button class="btn alt sm" onclick="tl2Add()">+ Next step</button><button class="btn alt sm" onclick="tl2Remove()" '+(len<2?'disabled':'')+'>Remove step</button></div><p class="tl2-muted">Step '+frameName(frame)+' of '+len+'. Each step contains every player and ball position.</p></div>'+
 '<div class="tl2-section"><div class="label">Playback</div><div class="tl2-transport"><button class="btn" id="tl2Play" onclick="tl2Toggle()">'+(playing?'Ⅱ Pause':'▶ Play')+'</button><button class="btn alt sm" onclick="tl2Restart()">↺ Restart</button></div>'+
 '<input type="range" class="tl2-scrub" min="0" max="'+Math.max(0,(len-1)*100)+'" value="'+Math.round(playhead*100)+'" id="tl2Seek" aria-label="Playback position" oninput="tl2SeekTo(Number(this.value)/100)">'+
 '<div class="tl2-time"><span id="tl2Time">'+(playhead).toFixed(1)+' / '+(len-1)+' steps</span><span>All markers animate together</span></div>'+
 '<div class="tl2-options"><label class="fieldbox"><span class="label">Speed</span><select class="field" onchange="tl2Speed(Number(this.value))">'+[.5,1,1.5,2].map(v=>'<option value="'+v+'" '+(speed===v?'selected':'')+'>'+v+'×</option>').join('')+'</select></label>'+
 '<label class="tl2-loop"><input type="checkbox" '+(loop?'checked':'')+' onchange="tl2Loop(this.checked)"> Loop move</label></div></div>'+
 '<div class="tl2-instructions"><b>Creating a move</b><ol><li>Arrange the players in step A.</li><li>Tap <b>Next step</b> to copy their positions.</li><li>Drag players and the ball to the next positions.</li><li>Repeat for more phases, then press Play.</li></ol></div>'+
 '</aside></div></section>';
}
function moveDots(mapping){
 const pitch=document.getElementById('tl2Pitch');if(!pitch)return;
 pitch.querySelectorAll('.tl2-dot').forEach(el=>{
  const side=el.dataset.side,num=Number(el.dataset.number),p=side==='ball'?mapping.ball:mapping[side][num];if(!p)return;
  el.style.left=p.x+'%';el.style.top=p.y+'%';
 });
 const range=document.getElementById('tl2Seek');if(range)range.value=Math.round(playhead*100);
 const stamp=document.getElementById('tl2Time');if(stamp)stamp.textContent=playhead.toFixed(1)+' / '+(frameCount()-1)+' steps';
}
function pause(){playing=false;cancelAnimationFrame(requestId);requestId=0;const btn=document.getElementById('tl2Play');if(btn)btn.textContent='▶ Play'}
function tick(now){
 if(!playing)return;
 const dt=clamp((now-prevTime)/1000,0,.1);prevTime=now;
 playhead+=dt*speed/1.25;
 const last=frameCount()-1;
 if(playhead>=last){
  if(loop){playhead=0;state.activeFrame=0}
  else{playhead=last;state.activeFrame=last;pause()}
 }
 moveDots(interpolated(playhead));
 if(playing)requestId=requestAnimationFrame(tick);
}
X.tl2Toggle=function(){
 const len=frameCount();if(len<2){alert('Add a second step to animate your move.');return}
 if(playing){pause();return}
 if(playhead>=len-1)playhead=0;
 playing=true;prevTime=clock();const btn=document.getElementById('tl2Play');if(btn)btn.textContent='Ⅱ Pause';requestId=requestAnimationFrame(tick);
};
X.tl2Restart=function(){pause();playhead=0;state.activeFrame=0;render()};
X.tl2SeekTo=function(n){pause();playhead=clamp(n,0,frameCount()-1);state.activeFrame=Math.min(Math.floor(playhead),frameCount()-1);moveDots(interpolated(playhead))};
X.tl2Speed=function(n){speed=[.5,1,1.5,2].includes(n)?n:1};
X.tl2Loop=function(v){loop=!!v};
X.tl2Trails=function(v){showTrails=!!v;render()};
X.tl2Step=function(i){pause();const len=frameCount();state.activeFrame=clamp(i,0,len-1);playhead=state.activeFrame;save();render()};
X.tl2Add=function(){pause();const m=activeMove();if(m.frames.length>=MAX){alert('Moves are limited to '+MAX+' steps.');return}const i=clamp(Number(state.activeFrame)||0,0,m.frames.length-1);m.frames.splice(i+1,0,clone(m.frames[i]));state.activeFrame=i+1;playhead=i+1;save();render()};
X.tl2Remove=function(){pause();const m=activeMove();if(m.frames.length<=1)return;m.frames.splice(state.activeFrame,1);state.activeFrame=clamp(state.activeFrame,0,m.frames.length-1);playhead=state.activeFrame;save();render()};
X.tl2New=function(){pause();const m={id:uid('play'),name:'Untitled move',description:'',frames:[{positions:defaultFormation(size(),'attack'),opposition:defaultFormation(size(),'defence'),ball:{x:28,y:51}}]};state.plays.push(m);state.activePlay=m.id;state.activeFrame=0;playhead=0;save();render()};
X.tl2Duplicate=function(){pause();const c=clone(activeMove());c.id=uid('play');c.name=(c.name||'Move')+' — copy';state.plays.push(c);state.activePlay=c.id;state.activeFrame=0;playhead=0;save();render()};
X.tl2Delete=function(){if(!confirm('Delete this move and every animation step?'))return;pause();const id=activeMove().id;state.plays=state.plays.filter(x=>x.id!==id);state.activePlay=state.plays[0]?.id;state.activeFrame=0;playhead=0;activeMove();save();render()};
X.tl2Choose=function(id){pause();if(!state.plays.some(p=>p.id===id))return;state.activePlay=id;state.activeFrame=0;playhead=0;save();render()};
X.tl2SaveMeta=function(key,value){if(!['name','description'].includes(key))return;activeMove()[key]=String(value).slice(0,key==='name'?100:800);save()};
X.tl2Fullscreen=function(){const el=document.getElementById('tl2Pitch');if(!el)return;if(!document.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>{});else if(document.exitFullscreen)document.exitFullscreen()};
function attach(){
 const pitch=document.getElementById('tl2Pitch');if(!pitch)return;
 pitch.querySelectorAll('[data-side]').forEach(el=>{
  el.addEventListener('pointerdown',ev=>{
    if(playing)pause();
    ev.preventDefault();const side=el.dataset.side,n=Number(el.dataset.number);
    selectedSide=side;selectedNumber=n;
    pitch.querySelectorAll('.tl2-dot').forEach(d=>d.classList.toggle('is-selected',d===el));
    const label=document.getElementById('tl2SelectedLabel');if(label)label.textContent=side==='ball'?'Ball':(side==='attack'?'Attacker #':'Defender #')+n;
    const idx=clamp(Number(state.activeFrame)||0,0,frameCount()-1);
    const f=frameAt(idx);dragging={side,n,el,idx,pointer:ev.pointerId};
    el.setPointerCapture(ev.pointerId);
  });
  el.addEventListener('pointermove',ev=>{
   if(!dragging||dragging.el!==el||ev.pointerId!==dragging.pointer)return;
   const r=pitch.getBoundingClientRect();const x=clamp(100*(ev.clientX-r.left)/r.width,4,96),y=clamp(100*(ev.clientY-r.top)/r.height,6,94);
   const f=frameAt(dragging.idx),q=pos(f,dragging.side,dragging.n);q.x=+x.toFixed(2);q.y=+y.toFixed(2);
   el.style.left=q.x+'%';el.style.top=q.y+'%';
  });
  function done(ev){if(!dragging||dragging.el!==el||ev.pointerId!==dragging.pointer)return;dragging=null;save()}
  el.addEventListener('pointerup',done);el.addEventListener('pointercancel',done);
 });
}
const rootRender=render;
render=function(){
 if(page==='tactics'){activeMove();$('view').innerHTML=studioPage();attach();return}
 rootRender();
};
X.touchlineAnimationVersion='2.0';
})();