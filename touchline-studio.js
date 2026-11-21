
/* Touchline Coaching Studio | local-first extension. No external calls or personal-data transfers. */
(function(){
'use strict';
const baseRender=render,baseSelection=selection,baseWire=wire,baseMatchView=matchView,baseInsights=insights,baseStoreLineup=storeLineup;
const copy=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const periodsOf={single:1,halves:2,thirds:3,quarters:4};
const studio={mode:'moves',detail:'',playing:false,raf:0,focus:1,dragging:false,position:null};
function ensurePlans(){state.periodPlans??={};state.plays??=[];state.plays=Array.isArray(state.plays)?state.plays:[];}
function planFor(id=state.matchId){
 ensurePlans();
 const fallback=state.lineups?.[id]||(state.matchId===id?{selection:state.selection,bench:state.bench}:{selection:{},bench:[]});
 if(!state.periodPlans[id] || !Array.isArray(state.periodPlans[id].periods)){
  state.periodPlans[id]={mode:'single',active:0,periods:[{selection:copy(fallback.selection||{}),bench:copy(fallback.bench||[])}]};
 }
 const pl=state.periodPlans[id];pl.mode=periodsOf[pl.mode]?pl.mode:'single';pl.active=clamp(Number(pl.active)||0,0,periodsOf[pl.mode]-1);
 while(pl.periods.length<periodsOf[pl.mode])pl.periods.push(copy(pl.periods[pl.periods.length-1]||{selection:{},bench:[]}));
 return pl;
}
function saveCurrentPeriod(){
 const m=state.fixtures.find(f=>f.id===state.matchId);if(!m)return;
 const pl=planFor(m.id);pl.periods[pl.active]={selection:copy(state.selection),bench:copy(state.bench)};
 state.lineups[m.id]=copy(pl.periods[0]);
}
storeLineup=saveCurrentPeriod;
function loadPeriod(id,period){const pl=planFor(id);pl.active=clamp(period,0,periodsOf[pl.mode]-1);const data=pl.periods[pl.active];state.selection=copy(data.selection);state.bench=copy(data.bench);selectedPlayer=null}
chooseMatch=function(id){
 if(!fixture(id)||fixture(id).type!=='Match')return;
 saveCurrentPeriod();state.matchId=id;loadPeriod(id,planFor(id).active);save();render();
};
window.chooseMatch=chooseMatch;
window.periodMode=function(v){
 if(!periodsOf[v])return;saveCurrentPeriod();
 const pl=planFor();pl.mode=v;let target=periodsOf[v];
 while(pl.periods.length<target)pl.periods.push(copy(pl.periods[pl.periods.length-1]||{selection:{},bench:[]}));
 pl.active=clamp(pl.active,0,target-1);loadPeriod(state.matchId,pl.active);save();render();
};
window.periodSelect=function(n){saveCurrentPeriod();loadPeriod(state.matchId,n);save();render()};
window.periodDuplicate=function(){const pl=planFor();if(pl.active===0)return;pl.periods[pl.active]=copy(pl.periods[pl.active-1]);loadPeriod(state.matchId,pl.active);save();render()};
function periodLabel(mode,i){return mode==='single'?'Starting side':mode==='halves'?('Half '+(i+1)):mode==='thirds'?('Third '+(i+1)):('Quarter '+(i+1))}
function rotationSummary(){
 const m=match(),pl=planFor(m?.id);if(!m||pl.mode==='single')return '';
 const duration=Number(m.matchMinutes)||60,pct=100/periodsOf[pl.mode],each=duration/periodsOf[pl.mode];
 const total={};pl.periods.slice(0,periodsOf[pl.mode]).forEach(row=>{for(const id of new Set(Object.values(row.selection).filter(Boolean)))total[id]=(total[id]||0)+each});
 const all=Object.entries(total).sort((a,b)=>a[1]-b[1]),notHalf=all.filter(([id,min])=>min<duration/2);
 return '<div class="studio-panel"><div class="row"><h3>Planned playing time</h3><span class="tag">'+periodsOf[pl.mode]+' periods · '+Math.round(pct)+'% each</span></div>'+
 '<p class="studio-hint">Estimated from these period selections, assuming equal-duration periods. Actual substitutions and interruptions may change playing time. Check RFU half-game requirements independently.</p>'+
 '<div class="table-scroll"><table class="studio-table"><thead><tr><th>Player</th><th>Planned minutes</th><th>Share</th></tr></thead><tbody>'+
 all.map(([id,min])=>'<tr><td>'+esc(player(id)?.name||'Unknown')+'</td><td>'+Math.round(min*10)/10+'</td><td>'+Math.round(100*min/duration)+'%'+(min<duration/2?' · Review':'')+'</td></tr>').join('')+
 '</tbody></table></div>'+(notHalf.length?'<div class="studio-banner">'+notHalf.length+' planned player(s) below half-game participation. Review before the fixture.</div>':'')+'</div>';
}
selection=function(){
 const m=match(),pl=planFor(m?.id);const n=periodsOf[pl.mode];
 const tabs='<div class="studio-panel"><div class="row"><div><div class="studio-kicker">Team selection format</div><h3 style="margin:5px 0">Choose how to rotate your players</h3></div><select class="field" aria-label="Team selection format" style="max-width:220px" onchange="periodMode(this.value)">'+
 [['single','Starting lineup + bench'],['halves','Two halves'],['thirds','Three thirds'],['quarters','Four quarters']].map(([v,label])=>'<option value="'+v+'" '+(pl.mode===v?'selected':'')+'>'+label+'</option>').join('')+'</select></div>'+
 (n>1?'<div class="studio-bar"><div class="studio-tabs">'+Array.from({length:n},(_,i)=>'<button class="'+(pl.active===i?'active':'')+'" onclick="periodSelect('+i+')">'+periodLabel(pl.mode,i)+'</button>').join('')+'</div><button class="btn sm alt" onclick="periodDuplicate()" '+(pl.active===0?'disabled':'')+'>Copy previous period</button></div>':'')+
 '<div class="studio-hint">'+(n>1?'Each period has its own team selection and substitutes. Switching periods saves the current arrangement.':'Use the pitch and substitutes bench to set your starting side.')+'</div></div>';
 return tabs+baseSelection()+rotationSummary();
};
matchView=function(){
 return baseMatchView()+(planFor().mode==='single'?'':'<div class="studio-panel"><h3>Match rotation plan</h3><p class="studio-hint">This fixture has a period-based plan. The standard substitutions log is separate and is not automatically inferred from the rotation plan.</p><button class="btn alt sm" onclick="setPage(\'selection\')">Review period selections</button></div>');
};
/* Tactics board: named moves; each keyframe stores x/y for each jersey number. */
function positions(n){let out={};for(let i=1;i<=n;i++){const cols=Math.ceil(n/4),col=(i-1)%cols,row=Math.floor((i-1)/cols);out[i]={x:13+col*(74/Math.max(1,cols-1)),y:18+row*20}}return out}
function ensurePlay(){
 ensurePlans();
 if(!state.plays.length){state.plays.push({id:uid('play'),name:'New attacking move',description:'Drag players to set up the starting shape, then add a step and reposition them.',frames:[{positions:positions(size())}]})}
 const current=state.plays.find(p=>p.id===state.activePlay)||state.plays[0];
 state.activePlay=current.id;current.frames??=[{positions:positions(size())}];if(!current.frames.length)current.frames.push({positions:positions(size())});
 return current;
}
function frameIndex(p){return clamp(Number(state.activeFrame)||0,0,p.frames.length-1)}
function pointFor(p,n,f=frameIndex(p)){
 const data=p.frames[f].positions;data[n]??=positions(size())[n]||{x:50,y:50};return data[n];
}
window.studioCreate=function(){const p={id:uid('play'),name:'Untitled move',description:'',frames:[{positions:positions(size())}]};state.plays.push(p);state.activePlay=p.id;state.activeFrame=0;save();render()};
window.studioChoose=function(id){if(!state.plays.some(p=>p.id===id))return;studioStop();state.activePlay=id;state.activeFrame=0;save();render()};
window.studioMeta=function(k,value){const p=ensurePlay();if(k!=='name'&&k!=='description')return;p[k]=String(value).slice(0,k==='name'?100:800);save()};
window.studioAddFrame=function(){studioStop();const p=ensurePlay();if(p.frames.length>=20)return alert('Maximum 20 steps per move.');const idx=frameIndex(p);p.frames.splice(idx+1,0,copy(p.frames[idx]));state.activeFrame=idx+1;save();render()};
window.studioDeleteFrame=function(){studioStop();const p=ensurePlay();if(p.frames.length===1)return alert('Every move needs an initial position.');p.frames.splice(frameIndex(p),1);state.activeFrame=clamp(frameIndex(p),0,p.frames.length-1);save();render()};
window.studioSelectFrame=function(i){studioStop();const p=ensurePlay();state.activeFrame=clamp(i,0,p.frames.length-1);save();render()};
window.studioDeletePlay=function(){if(!confirm('Delete this move and its animation steps?'))return;studioStop();state.plays=state.plays.filter(p=>p.id!==state.activePlay);state.activePlay=state.plays[0]?.id||'';state.activeFrame=0;save();render()};
window.studioResetPositions=function(){const p=ensurePlay();p.frames[frameIndex(p)].positions=positions(size());save();render()};
function updateMarkers(map){
 const pitch=document.getElementById('studioPitch');if(!pitch)return;
 pitch.querySelectorAll('[data-marker]').forEach(el=>{const q=map[el.dataset.marker];if(q){el.style.left=q.x+'%';el.style.top=q.y+'%'}});
}
function renderTrails(p){
 const index=frameIndex(p);if(index<1)return '';
 const prev=p.frames[index-1].positions,now=p.frames[index].positions;
 let lines='';
 for(let i=1;i<=size();i++){const a=prev[i],b=now[i];if(!a||!b||Math.hypot(a.x-b.x,a.y-b.y)<2)returnLine: {continue}
 lines+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#ffffff9e" stroke-width=".5" stroke-dasharray="1.1 1.1"/>';}
 return '<svg class="trails" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+lines+'</svg>';
}
function tactics(){
 const p=ensurePlay(),idx=frameIndex(p),n=size(),ps=p.frames[idx].positions;
 return head('Tactics board','Set out your players on a half pitch, build movement steps and play back each move.')+
 '<div class="studio-panel"><div class="row"><h2>Move designer</h2><button class="btn alt sm" onclick="studioCreate()">+ New move</button></div><div class="studio-bar"><select class="field" aria-label="Choose saved move" onchange="studioChoose(this.value)">'+state.plays.map(x=>'<option value="'+esc(x.id)+'" '+(p.id===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select><button class="btn sm alt" onclick="studioDeletePlay()">Delete move</button></div>'+
 '<div class="studio-layout"><div><div id="studioPitch" class="studio-pitch" aria-label="Half rugby pitch with movable numbered players"><div class="studio-midline"></div><div class="studio-22"></div><div class="studio-try"></div>'+renderTrails(p)+
 Array.from({length:n},(_,i)=>{let q=pointFor(p,i+1);return '<button type="button" class="studio-number" data-marker="'+(i+1)+'" style="left:'+q.x+'%;top:'+q.y+'%;background:var(--primary)" title="Drag player '+(i+1)+'" aria-label="Move player '+(i+1)+'">'+(i+1)+'<span class="studio-marker-name">'+esc(player(state.selection[i+1])?.name||'')+'</span></button>'}).join('')+
 '</div><p class="studio-hint">Drag the numbered circles with a finger or mouse. A move contains up to 20 steps. The markings are an illustrative half-pitch, not a measured coaching diagram.</p></div>'+
 '<div class="studio-side"><label class="fieldbox"><span class="label">Move name</span><input class="field" maxlength="100" value="'+esc(p.name)+'" oninput="studioMeta(\'name\',this.value)"></label>'+
 '<label class="fieldbox"><span class="label">Description / coaching notes</span><textarea class="field" rows="5" maxlength="800" oninput="studioMeta(\'description\',this.value)">'+esc(p.description)+'</textarea></label>'+
 '<div><div class="label">Animation steps</div><div class="studio-steps">'+p.frames.map((f,i)=>'<button class="'+(idx===i?'on':'')+'" onclick="studioSelectFrame('+i+')">'+String.fromCharCode(65+i)+' · '+(i+1)+'</button>').join('')+'</div></div>'+
 '<div class="studio-bar"><button class="btn" onclick="studioPlay()">▶ Play move</button><button class="btn alt" onclick="studioStop()">■ Stop</button></div>'+
 '<div class="studio-bar"><button class="btn alt sm" onclick="studioAddFrame()">+ Add next step</button><button class="btn alt sm" onclick="studioDeleteFrame()">Remove step</button></div>'+
 '<button class="btn alt sm" onclick="studioResetPositions()">Reset markers in this step</button>'+
 '<div class="studio-banner">How to build a move: arrange the opening shape (A), add a step (B), drag players to their next positions, then repeat. Play animates between your saved steps.</div></div></div></div>';
}
function studioStop(){studio.playing=false;cancelAnimationFrame(studio.raf);studio.raf=0}
window.studioStop=studioStop;
window.studioPlay=function(){
 studioStop();const p=ensurePlay();if(p.frames.length<2)return alert('Add at least one further step to animate the move.');
 let first=0,last=p.frames.length-1;studio.playing=true;let t0=performance.now();const transition=850;
 const animate=now=>{
  if(!studio.playing)return;
  const elapsed=(now-t0)/transition,seg=Math.min(last-1,Math.floor(elapsed)),alpha=clamp(elapsed-seg,0,1);const blend=alpha*alpha*(3-2*alpha);
  const map={};for(let i=1;i<=size();i++){const a=pointFor(p,i,seg),b=pointFor(p,i,seg+1);map[i]={x:a.x+(b.x-a.x)*blend,y:a.y+(b.y-a.y)*blend}}
  updateMarkers(map);
  if(elapsed>=last){studioStop();state.activeFrame=last;save();return}
  studio.raf=requestAnimationFrame(animate);
 };
 state.activeFrame=0;render();studio.raf=requestAnimationFrame(animate);
};
function attachTacticDrag(){
 const pitch=document.getElementById('studioPitch');if(!pitch)return;
 pitch.querySelectorAll('[data-marker]').forEach(el=>{
  el.addEventListener('pointerdown',ev=>{
   if(studio.playing)studioStop();ev.preventDefault();studio.dragging=true;studio.focus=Number(el.dataset.marker);
   const rect=pitch.getBoundingClientRect(),p=ensurePlay(),idx=frameIndex(p);
   el.classList.add('focus');el.setPointerCapture(ev.pointerId);
   function move(e){const x=clamp((e.clientX-rect.left)/rect.width*100,7,93),y=clamp((e.clientY-rect.top)/rect.height*100,7,93);el.style.left=x+'%';el.style.top=y+'%';p.frames[idx].positions[studio.focus]={x:+x.toFixed(2),y:+y.toFixed(2)}}
   const up=e=>{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);studio.dragging=false;save()};
   el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  });
 });
}
/* Attendance: recorded yes/no only form the denominator, unrecorded stays separate. */
let attendancePlayer='all',attendanceKind='all',attendanceView='register';
function attPct(yes,recorded){return recorded?Math.round(yes*100/recorded):null}
function attEvents(kind){return state.fixtures.filter(f=>kind==='all'||f.type===kind)}
function attTotals(id,kind='all'){
 const events=attEvents(kind);let yes=0,no=0,pending=0;
 for(const f of events){let a=f.attendance?.[id]?.attended;if(a==='Yes')yes++;else if(a==='No')no++;else pending++}
 return {yes,no,pending,recorded:yes+no,total:events.length,pct:attPct(yes,yes+no)};
}
window.attendanceDisplay=function(view){attendanceView=view;render()};
window.attendanceKindChange=function(v){attendanceKind=v;render()};
window.attendancePlayerChange=function(id){attendancePlayer=id;render()};
function attendanceOverview(){
 const evs=attEvents(attendanceKind),rows=state.players.map(p=>({p,stats:attTotals(p.id,attendanceKind)}));
 const totalYes=rows.reduce((s,r)=>s+r.stats.yes,0),totalRecorded=rows.reduce((s,r)=>s+r.stats.recorded,0),totalExpected=evs.length*state.players.length,overall=attPct(totalYes,totalRecorded);
 const focus=player(attendancePlayer);
 const percent=p=>p==null?'—':p+'%';
 const headCards='<div class="studio-att-summary">'+[
 ['Recorded attendance',percent(overall)],['Attended / recorded',totalYes+' / '+totalRecorded],['Unrecorded responses',totalExpected-totalRecorded]
 ].map(([k,v])=>'<div class="card"><div class="label">'+k+'</div><strong>'+v+'</strong></div>').join('')+'</div>';
 const table='<div class="table-scroll"><table class="studio-table"><thead><tr><th>Player</th><th>Training</th><th>Matches</th><th>Total</th><th>Recorded</th></tr></thead><tbody>'+
 rows.map(({p,stats})=>{const a=attTotals(p.id,'Training'),b=attTotals(p.id,'Match');return '<tr onclick="attendancePlayerChange(\''+p.id+'\')"><td><b>'+esc(p.name)+'</b></td>'+
 [a,b,stats].map(x=>'<td><div class="studio-viz"><b>'+(percent(x.pct))+'</b><div class="studio-progress" role="img" aria-label="'+(x.pct??0)+'% attendance"><i style="width:'+(x.pct??0)+'%"></i></div></div></td>').join('')+
 '<td>'+stats.recorded+' / '+stats.total+'</td></tr>'}).join('')+'</tbody></table></div>';
 const detail=focus?'<div class="studio-panel"><div class="row"><h2>'+esc(focus.name)+'</h2><button class="btn alt sm" onclick="attendancePlayerChange(\'all\')">All players</button></div><p class="studio-hint">Attendance by event — only Yes and No count towards percentages.</p>'+
 '<div class="table-scroll"><table class="studio-table"><thead><tr><th>Date</th><th>Session</th><th>Recorded</th></tr></thead><tbody>'+evs.map(f=>'<tr><td>'+esc(f.date)+'</td><td>'+esc(f.type)+(f.opposition?' · '+esc(f.opposition):'')+'</td><td>'+esc(f.attendance?.[focus.id]?.attended||'Not recorded')+'</td></tr>').join('')+'</tbody></table></div></div>':'';
 return head('Attendance overview','Training and match attendance at a glance. Tap a player for their individual record.')+
 '<div class="studio-bar"><label class="label" for="attendanceType">Show</label><select class="field" id="attendanceType" onchange="attendanceKindChange(this.value)">'+[['all','All events'],['Training','Training'],['Match','Matches']].map(([v,t])=>'<option value="'+v+'" '+(attendanceKind===v?'selected':'')+'>'+t+'</option>').join('')+'</select><button class="btn alt sm" onclick="attendanceDisplay(\'register\')">Attendance register</button></div>'+headCards+
 '<div class="studio-panel"><div class="row"><h2>Squad attendance</h2><span class="tag">'+evs.length+' events</span></div><div class="studio-hint" style="margin-bottom:14px">Percentages are calculated from recorded attendance only; blank sessions are not treated as absences. Click a player to view the detailed register.</div>'+table+'</div>'+detail;
}
function attendanceRegister(){
 const e=fixture(state.sessionId)||state.fixtures.find(e=>e.type==='Training');
 if(!e)return head('Availability & attendance','Create an event first.');
 const events=state.fixtures;
 const isMatch=e.type==='Match',minutesCol=isMatch?'<span class="label">Minutes</span>':'';
 let rows=state.players.map(p=>{let a=state.availability[e.id]?.[p.id]||'Unknown',b=e.attendance?.[p.id]||{};
 return '<div class="att '+(isMatch?'':'att-no-minutes')+'"><div>'+esc(p.name)+' <span class="tiny">#'+p.primary+'</span></div>'+
 '<select class="status '+(a==='Yes'?'yes':a==='No'?'no':a==='Maybe'?'maybe':'')+'" onchange="setAvailability(\''+e.id+'\',\''+p.id+'\',this.value)">'+['Unknown','Yes','Maybe','No'].map(v=>'<option '+(a===v?'selected':'')+'>'+v+'</option>').join('')+'</select>'+
 '<select class="status '+(b.attended==='Yes'?'yes':b.attended==='No'?'no':'')+'" onchange="setAttended(\''+e.id+'\',\''+p.id+'\',this.value)">'+['—','Yes','No'].map(v=>'<option '+(b.attended===v?'selected':'')+'>'+v+'</option>').join('')+'</select>'+
 (isMatch?'<input class="field" type="number" min="0" max="'+(e.matchMinutes||160)+'" style="padding:7px" aria-label="Minutes for '+esc(p.name)+'" value="'+(b.minutes??'')+'" placeholder="min" onchange="setMinutes(\''+e.id+'\',\''+p.id+'\',this.value)">':'')+
 '</div>'}).join('');
 let known=state.players.filter(p=>['Yes','No'].includes(e.attendance?.[p.id]?.attended));
 let yes=known.filter(p=>e.attendance[p.id].attended==='Yes').length;
 return head('Availability & attendance','Record availability before an event and actual attendance afterwards.')+
 '<div class="studio-bar"><button class="btn alt sm" onclick="attendanceDisplay(\'summary\')">View attendance summary</button><select id="attendanceSelect" class="field" aria-label="Choose event" style="max-width:330px">'+events.map(f=>'<option value="'+esc(f.id)+'" '+(e.id===f.id?'selected':'')+'>'+dt(f.date)+' · '+esc(f.type)+' '+esc(f.opposition||'')+'</option>').join('')+'</select></div>'+
 '<div class="studio-panel"><div class="row"><h2>'+(isMatch?'Match vs '+esc(e.opposition):'Training session')+'</h2><span class="pill">'+dt(e.date)+'</span></div>'+
 '<div class="studio-att-summary"><div class="card"><div class="label">Recorded attendance</div><strong>'+(attPct(yes,known.length)??'—')+(known.length?'%':'')+'</strong></div><div class="card"><div class="label">Present</div><strong>'+yes+'</strong></div><div class="card"><div class="label">Awaiting record</div><strong>'+(state.players.length-known.length)+'</strong></div></div>'+
 '<div class="att '+(isMatch?'':'att-no-minutes')+'" style="margin-top:18px"><strong>Player</strong><span class="label">Available</span><span class="label">Attended</span>'+minutesCol+'</div>'+rows+
 '<div class="studio-hint" style="margin-top:14px">'+(isMatch?'Playing minutes are optional for match records.':'Training records only need attendance, not playing minutes.')+'</div></div>';
}
attendance=function(){return attendanceView==='summary'?attendanceOverview():attendanceRegister()};
const oldRender=render;
render=function(){
 if(page==='tactics'){$('view').innerHTML=tactics();attachTacticDrag();return;}
 if(page==='attendance'){$('view').innerHTML=attendance();wire();return;}
 oldRender();
};
window.setPage=setPage;
function addNavigation(){
 const nav=document.querySelector('[data-page="selection"]');
 if(nav&&!document.querySelector('[data-page="tactics"]')){const b=document.createElement('button');b.className='nav';b.dataset.page='tactics';b.innerHTML='↗ <span>Tactics & moves</span>';nav.insertAdjacentElement('afterend',b);b.addEventListener('click',()=>setPage('tactics'))}
}
const style=document.createElement('style');style.textContent='.att-no-minutes{grid-template-columns:minmax(130px,1fr) 100px 100px!important}@media(max-width:480px){.att-no-minutes{grid-template-columns:minmax(105px,1fr) 76px 76px!important}}';document.head.appendChild(style);
addNavigation();
ensurePlans();if(state.matchId&&fixture(state.matchId))loadPeriod(state.matchId,planFor().active);
save();render();
})();
