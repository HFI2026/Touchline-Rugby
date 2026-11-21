/* Touchline 2026/27 RFU rules library; summaries with official source links */
(function(){
const W=window;
const directory='https://help.rfu.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-';
const reg='https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby';
const half='https://help.rfu.com/support/solutions/articles/103000094875-what-is-the-half-game-rule-';
const specs={
 U7:[4,3,10,'20 × 12m','Tag rugby','No scrums','No line-outs','Free-pass restarts; non-contact tag play'],
 U8:[6,3,10,'Reduced pitch','Tag rugby','No scrums','No line-outs','Tag play; passing, spatial awareness and support'],
 U9:[7,3,15,'60 × 30m','Tackle introduced','No scrums','No line-outs','No rucks or mauls; no kicking'],
 U10:[8,4,15,'60 × 35m','Tackle, limited ruck/maul','Three nearest players, no push','No line-outs','Scrum-half passes; no kicking; free-pass restarts'],
 U11:[9,4,20,'60 × 43m','Developing contact','Three-player contested strike; no push','No line-outs','Scrum-half passes from scrum; drop-kick restarts'],
 U12:[12,4,20,'60 × 43m','Transitional contact','Five-player 3–2 scrum; no push','No line-outs','No conversions or drop goals; scrum-half must pass from scrum'],
 U13:[13,4,25,'90 × 60m','Transitional contact','Six-player 3–2–1 scrum','No line-outs','No flankers (6 or 7); scrum-half may pick and run'],
 U14:[15,4,25,'100 × 70m','Full team introduced','Eight-player 3–4–1 scrum','Uncontested; no lifting','Goal kicking introduced with age-grade restrictions'],
 U15:[15,5,30,'100 × 70m','Age-grade law variations','Eight-player scrum','Uncontested; lifting introduced','Six-minute sin bin; under-19 variations'],
 U16:[15,5,35,'100 × 70m','Age-grade law variations','Eight-player scrum','Contested line-outs','Seven-minute sin bin; under-19 variations'],
 U17:[15,5,35,'100 × 70m','Age-grade law variations','Eight-player scrum','Contested line-outs','Seven-minute sin bin; Half Game Rule'],
 U18:[15,5,35,'100 × 70m','Age-grade law variations','Eight-player scrum','Contested line-outs','Seven-minute sin bin; Half Game Rule'],
 Senior:[15,5,40,'100 × 70m','World Rugby adult laws','Eight-player scrum','Contested line-outs','Competition-specific changes may apply']
};
const extras={
 U7:['Players use tags instead of tackles. Coaching prioritises running, passing and safe participation.','No contact breakdown, scrums or line-outs. Check the appendix for scoring and restart conditions.'],
 U8:['Six-a-side tag rugby. No tackling; play resumes according to tag rules.','Encourage all players to carry, support and pass.'],
 U9:['Introduction of the tackle only; no formed scrum, ruck, maul or line-out.','Shorter 15-minute halves and adapted free-pass restarts.'],
 U10:['The nearest three players form a no-push scrum. The scrum-half must pass away.','Rucks and mauls have strict participant limits. Free-pass restarts replace kicking.'],
 U11:['Three-person scrum: contest the hook but no pushing. Scrum-half passes.','Ruck/maul involvement remains limited; kicking from hand has restrictions.'],
 U12:['Five-player scrum in a 3–2 formation, no push. Scrum-half cannot run directly from it.','No line-outs; free pass 5 metres from touch. No conversions, box kicks or drop goals.'],
 U13:['Six-player 3–2–1 scrum: 1, 2, 3, 4, 5 and 8. No flankers 6 or 7. Maximum 1.5m push and 45-degree wheel.','Scrum-half may run from the scrum, while number eight cannot pick up at the base. No formed line-outs; restart with a free pass 10m from touch.'],
 U14:['Eight-person scrum; age-grade push and wheel restrictions apply.','Uncontested line-out introduced with no lifting.'],
 U15:['Line-out lifting introduced under age-grade conditions; line-out remains uncontested.','World Rugby laws are subject to the RFU and under-19 variations.'],
 U16:['Contested line-out begins; safe lifting and player competency remain essential.','Scrums, tackles, and eligibility are governed by age-grade law variations.'],
 U17:['Age-grade rules continue; playing in adult rugby requires following RFU eligibility conditions.','Scrum and line-out safety restrictions still apply.'],
 U18:['Under-19 and RFU age-grade variations continue.','Check applicable competition and player-eligibility arrangements.'],
 Senior:['Standard senior rugby law framework.','Match details and substitution regulations may vary by competition.']
};
W.touchlineRuleSpecs=specs;
let selected=state.age,view='key';
const link=(href,label)=>'<a class="tl4-source" target="_blank" rel="noopener noreferrer" href="'+href+'">'+label+' ↗</a>';
function renderRules(){
 const r=specs[selected]||specs.Senior;
 const cards=[['Players',r[0]],['Ball size',r[1]],['Max minutes / half',r[2]],['Max pitch',r[3]],['Scrum',r[5]],['Touch / line-out',r[6]]];
 const headRow='<div class="tl4-rules-head"><div><span class="tl4-eyebrow">RFU / 2026–27</span><h2>Know your game.</h2><p>Clear age-grade guidance for coaches and parents.</p></div><label class="tl4-age-select"><small>Age group</small><select class="field" onchange="tl4RuleAge(this.value)">'+Object.keys(specs).map(k=>'<option '+(k===selected?'selected':'')+'>'+k+'</option>').join('')+'</select></label></div>';
 const stats='<div class="tl4-rule-statgrid">'+cards.map(([a,b])=>'<div><small>'+esc(a)+'</small><strong>'+esc(b)+'</strong></div>').join('')+'</div>';
 const summary='<div class="tl4-bullets">'+[r[4],r[7],...extras[selected]].map(v=>'<div><span>✓</span>'+esc(v)+'</div>').join('')+'</div>';
 const detail='<div class="tl4-rule-detail">'+[
 ['Game format',r[0]+' players maximum, '+r[2]+'-minute maximum halves, ball size '+r[1]+', maximum pitch '+r[3]+'.'],
 ['Contact and breakdown',r[4]+'. '+extras[selected][0]],
 ['Scrum',r[5]+'. '+(selected==='U13'?'Six players are positions 1, 2, 3, 4, 5 and 8; 6 and 7 are omitted.':'Check the relevant RFU appendix for age-specific roles and safety.')],
 ['Touch, line-outs and kicks',r[6]+'. '+r[7]+'.'],
 ['Player welfare',selected==='Senior'?'Consult the senior competition regulations.':'The RFU Half Game Rule applies. Select and substitute players so they receive at least half the available playing time; tackle height and eligibility restrictions also apply.']
 ].map(([h,txt])=>'<div><h3>'+esc(h)+'</h3><p>'+esc(txt)+'</p></div>').join('')+'</div>';
 return head('RFU rules','Age-grade differences, key rules and direct links to authoritative regulations.')+
 '<section class="tl4-rules">'+headRow+'<div class="tl4-age-rail">'+Object.keys(specs).map(k=>'<button class="'+(k===selected?'active':'')+'" onclick="tl4RuleAge(\''+k+'\')">'+k+'</button>').join('')+'</div>'+
 '<div class="tl4-rulebody"><div class="tl4-rule-title"><div><span class="tl4-eyebrow">'+esc(r[4])+'</span><h2>'+esc(selected)+' Rugby</h2></div><div class="tl4-rule-views"><button class="'+(view==='key'?'active':'')+'" onclick="tl4RuleView(\'key\')">Key details</button><button class="'+(view==='detail'?'active':'')+'" onclick="tl4RuleView(\'detail\')">Detailed guide</button></div></div>'+stats+(view==='key'?summary:detail)+
 '<div class="tl4-rule-sources"><div><strong>Official RFU rules</strong><p>This is an original practical guide, not a complete reproduction of RFU regulations. Use the official appendix for full text and check competition/sex-specific variations before refereeing or coaching.</p></div><div>'+link(directory,'Full age-grade rules')+link(reg,'Regulation 15')+link(half,'Half Game Rule')+'</div></div></div></section>';
}
W.tl4RuleAge=function(age){if(!specs[age])return;selected=age;render()};
W.tl4RuleView=function(mode){view=mode==='detail'?'detail':'key';render()};
const rootRender=render;
render=function(){if(page==='rules'){$('view').innerHTML=renderRules();document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));return}rootRender()};
const bar=document.querySelector('.side');
if(bar&&!bar.querySelector('[data-page="rules"]')){
 const nav=document.createElement('button');nav.className='nav';nav.dataset.page='rules';nav.innerHTML='§ <span>RFU rules</span>';
 const near=bar.querySelector('[data-page="leagues"]');
 if(near)near.insertAdjacentElement('afterend',nav);else bar.appendChild(nav);
 nav.addEventListener('click',()=>setPage('rules'));
}
W.touchlineRulesReady=true;
})();