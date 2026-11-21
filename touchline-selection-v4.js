/* Selection pitch V4 — canonical jersey slots, age-aware player positioning */
(function(){
'use strict';
const W=window, ids=()=>W.touchlineAgePositions(),role=n=>W.touchlineAgeRole(n);
let migrated=false;
const copy=o=>JSON.parse(JSON.stringify(o));
function fixLineup(l,oldKeys,newKeys,legacy=false){
 if(!l)return;
 const before=l.selection||{},used=new Set(),after={},bench=(l.bench||[]).slice();
 if(legacy){
   oldKeys.forEach((k,i)=>{const playerId=before[k];if(playerId&&!used.has(playerId)&&newKeys[i]!==undefined){after[newKeys[i]]=playerId;used.add(playerId)}});
 }else{
   newKeys.forEach(k=>{const playerId=before[k];if(playerId&&!used.has(playerId)){after[k]=playerId;used.add(playerId)}});
   const remaining=Object.entries(before).filter(([k,v])=>v&&!used.has(v));
   const gaps=newKeys.filter(k=>!after[k]);
   remaining.forEach(([k,v],i)=>{if(gaps[i]!=null){after[gaps[i]]=v;used.add(v)}});
 }
 Object.values(before).filter(v=>v&&!used.has(v)).forEach(v=>bench.push(v));
 l.selection=after;l.bench=[...new Set(bench.filter(v=>v&&!used.has(v)))];
}
function migrate(){
 if(state.positionSchemaV4)return;
 const newKeys=ids(),oldKeys=Array.from({length:size()},(_,i)=>i+1);
 const legacy=(state.age==='U12'||state.age==='U13')&&state.code==='Union'&&size()===(state.age==='U12'?12:13);
 const all=[state,...Object.values(state.lineups||{}),...Object.values(state.periodPlans||{}).flatMap(x=>x.periods||[])];
 all.forEach(l=>fixLineup(l,oldKeys,newKeys,legacy));
 state.positionSchemaV4=true;save();migrated=true;
}
function changeFormat(){
 const oldKeys=ids(),oldAge=state.age;
 const age=$('age')?.value||state.age,code=$('code')?.value||state.code,override=Math.min(15,Math.max(0,Number($('override')?.value)||0));
 state.age=age;state.code=code;state.rulesOverride=override;
 const newKeys=ids(),all=[state,...Object.values(state.lineups||{}),...Object.values(state.periodPlans||{}).flatMap(x=>x.periods||[])];
 if(oldKeys.join()!==newKeys.join())all.forEach(l=>fixLineup(l,oldKeys,newKeys,false));
 save();render();
}
saveFormat=changeFormat;W.saveFormat=changeFormat;
const baseSelection=selection;
const layouts={single:1,halves:2,thirds:3,quarters:4};
function header(){
 const m=match(),p=state.periodPlans?.[m?.id]||{mode:'single',active:0},n=layouts[p.mode]||1;
 const terms={single:'Starting lineup and bench',halves:'Two halves',thirds:'Three thirds',quarters:'Four quarters'};
 const opts=Object.keys(layouts).map(k=>'<option value="'+k+'" '+(p.mode===k?'selected':'')+'>'+terms[k]+'</option>').join('');
 const nav=n>1?'<div class="tl4-period-nav">'+Array.from({length:n},(_,i)=>'<button class="'+(i===p.active?'active':'')+'" onclick="periodSelect('+i+')">'+(p.mode==='halves'?'Half':p.mode==='thirds'?'Third':'Quarter')+' '+(i+1)+'</button>').join('')+'</div>':'';
 return '<div class="tl4-periodbar"><div><span class="tl4-eyebrow">MATCH PLAN</span><h3>Selection & rotation</h3></div><select class="field" aria-label="Selection format" onchange="periodMode(this.value)">'+opts+'</select>'+nav+
 ((p.active||0)>0?'<button class="btn alt sm" onclick="periodDuplicate()">Copy previous period</button>':'')+'</div>';
}
function pitchCard(k){
 const id=state.selection[k],p=player(id),q=W.touchlineAgePitchPoint()[k]||{x:50,y:50};
 return '<div class="tl4-slot slot '+(p?'filled':'')+'" tabindex="0" role="button" data-slot="'+k+'" aria-label="'+esc('#'+k+' '+role(k)+', '+(p?.name||'unassigned'))+'" style="left:'+q.x+'%;top:'+q.y+'%">'+
 '<span class="tl4-number">'+k+'</span><span class="tl4-slot-info"><strong>'+esc(role(k))+'</strong><span>'+esc(p?.name||'Tap to select')+'</span></span></div>';
}
function selectionPage(){
 const m=match(),activeKeys=ids(),used=new Set([...Object.values(state.selection||{}),...state.bench]),available=state.players.filter(p=>!used.has(p.id));
 const bench=state.bench.map((id,i)=>'<div draggable="true" data-player="'+esc(id)+'" class="tl4-sub"><span>SUB '+(i+1)+'</span><strong>'+esc(player(id)?.name||'Player')+'</strong><button type="button" data-bench-remove="'+esc(id)+'" aria-label="Remove substitute">×</button></div>').join('');
 const roster=available.map(p=>'<button draggable="true" data-player="'+esc(p.id)+'" data-pick="'+esc(p.id)+'" type="button" class="tl4-roster-player '+(selectedPlayer===p.id?'chosen':'')+'"><strong>'+esc(p.name)+'</strong><span>#'+p.primary+' · '+esc(role(p.primary))+'</span></button>').join('');
 const suggestion=state.bench.flatMap(id=>{
  const p=player(id);if(!p)return [];
  return activeKeys.filter(n=>state.selection[n]&&(p.primary===n||(p.secondary||[]).includes(n))).map(n=>'<div class="tl4-suggestion"><span>'+esc(p.name)+' for '+esc(player(state.selection[n])?.name||'')+' · #'+n+'</span><button data-sub-swap="'+esc(id)+'" data-sub-slot="'+n+'" type="button">Swap</button></div>');
 }).join('')||'<p class="sub">Position-matched substitutions will appear here after the team and bench are selected.</p>';
 return head('Team selection','Build your match-day side on a rugby pitch, using the correct positions for this age grade.',
 '<div class="topactions"><button class="btn alt" onclick="downloadTeamSheet()">Export team sheet</button><button class="btn alt" onclick="clearLineup()">Clear selection</button></div>')+
 header()+'<div class="tl4-selectbar"><label class="fieldbox"><span class="label">Fixture</span><select class="field" id="lineupMatch">'+state.fixtures.filter(f=>f.type==='Match').map(f=>'<option value="'+esc(f.id)+'" '+(m?.id===f.id?'selected':'')+'>'+dt(f.date)+' · vs '+esc(f.opposition)+'</option>').join('')+'</select></label><span class="pill">'+esc(state.age)+' · '+activeKeys.length+' positions</span><span class="pill">'+Object.values(state.selection).filter(Boolean).length+' selected</span></div>'+
 '<div class="tl4-selection-wrap"><div class="tl4-pitch-shell"><div class="tl4-pitch-heading"><div><span class="tl4-eyebrow">TEAM SHEET</span><h2>Starting positions</h2></div><span>↑ Towards opposition</span></div>'+
 '<div class="tl4-pitch-scroll"><div class="tl4-pitch" aria-label="Interactive rugby selection pitch"><div class="tl4-pitch-lines"><div class="tl4-touchline"></div><div class="tl4-22"></div><div class="tl4-try"></div><div class="tl4-pitch-caption">OPPOSITION GOAL LINE</div></div>'+activeKeys.map(pitchCard).join('')+'</div></div><p class="tl4-pitch-hint">Tap a squad player, then tap the numbered position. Or drag players onto the pitch. On a narrow screen, swipe horizontally to see the full pitch.</p>'+
 '<div class="tl4-bench-title"><h3>Substitutes bench</h3><span>'+state.bench.length+' selected</span></div><div class="tl4-bench" data-bench="true">'+(bench||'<span class="muted">No substitutes selected</span>')+'</div></div>'+
 '<aside class="tl4-selection-side"><div class="tl4-pool"><div class="tl4-eyebrow">AVAILABLE SQUAD</div><h3>Select your players</h3><p class="sub">Choose a player, assign them to the pitch, or place them on the bench.</p><div class="tl4-pool-list">'+roster+'</div><button class="btn" type="button" onclick="addBench()" '+(!selectedPlayer?'disabled':'')+'>Add to bench</button></div>'+
 '<div class="tl4-pool"><h3>Suggested substitutions</h3>'+suggestion+'<p class="tl4-small">The coach must verify positional competence and the Half Game Rule.</p></div></aside></div>';
}
selection=selectionPage;
const originalWire=wire;
wire=function(){
 originalWire();
 document.querySelectorAll('.tl4-slot').forEach(el=>el.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){e.preventDefault();assignSlot(Number(el.dataset.slot))}
 }));
};
document.addEventListener('click',function(e){
 const pickEl=e.target.closest?.('[data-pick]');
 if(pickEl){pick(pickEl.dataset.pick);return}
 const removed=e.target.closest?.('[data-bench-remove]');
 if(removed){e.stopPropagation();state.bench=state.bench.filter(id=>id!==removed.dataset.benchRemove);save();render();return}
 const swap=e.target.closest?.('[data-sub-swap]');
 if(swap){e.stopPropagation();swapFromBench(swap.dataset.subSwap,Number(swap.dataset.subSlot));return}
});
downloadTeamSheet=function(){
 const m=match(),lines=[state.club+' / '+state.team,'Match: '+(m?.opposition||'TBC'),'Date: '+(m?.date||'TBC'),'Age grade: '+state.age,'','STARTING TEAM',
 ...ids().map(k=>k+'. '+role(k)+' — '+(player(state.selection[k])?.name||'Unassigned')),'','REPLACEMENTS',
 ...state.bench.map((id,i)=>(i+1)+'. '+(player(id)?.name||'Player'))];
 downloadFile(lines.join('\n'),'touchline-team-sheet.txt','text/plain;charset=utf-8');
};
migrate();render();
})();
