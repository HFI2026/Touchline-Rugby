/* Touchline Experience / Tactics 3.0 */
(function(){
'use strict';
const win=window, oldRender=render, oldHome=home;
let expanded=false,vertical=false,lastPage='home';win.touchlinePitchOrientation='landscape';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const clone=x=>JSON.parse(JSON.stringify(x));
function wholeTeam(n,side='attack'){
 const p={};
 for(let i=1;i<=n;i++){
  let x,y;
  if(i<=8){x=side==='attack'?25+(i%3)*5:68+(i%3)*4;y=22+Math.floor((i-1)/3)*21}
  else{x=side==='attack'?33+(i-9)*7:63+(i-9)*4;y=12+((i-9)%4)*22}
  p[i]={x:clamp(x,5,95),y:clamp(y,6,94)};
 }
 return p;
}
function setSide(map,values,n){
 for(let i=1;i<=n;i++)map[i]=values[i]||wholeTeam(n)[i];
 return map;
}
const at=(x,y)=>({x:Math.round(x*100)/100,y:Math.round(y*100)/100});
function backs(map,side,anchor,open){
 const dir=open==='right'?1:-1;
 const x=side==='attack'?anchor.x-8:anchor.x+9;
 for(const [j,k] of [9,10,12,13,14,15,11].entries()){
   if(k>size())continue;
   let py=anchor.y+dir*[5,16,26,36,46,23,-24][j];
   let px=x+(side==='attack'?-1:1)*[0,7,12,17,22,24,17][j];
   map[k]=at(clamp(px,5,95),clamp(py,7,93));
 }
}
function scrum(map,side,spot){
 const n=size(),ballX=side==='attack'?45:55,y=spot;
 const sx=side==='attack'?40:49;
 // 3-2-3 schematic: front-row #1 #2 #3, locks #4 #5, back row #6 #8 #7.
 const coords={1:[0,-8],2:[0,0],3:[0,8],4:[-6,-4],5:[-6,4],6:[-12,-8],8:[-12,0],7:[-12,8]};
 for(const [k,[dx,dy]] of Object.entries(coords)){if(+k>n)continue;map[k]=at(clamp(sx+(side==='attack'?dx:-dx),5,95),clamp(y+dy,6,94))}
 backs(map,side,{x:sx,y},y<40?'right':'left');
 return at(ballX,clamp(y+3,6,94));
}
function lineout(map,side,wing){
 const n=size(),y=wing==='left'?14:86,dir=wing==='left'?1:-1;
 const base=side==='attack'?43:56;
 const positions=[1,4,5,2,6,7,8,3];
 for(let j=0;j<positions.length;j++){const k=positions[j];if(k>n)continue;map[k]=at(base+(side==='attack'?-1:1)*(j%2)*4,clamp(y+dir*(6+j*5.7),7,93))}
 backs(map,side,{x:base,y:50},wing==='left'?'right':'left');
 if(n>=9)map[9]=at(base+(side==='attack'?-5:5),clamp(y+dir*12,6,94));
 return at(side==='attack'?base-1:base+1,y);
}
function phase(map,side,shape){
 const n=size(),bx=side==='attack'?38:67;
 // The 1-3-3-1 and 2-4-2 describe forwards by channel, not fixed jersey roles.
 const bands=shape==='1331'?[[1],[2,3,4],[5,6,7],[8]]:[[1,2],[3,4,5,6],[7,8]];
 let i=0;
 for(let g=0;g<bands.length;g++){
  const range=bands[g],y=12+g*(76/Math.max(1,bands.length-1));
  for(let j=0;j<range.length;j++){const k=range[j];if(k<=n)map[k]=at(bx+(side==='attack'?-1:1)*(7+j*4),clamp(y+(j-(range.length-1)/2)*7,6,94));i++}
 }
 backs(map,side,{x:bx,y:49},'right');
 return at(side==='attack'?bx-4:bx+4,47);
}
function defenceLine(map){
 const n=size();
 for(let i=1;i<=n;i++){
  if(i===15){map[i]=at(85,50);continue}
  if(i===11||i===14){map[i]=at(78,i===11?7:93);continue}
  const index=i<=10?i-1:i-3;map[i]=at(66+(index%3)*2,9+(index%12)*7.2);
 }
 return at(43,50);
}
function preset(id){
 const n=size(),attack=wholeTeam(n,'attack'),defence=wholeTeam(n,'defence');
 let ball=at(42,50),label='';
 if(id==='attack-open'){phase(attack,'attack','1331');label='General attacking shape'}
 else if(id==='attack-1331'){ball=phase(attack,'attack','1331');label='1–3–3–1 phase attack'}
 else if(id==='attack-242'){ball=phase(attack,'attack','242');label='2–4–2 phase attack'}
 else if(id==='defence-line'){ball=defenceLine(defence);label='Defensive line, backfield cover'}
 else {
  const match=id.match(/^(scrum|lineout)-(attack|defence)-(left|centre|right)$/);
  if(!match)return null;
  const [,type,side,where]=match;
  if(type==='scrum'){const y=where==='left'?24:where==='right'?76:50;ball=scrum(side==='attack'?attack:defence,side,y);scrum(side==='attack'?defence:attack,side==='attack'?'defence':'attack',y)}
  else {const wing=where==='right'?'right':'left';ball=lineout(side==='attack'?attack:defence,side,wing);lineout(side==='attack'?defence:attack,side==='attack'?'defence':'attack',wing)}
  label=(type==='scrum'?'Scrum':'Line-out')+' '+where+' · '+(side==='attack'?'attacking':'defending');
 }
 return {attack,defence,ball,label};
}
const choices=[
 ['General play',[['attack-open','Open-play attack'],['defence-line','Defensive line with cover'],['attack-1331','1–3–3–1 attack'],['attack-242','2–4–2 attack']]],
 ['Scrums',[['scrum-attack-left','Attacking · left'],['scrum-attack-centre','Attacking · centre'],['scrum-attack-right','Attacking · right'],['scrum-defence-left','Defending · left'],['scrum-defence-centre','Defending · centre'],['scrum-defence-right','Defending · right']]],
 ['Line-outs',[['lineout-attack-left','Attacking · left touchline'],['lineout-attack-right','Attacking · right touchline'],['lineout-defence-left','Defending · left touchline'],['lineout-defence-right','Defending · right touchline']]]
];
function active(){const arr=state.plays||[];return arr.find(p=>p.id===state.activePlay)||arr[0]}
win.tl3Preset=function(id){
 const p=active(),model=preset(id);if(!p||!model)return;
 if(!confirm('Apply '+model.label+' to the current animation step? Other steps remain unchanged.'))return;
 const idx=clamp(Number(state.activeFrame)||0,0,p.frames.length-1),frame=p.frames[idx];
 frame.positions=clone(model.attack);frame.opposition=clone(model.defence);frame.ball=clone(model.ball);
 p.preset=id;save();render();
};
win.tl3Orientation=function(){vertical=!vertical;win.touchlinePitchOrientation=vertical?'portrait':'landscape';render();};
win.tl3Expand=function(){
 const panel=document.querySelector('.tl2-panel');if(!panel)return;
 expanded=!expanded;panel.classList.toggle('tl3-expanded',expanded);document.body.classList.toggle('tl3-editor-active',expanded);
 const b=document.getElementById('tl3Expand');if(b)b.textContent=expanded?'✕ Close full screen':'⛶ Full-screen editor';
 if(expanded){panel.scrollTop=0;const root=panel.querySelector('.tl2-pitch');root?.scrollIntoView?.({block:'nearest'})}
};
win.tl3Close=function(){if(expanded)win.tl3Expand()};
function decorate(){
 const panel=document.querySelector('.tl2-panel');
 if(!panel)return;
 panel.classList.toggle('tl3-expanded',expanded);panel.classList.toggle('tl3-vertical',vertical);
 const top=panel.querySelector('.tl2-heading');
 if(top && !panel.querySelector('#tl3Expand')){
  const actions=document.createElement('div');actions.className='tl3-actions';
  const full=document.createElement('button');full.className='btn tl3-full';full.id='tl3Expand';full.textContent=expanded?'✕ Close full screen':'⛶ Full-screen editor';full.onclick=win.tl3Expand;
  const rot=document.createElement('button');rot.className='btn alt';rot.id='tl3Rotate';rot.textContent=vertical?'↔ Landscape pitch':'↕ Portrait pitch';rot.onclick=win.tl3Orientation;
  actions.appendChild(rot);actions.appendChild(full);top.appendChild(actions);
 }
 if(!panel.querySelector('#tl3Presets')){
  const bar=panel.querySelector('.tl2-topbar');const wrap=document.createElement('div');wrap.id='tl3Presets';wrap.className='tl3-presets';
  const label=document.createElement('label');label.className='tl3-presetlabel';label.innerText='Starting formation';
  const select=document.createElement('select');select.id='tl3PresetSelect';select.className='field';select.setAttribute('aria-label','Choose a rugby formation');
  const empty=document.createElement('option');empty.value='';empty.textContent='Choose a formation preset';select.appendChild(empty);
  choices.forEach(([title,items])=>{const group=document.createElement('optgroup');group.label=title;items.forEach(([value,text])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=text;group.appendChild(opt)});select.appendChild(group)});
  select.onchange=e=>{if(e.target.value)win.tl3Preset(e.target.value);e.target.value=''};
  wrap.append(label,select);bar?.insertAdjacentElement('afterend',wrap);
 }
}
function welcome(){
 const next=upcoming()[0],badge=state.badge?'<img class="tl3-clubcrest" src="'+esc(state.badge)+'" alt="Club crest">':'<div class="tl3-placeholder">T</div>';
 const tiles=[['selection','01','Team selection','Build squads, benches and match rotations','▦'],['tactics','02','Motion studio','Design formations and animate your plays','↗'],['match','03','Match centre','Live scoring, substitutions and match reports','◉'],['calendar','04','Club diary','Fixtures, training and reminders','▣'],['attendance','05','Availability & attendance','Track responses and training participation','✓'],['awards','06','Player awards','Parent voting and coaches’ player of the match','★'],['squad','07','Player squad','Manage positions and your roster','♙'],['insights','08','Season insights','Attendance, involvement and match statistics','◫'],['leagues','09','Leagues & results','Professional and community competitions','▤'],['settings','10','Club settings','Team identity, colours and game formats','⚙']];
 return '<div class="tl3-welcome">'+
 '<section class="tl3-hero"><div class="tl3-hero-top"><div class="tl3-crestwrap">'+badge+'</div><div class="tl3-hero-label">WELCOME TO YOUR CLUB SPACE <span class="tl3-hero-line"></span> TOUCHLINE</div></div>'+
 '<div class="tl3-hero-body"><div><div class="tl3-overline">YOUR SEASON. YOUR TEAM.</div><h1>'+esc(state.club)+'</h1><p>'+esc(state.team)+' <span>•</span> '+esc(state.age)+' rugby <span>•</span> '+size()+' on the field</p></div>'+
 '<div class="tl3-next"><span class="tl3-mini">NEXT IN YOUR DIARY</span><strong>'+(next?(next.type==='Match'?'vs '+esc(next.opposition):'Team training'):'No upcoming events')+'</strong><span>'+(next?dt(next.date)+' · '+esc(next.time)+' · '+esc(next.venue):'Add your first fixture')+'</span><button onclick="setPage(\'calendar\')">Open diary →</button></div></div>'+
 '</section><div class="tl3-sectionheading"><div><span class="tl3-mini">EXPLORE TOUCHLINE</span><h2>Everything your team needs.</h2></div><p>One place for coaching, match day and the season.</p></div>'+
 '<div class="tl3-tiles">'+tiles.map(([id,num,title,detail,icon],i)=>'<button class="tl3-tile '+(i===0||i===1?'tl3-featured':'')+'" onclick="setPage(\''+id+'\')"><span class="tl3-tile-top"><span>'+num+' / TOUCHLINE</span><span class="tl3-arrow">↗</span></span><span class="tl3-tile-bottom"><i>'+icon+'</i><strong>'+title+'</strong><small>'+detail+'</small></span></button>').join('')+'</div>'+
 '<div class="tl3-footnote">This preview currently stores team information on your device. Do not enter real children’s personal details until private accounts and secure storage are deployed.</div></div>';
}
home=welcome;
const before=render;
render=function(){
 before();
 const brand=document.querySelector('.side .brand');
 if(brand)brand.innerHTML='TOUCH<span>LINE</span><i class="tl3-mark">.</i>';
 if(page==='tactics')decorate();
 const nav=document.querySelectorAll('.nav');nav.forEach(n=>n.classList.toggle('active',n.dataset.page===page));
};
const oldSetPage=setPage;
setPage=function(which){
 if(which!=='tactics'){expanded=false;document.body.classList.remove('tl3-editor-active')}
 oldSetPage(which);
};
win.setPage=setPage;
const nav=document.querySelector('.side');nav?.setAttribute('aria-label','Touchline primary navigation');
render();
})();