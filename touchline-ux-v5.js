/* Touchline V5 — responsive team sheet, fixture stopwatch and club home refinements */
(function(){
'use strict';
const host=window;
const previousRender=render;
let sheetOpen=false,clockTicker=null;
const clamp=(v,low,high)=>Math.min(high,Math.max(low,v));
const two=n=>String(n).padStart(2,'0');
const now=()=>Date.now();
const toSeconds=ms=>Math.floor(Math.max(0,ms)/1000);
function clockText(ms){
 const whole=toSeconds(ms);
 const hours=Math.floor(whole/3600),minutes=Math.floor((whole%3600)/60),seconds=whole%60;
 return (hours?two(hours)+':':'')+two(minutes)+':'+two(seconds);
}
function clockParts(ms){return {minutes:clockText(ms),seconds:Math.floor(Math.max(0,ms)%1000/100),hours:Math.floor(Math.max(0,ms)/3600000)}}
function dateLabel(){
 return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
}
function hourLabel(){
 return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
}
function displayOverviewClock(){
 const date=document.getElementById('tl5Today'),time=document.getElementById('tl5Now');
 if(date)date.textContent=dateLabel();
 if(time)time.textContent=hourLabel();
}
function touchlineClockId(){return state.clockFixtureId||match()?.id||state.fixtures.find(f=>f.type==='Match')?.id||'practice'}
function clockFixture(){return fixture(touchlineClockId())}
function clockCount(){
 const m=clockFixture();
 const plan=state.periodPlans?.[m?.id];
 return plan?.mode==='quarters'?4:plan?.mode==='thirds'?3:2;
}
function normalizeClock(){
 state.matchClocks??={};
 const id=touchlineClockId(),m=clockFixture();
 if(!state.matchClocks[id]){
  const parts=clockCount(),total=Number(m?.matchMinutes)||60;
  state.matchClocks[id]={count:parts,period:0,lengthMin:Math.max(1,Math.round(total/parts)),countdown:false,segments:Array.from({length:parts},()=>({elapsed:0,since:null})),marks:[]};
 }
 const c=state.matchClocks[id];
 c.count=clamp(Number(c.count)||2,1,4);
 c.period=clamp(Number(c.period)||0,0,c.count-1);
 c.lengthMin=clamp(Number(c.lengthMin)||30,1,120);
 c.segments??=[];c.marks??=[];
 while(c.segments.length<c.count)c.segments.push({elapsed:0,since:null});
 c.segments=c.segments.slice(0,c.count);
 c.segments.forEach(s=>{s.elapsed=Math.max(0,Number(s.elapsed)||0);if(!Number.isFinite(Number(s.since)))s.since=null});
 return c;
}
function segmentElapsed(s,t=now()){
 return Math.max(0,Number(s.elapsed)||0)+(s.since!=null?Math.max(0,t-s.since):0);
}
function clockTotal(c,t=now()){return c.segments.reduce((sum,s)=>sum+segmentElapsed(s,t),0)}
function clockIsRunning(c){return c.segments.some(s=>s.since!=null)}
function stopAll(c){
 const at=now();c.segments.forEach(s=>{if(s.since!=null){s.elapsed=segmentElapsed(s,at);s.since=null}});
}
function stopwatchPage(){
 const c=normalizeClock(),m=clockFixture(),part=c.segments[c.period],elapsed=segmentElapsed(part);
 const total=clockTotal(c),run=clockIsRunning(c);
 const displayed=c.countdown?c.lengthMin*60000-elapsed:elapsed;
 const options=state.fixtures.filter(f=>f.type==='Match').map(f=>
 '<option value="'+esc(f.id)+'" '+(f.id===touchlineClockId()?'selected':'')+'>'+dt(f.date)+' · '+esc(f.opposition||'Fixture')+'</option>').join('');
 const selector=options?'<label class="tl5-clock-fixture"><span class="label">Fixture</span><select class="field" id="tl5ClockFixture" onchange="tl5ChooseClock(this.value)">'+options+'</select></label>':'<div class="tl5-clock-fixture"><span class="label">Fixture</span><span class="pill">Practice timer</span></div>';
 return head('Match stopwatch','An easy-to-read match clock for coaches, parents and touchline volunteers.')+
 '<section class="tl5-clock-panel"><div class="tl5-clock-head"><div><span class="tl5-kicker">TOUCHLINE MATCH DAY</span><h2>'+(m?'vs '+esc(m.opposition||'Opposition'):'Match timer')+'</h2><p>'+(m?dt(m.date)+' · '+esc(m.venue||'Venue TBC'):'Create a fixture to save the stopwatch against a specific match.')+'</p></div>'+selector+'</div>'+
 '<div class="tl5-clock-grid"><div class="tl5-clock-face"><div class="tl5-clock-face-head"><span class="tl5-clock-chip" id="tl5ClockStatus">'+(run?'● RUNNING':'Ⅱ PAUSED')+'</span><span class="tl5-clock-period">PERIOD '+(c.period+1)+' / '+c.count+'</span></div>'+
 '<div class="tl5-clock-reading" id="tl5ClockReading" aria-label="Current match period time">'+(displayed<0?'-':'')+clockText(Math.abs(displayed))+'</div><div class="tl5-clock-subline"><span id="tl5ClockExtra">'+(elapsed>c.lengthMin*60000?'Additional time':'Period time')+'</span><span>Target '+c.lengthMin+' minutes</span></div>'+
 '<div class="tl5-clock-progress"><div id="tl5ClockProgress" style="width:'+Math.min(100,100*elapsed/(c.lengthMin*60000))+'%"></div></div>'+
 '<div class="tl5-clock-controls"><button class="tl5-clock-main" id="tl5ClockStart" onclick="tl5StartPause()">'+(run?'Ⅱ Pause':'▶ Start')+'</button><button class="tl5-clock-second" onclick="tl5NextPeriod()" '+(c.period===c.count-1?'disabled':'')+'>Next period →</button><button class="tl5-clock-second" onclick="tl5Reset()">↺ Reset</button></div>'+
 '</div>'+
 '<aside class="tl5-clock-sidebar"><div class="tl5-clock-setting"><span class="tl5-kicker">MATCH FORMAT</span><label class="label" for="tl5ClockParts">Periods</label><select class="field" id="tl5ClockParts" onchange="tl5SetPeriods(Number(this.value))">'+[1,2,3,4].map(n=>'<option value="'+n+'" '+(n===c.count?'selected':'')+'>'+n+' '+(n===1?'period':'periods')+'</option>').join('')+'</select>'+
 '<label class="label" for="tl5ClockMinutes">Minutes per period</label><input class="field" id="tl5ClockMinutes" type="number" min="1" max="120" value="'+c.lengthMin+'" onchange="tl5Length(Number(this.value))">'+
 '<label class="tl5-countdown"><input type="checkbox" '+(c.countdown?'checked':'')+' onchange="tl5Countdown(this.checked)"> Countdown display</label></div>'+
 '<div class="tl5-clock-setting"><span class="tl5-kicker">PERIODS</span><div class="tl5-clock-periods">'+c.segments.map((s,i)=>'<button type="button" class="'+(i===c.period?'active':'')+'" onclick="tl5Period('+i+')"><span>Period '+(i+1)+'</span><strong id="tl5Period'+i+'">'+clockText(segmentElapsed(s))+'</strong></button>').join('')+'</div></div>'+
 '<div class="tl5-clock-setting"><span class="tl5-kicker">MATCH SUMMARY</span><div class="tl5-clock-total"><span>Total elapsed</span><strong id="tl5ClockTotal">'+clockText(total)+'</strong></div><button class="btn alt sm" onclick="tl5Mark()">+ Mark moment</button><div class="tl5-clock-marks">'+(c.marks.length?c.marks.slice().reverse().slice(0,8).map(x=>'<div class="tl5-clock-mark"><span>Period '+(x.period+1)+'</span><b>'+clockText(x.elapsed)+'</b></div>').join(''):'<p class="sub">Tap “Mark moment” to note a moment in the match.</p>')+'</div></div></aside></div>'+
 '<div class="tl5-clock-foot">The timer keeps running when you navigate to another Touchline screen or lock your device, using your phone’s clock to calculate elapsed time when reopened. It is not an official referee timekeeper. Check the referee’s time for stoppages and the final whistle.</div></section>';
}
function updateClockDisplay(){
 displayOverviewClock();
 if(page!=='stopwatch')return;
 const c=normalizeClock(),p=c.segments[c.period],elapsed=segmentElapsed(p);
 const showing=c.countdown?c.lengthMin*60000-elapsed:elapsed;
 const txt=document.getElementById('tl5ClockReading');if(txt)txt.textContent=(showing<0?'-':'')+clockText(Math.abs(showing));
 const total=document.getElementById('tl5ClockTotal');if(total)total.textContent=clockText(clockTotal(c));
 const progress=document.getElementById('tl5ClockProgress');if(progress)progress.style.width=Math.min(100,100*elapsed/(c.lengthMin*60000))+'%';
 const status=document.getElementById('tl5ClockStatus');if(status)status.textContent=clockIsRunning(c)?'● RUNNING':'Ⅱ PAUSED';
 const extra=document.getElementById('tl5ClockExtra');if(extra)extra.textContent=elapsed>c.lengthMin*60000?'Additional time':'Period time';
 const start=document.getElementById('tl5ClockStart');if(start)start.textContent=clockIsRunning(c)?'Ⅱ Pause':'▶ Start';
 c.segments.forEach((s,i)=>{const d=document.getElementById('tl5Period'+i);if(d)d.textContent=clockText(segmentElapsed(s))});
}
host.tl5StartPause=function(){
 const c=normalizeClock();
 if(clockIsRunning(c)){stopAll(c)}
 else c.segments[c.period].since=now();
 save();updateClockDisplay();
};
host.tl5ChooseClock=function(id){
 if(!state.fixtures.some(f=>f.id===id&&f.type==='Match'))return;
 state.clockFixtureId=id;save();render();
};
host.tl5NextPeriod=function(){
 const c=normalizeClock();if(c.period>=c.count-1)return;
 stopAll(c);c.period++;save();render();
};
host.tl5Period=function(i){
 const c=normalizeClock();if(i<0||i>=c.count)return;
 stopAll(c);c.period=i;save();render();
};
host.tl5Reset=function(){
 const c=normalizeClock();
 if(!confirm('Reset the current fixture’s stopwatch and all period times?'))return;
 c.segments=Array.from({length:c.count},()=>({elapsed:0,since:null}));c.period=0;c.marks=[];save();render();
};
host.tl5SetPeriods=function(number){
 if(!Number.isInteger(number)||number<1||number>4)return;
 const c=normalizeClock();
 if(c.segments.some(s=>s.elapsed||s.since!=null)&&!confirm('Changing the number of periods can discard later recorded times. Continue?')){render();return}
 stopAll(c);c.count=number;c.period=clamp(c.period,0,number-1);
 while(c.segments.length<number)c.segments.push({elapsed:0,since:null});
 c.segments.length=number;
 if(!c.segments.some(s=>s.elapsed))c.lengthMin=Math.max(1,Math.round((Number(clockFixture()?.matchMinutes)||60)/number));
 save();render();
};
host.tl5Length=function(number){
 const c=normalizeClock();if(!Number.isInteger(number)||number<1||number>120){alert('Choose between 1 and 120 minutes per period.');render();return}
 c.lengthMin=number;save();render();
};
host.tl5Countdown=function(on){normalizeClock().countdown=!!on;save();render()};
host.tl5Mark=function(){
 const c=normalizeClock();c.marks.push({period:c.period,elapsed:segmentElapsed(c.segments[c.period]),at:now()});
 if(c.marks.length>60)c.marks=c.marks.slice(-60);
 save();render();
};
function markPageButton(){
 const nav=document.querySelector('.side');
 if(nav && !nav.querySelector('[data-page="stopwatch"]')){
  const el=document.createElement('button');
  el.className='nav';el.dataset.page='stopwatch';el.innerHTML='◷ <span>Match stopwatch</span>';
  const near=nav.querySelector('[data-page="match"]');
  if(near)near.insertAdjacentElement('afterend',el);else nav.appendChild(el);
  el.addEventListener('click',()=>setPage('stopwatch'));
 }
}
function addClockTile(){
 const home=document.querySelector('.tl3-tiles');
 if(!home||home.querySelector('[data-tl5-stopwatch]'))return;
 const tile=document.createElement('button');
 tile.type='button';tile.className='tl3-tile tl5-clock-tile';tile.dataset.tl5Stopwatch='true';
 tile.innerHTML='<span class="tl3-tile-top"><span>12 / TOUCHLINE</span><span class="tl3-arrow">↗</span></span><span class="tl3-tile-bottom"><i>◷</i><strong>Match stopwatch</strong><small>Large touchline clock, periods and match timing</small></span>';
 tile.onclick=()=>setPage('stopwatch');
 home.insertBefore(tile,home.children[3]||null);
}
function addDateAndTime(){
 const hero=document.querySelector('.tl3-hero-top');
 if(!hero||hero.querySelector('.tl5-datebox'))return;
 const el=document.createElement('div');el.className='tl5-datebox';
 el.innerHTML='<span id="tl5Today">'+dateLabel()+'</span><strong id="tl5Now">'+hourLabel()+'</strong>';
 hero.appendChild(el);
}
host.tl5ExpandSheet=function(){
 if(page!=='selection')return;
 sheetOpen=!sheetOpen;
 document.body.classList.toggle('tl5-sheet-modal',sheetOpen);
 const wrap=document.querySelector('.tl4-selection-wrap');
 wrap?.classList.toggle('tl5-expanded',sheetOpen);
 const button=document.getElementById('tl5ExpandSheet');
 if(button)button.textContent=sheetOpen?'✕ Close expanded view':'⛶ Expand team sheet';
};
function enhanceSheet(){
 if(page!=='selection'){if(sheetOpen){sheetOpen=false;document.body.classList.remove('tl5-sheet-modal')}return}
 const heading=document.querySelector('.tl4-pitch-heading');
 if(heading&&!heading.querySelector('#tl5ExpandSheet')){
  const el=document.createElement('button');el.className='btn alt sm tl5-expand-trigger';el.type='button';el.id='tl5ExpandSheet';
  el.textContent=sheetOpen?'✕ Close expanded view':'⛶ Expand team sheet';el.onclick=host.tl5ExpandSheet;heading.appendChild(el);
 }
 const shell=document.querySelector('.tl4-selection-wrap');
 shell?.classList.toggle('tl5-expanded',sheetOpen);
 document.body.classList.toggle('tl5-sheet-modal',sheetOpen);
}
function mount(){
 markPageButton();
 if(page==='home'){addDateAndTime();addClockTile();displayOverviewClock()}
 enhanceSheet();
 document.querySelectorAll('.nav').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
}
render=function(){
 if(page==='stopwatch'){
  const target=$('view');if(target)target.innerHTML=stopwatchPage();
  mount();updateClockDisplay();return;
 }
 previousRender();mount();
};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sheetOpen){sheetOpen=false;document.body.classList.remove('tl5-sheet-modal');render()}});
if(!clockTicker)clockTicker=setInterval(updateClockDisplay,300);
render();
})();