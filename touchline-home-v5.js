/* Touchline Club Home V5 — bespoke editorial landing experience */
(function(){
'use strict';
const menu=[
 {page:'selection',name:'Team selection',line:'Build your line-up. Every player, every position.',icon:'selection',featured:true},
 {page:'tactics',name:'Move studio',line:'Draw formations and bring rugby plays to life.',icon:'tactics',featured:true},
 {page:'stopwatch',name:'Match stopwatch',line:'Big, easy match timing for the touchline.',icon:'stopwatch',featured:true},
 {page:'match',name:'Match centre',line:'Scores, match events and reports.',icon:'match'},
 {page:'calendar',name:'Fixtures & diary',line:'What’s coming up for your team.',icon:'diary'},
 {page:'attendance',name:'Attendance',line:'Training and match participation.',icon:'attendance'},
 {page:'awards',name:'Player awards',line:'Parents’ votes and coaches’ choices.',icon:'awards'},
 {page:'squad',name:'Player squad',line:'Your people and their positions.',icon:'squad'},
 {page:'rules',name:'RFU rules',line:'Clear guidance for each age grade.',icon:'rules'},
 {page:'leagues',name:'Leagues & results',line:'Follow the wider world of rugby.',icon:'leagues'},
 {page:'insights',name:'Season insights',line:'Meaningful statistics for coaches.',icon:'insights'},
 {page:'settings',name:'Club settings',line:'Your club identity and preferences.',icon:'settings'}
];
function symbol(name){
 const shapes={
 selection:'<rect x="5" y="6" width="38" height="40" rx="3"/><path d="M5 20h38M5 32h38M24 6v40" opacity=".55"/><circle cx="14" cy="13" r="3"/><circle cx="34" cy="13" r="3"/><circle cx="24" cy="27" r="3"/><circle cx="14" cy="39" r="3"/><circle cx="34" cy="39" r="3"/>',
 tactics:'<path d="M5 36c9 0 7-20 19-20 8 0 7 16 18 16"/><path d="m35 27 7 5-8 5"/><circle cx="8" cy="12" r="5"/><circle cx="24" cy="16" r="5"/><circle cx="37" cy="12" r="5"/><path d="M8 29v13m16-7v7" stroke-dasharray="2 4"/>',
 stopwatch:'<circle cx="24" cy="27" r="18"/><path d="M24 27V16m0 11 9 5M19 4h10m-5 0v5m14-1 4 4"/><circle cx="24" cy="27" r="1.5" fill="currentColor" stroke="none"/>',
 match:'<rect x="5" y="9" width="38" height="30" rx="4"/><path d="M5 20h38M24 9v30"/><path d="m13 30 4 4 7-8m6 5h6"/><path d="M15 4h18M18 44h12"/>',
 diary:'<rect x="6" y="9" width="36" height="34" rx="4"/><path d="M6 19h36M16 5v8M32 5v8M15 28h6m6 0h6M15 35h6m6 0h6"/>',
 attendance:'<circle cx="18" cy="16" r="6"/><path d="M5 39v-4c0-8 5-12 13-12 6 0 11 2 13 7"/><circle cx="35" cy="14" r="5"/><path d="m31 37 5 5 9-11"/>',
 awards:'<path d="M14 8h20v12c0 9-5 15-10 15s-10-6-10-15V8Z"/><path d="M14 12H7v7c0 6 5 10 12 10m15-17h7v7c0 6-5 10-12 10M24 35v7m-9 2h18"/><path d="m24 14 2 4 4 .5-3 3 .6 4-3.6-2-3.6 2 .6-4-3-3 4-.5Z"/>',
 squad:'<circle cx="24" cy="14" r="7"/><path d="M11 41v-5c0-7 5-12 13-12s13 5 13 12v5H11Z"/><path d="M9 27c-5 1-7 5-7 10v4h7M39 27c5 1 7 5 7 10v4h-7"/><path d="M8 12a5 5 0 1 1 0 10m32-10a5 5 0 1 0 0 10"/>',
 rules:'<path d="M24 10c-6-5-13-6-20-3v33c8-3 14-2 20 3 6-5 12-6 20-3V7c-7-3-14-2-20 3Z"/><path d="M24 10v33M10 17h8m-8 7h8m12-7h8m-8 7h8"/>',
 leagues:'<path d="M6 42h36M11 42V31h8v11m5 0V20h8v22m5 0V28h6v14"/><path d="m26 6 2 5 6 .5-4.4 4 1.3 6-5-3-5 3 1.3-6-4.4-4 6-.5Z"/>',
 insights:'<rect x="5" y="6" width="38" height="36" rx="4"/><path d="M13 33V26m9 7V17m9 16V23m8 10V12"/><path d="M10 37h30M14 17l8-6 9 6 7-8" opacity=".6"/>',
 settings:'<path d="M8 12h32M8 24h32M8 36h32"/><circle cx="19" cy="12" r="5" fill="var(--tl5-card-bg,#fffefa)"/><circle cx="30" cy="24" r="5" fill="var(--tl5-card-bg,#fffefa)"/><circle cx="16" cy="36" r="5" fill="var(--tl5-card-bg,#fffefa)"/>'
 };
 return '<svg class="tl5-home-icon-svg" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name]||shapes.selection)+'</svg>';
}
function homeTile(card){
 return '<button type="button" class="tl5-home-tile '+(card.featured?'tl5-featured ':'')+'tl5-home-'+card.icon+'" onclick="setPage(\''+card.page+'\')" aria-label="Open '+esc(card.name)+'">'+
 '<span class="tl5-home-tile-icon">'+symbol(card.icon)+'</span>'+
 '<span class="tl5-home-tile-bottom"><span class="tl5-home-tile-copy"><strong>'+esc(card.name)+'</strong><span>'+esc(card.line)+'</span></span><span class="tl5-home-arrow" aria-hidden="true">↗</span></span></button>';
}
function crestMarkup(){
 const badge=state.badge||'';
 return badge?'<img src="'+esc(badge)+'" alt="'+esc(state.club)+' crest" class="tl3-clubcrest" loading="eager" onerror="this.hidden=true;this.parentElement.classList.add(\'tl5-image-failed\')">':
 '<svg class="tl5-home-crest-fallback" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg" aria-label="Club crest placeholder" role="img"><path d="M50 6 90 20v35c0 27-17 45-40 56C27 100 10 82 10 55V20Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m33 49 34 0M50 31v42" stroke="currentColor" stroke-width="3" opacity=".55"/><text x="50" y="92" fill="currentColor" font-size="13" text-anchor="middle" font-family="sans-serif" font-weight="700">RFC</text></svg>';
}
function formattedEvent(){
 const next=upcoming()[0];
 if(!next)return {title:'Your next event',when:'No upcoming fixtures or training',detail:'Start by adding an event',empty:true};
 return {title:next.type==='Match'?'vs '+esc(next.opposition||'Opposition'):'Training session',when:dt(next.date)+' · '+esc(next.time||'Time TBC'),detail:esc(next.venue||'Venue TBC'),empty:false};
}
home=function(){
 const ev=formattedEvent();
 return '<div class="tl5-home" id="tl5Home">'+
 '<section class="tl3-hero tl5-home-hero">'+
 '<div class="tl3-hero-top"><div class="tl3-crestwrap tl5-home-crest">'+crestMarkup()+'</div><div class="tl5-home-hero-tag">YOUR CLUB / YOUR TOUCHLINE</div></div>'+
 '<div class="tl5-home-hero-main"><div class="tl5-home-intro"><span class="tl5-home-strap">WELCOME BACK TO TOUCHLINE</span><h1>'+esc(state.club)+'</h1><p>'+esc(state.team)+'</p></div>'+
 '<button type="button" class="tl5-home-next" onclick="setPage(\'calendar\')"><span class="tl5-home-next-top"><span>NEXT IN YOUR DIARY</span><span class="tl5-home-next-arrow">↗</span></span><strong>'+ev.title+'</strong><span class="tl5-home-next-meta">'+ev.when+'</span><span class="tl5-home-next-venue">'+ev.detail+'</span></button></div>'+
 '</section>'+
 '<div class="tl5-home-section"><div><span class="tl5-home-section-label">CLUB HUB</span><h2>Ready when you are.</h2></div><p>Everything for training, selection and match day — one tap away.</p></div>'+
 '<div class="tl5-launchpad" role="group" aria-label="Touchline app sections">'+menu.map(homeTile).join('')+'</div>'+
 '<div class="tl5-home-caution">This demonstration currently stores team information only on your device. Avoid entering real children’s personal information until secure shared storage is available.</div>'+
 '</div>';
};
window.touchlineHomeVersion='5.0';
render();
})();
