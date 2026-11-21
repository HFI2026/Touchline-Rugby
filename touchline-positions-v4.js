/* Age grade position registry and coaching formations; local only */
(function(){
'use strict';
const W=window;
const roles={1:'Loosehead prop',2:'Hooker',3:'Tighthead prop',4:'Second row',5:'Second row',6:'Blindside flanker',7:'Openside flanker',8:'Number eight',9:'Scrum-half',10:'Fly-half',11:'Left wing',12:'Inside centre',13:'Outside centre',14:'Right wing',15:'Full-back'};
const canonical12=[1,2,3,4,5,9,10,11,12,13,14,15];
const canonical13=[1,2,3,4,5,8,9,10,11,12,13,14,15];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function positions(){
 const n=size();if(state.code!=='Union')return Array.from({length:n},(_,i)=>i+1);
 if(n===12&&state.age==='U12')return canonical12.slice();
 if(n===13&&state.age==='U13')return canonical13.slice();
 if(n===15)return Array.from({length:15},(_,i)=>i+1);
 return Array.from({length:n},(_,i)=>i+1);
}
function role(number){
 if(state.code!=='Union')return 'Player';
 if(size()<=9){if(size()>=8&&number<=3)return 'Scrum participant';if(number===9)return 'Scrum-half';return 'Player'}
 if(size()<=11){if(number<=3)return 'Scrum participant';if(number===9)return 'Scrum-half';return 'Player'}
 return roles[number]||'Player';
}
const fifteen={
 1:[24,16],2:[50,16],3:[76,16],4:[39,29],5:[61,29],6:[15,41],7:[85,41],8:[50,43],
 9:[45,54],10:[59,61],11:[15,81],12:[69,70],13:[81,79],14:[89,91],15:[49,91]
};
function selectionPoints(){
 const ids=positions();const out={};
 if(size()>=12){for(const id of ids){const p=fifteen[id]||[50,50];out[id]={x:p[0],y:p[1]}}return out}
 const count=ids.length;
 const rows=[ids.slice(0,Math.min(3,count)),ids.slice(3,6),ids.slice(6,9),ids.slice(9,12),ids.slice(12)];
 rows.filter(r=>r.length).forEach((row,i)=>row.forEach((id,j)=>{
  out[id]={x:(100/(row.length+1))*(j+1),y:18+i*16};
 }));return out;
}
function defaultScene(){
 const ids=positions(),a={},d={},n=ids.length;
 if(n>=12){
  const p={1:[23,27],2:[23,43],3:[23,59],4:[33,36],5:[33,54],6:[36,15],7:[36,79],8:[42,46],
   9:[43,58],10:[49,69],11:[38,8],12:[57,59],13:[63,70],14:[49,93],15:[29,89]};
  ids.forEach((id,j)=>{const pt=p[id]||[24+j*2,15+j*4];a[id]={x:pt[0],y:pt[1]}});
 } else {
  ids.forEach((id,j)=>{const cols=Math.ceil(Math.sqrt(n)),col=j%cols,row=Math.floor(j/cols);a[id]={x:20+col*8,y:15+row*(70/Math.max(1,Math.ceil(n/cols)-1))}})
 }
 ids.forEach((id,j)=>{
   if(id===15)d[id]={x:91,y:50};
   else if(id===11)d[id]={x:83,y:8};
   else if(id===14)d[id]={x:83,y:92};
   else {const index=ids.filter(k=>![11,14,15].includes(k)).indexOf(id);d[id]={x:72+(index%2)*5,y:11+Math.floor(index/2)*12}}
 });
 return {attack:a,defence:d,ball:{x:45,y:51}};
}
function setScrum(out,side,where){
 const ids=positions(),y=where==='left'?26:where==='right'?74:50,front=side==='attack'?47:53,dir=side==='attack'?-1:1;
 const relative={
  1:[0,-9],2:[0,0],3:[0,9],4:[-7,-4.5],5:[-7,4.5],
  6:[-7,-14],7:[-7,14],8:[-14,0]
 };
 const coords=ids.length>=12?relative:{1:[0,-9],2:[0,0],3:[0,9]};
 ids.filter(k=>k<=8).forEach(k=>{const xy=coords[k];if(xy)out[k]={x:front+xy[0]*(-dir),y:clamp(y+xy[1],7,93)}});
 if(ids.length<12){let j=0;ids.filter(k=>k>3).forEach(k=>{out[k]={x:clamp(front+dir*(11+6*Math.floor(j/3)),7,93),y:clamp(24+(j%3)*26,7,93)};j++})}
 else {
  const backs={9:[dir*12,0],10:[dir*19,10],12:[dir*24,21],13:[dir*30,32],11:[dir*18,-36],14:[dir*32,42],15:[dir*35,-18]};
  ids.filter(k=>k>8).forEach(k=>{const xy=backs[k]||[0,0];out[k]={x:clamp(front+xy[0],6,94),y:clamp(y+xy[1],6,94)}});
 }
}
function setLineout(out,side,where){
 const ids=positions(),edge=where==='left'?8:92,sign=edge<50?1:-1,x=side==='attack'?43:57,back=side==='attack'?-1:1;
 const forward=[1,4,5,6,7,8,3].filter(k=>ids.includes(k));
 forward.forEach((k,i)=>out[k]={x:x+back*((i%2)*4),y:clamp(edge+sign*(12+i*8),7,93)});
 if(ids.includes(2))out[2]={x:x+back*4,y:edge};
 if(ids.includes(9))out[9]={x:x+back*14,y:clamp(edge+sign*20,7,93)};
 let j=0;ids.filter(k=>k>=10).forEach(k=>{out[k]={x:clamp(x+back*(18+(j%4)*7),7,93),y:clamp(15+j*12,8,92)};j++});
}
function setPhase(out,side,scheme){
 const ids=positions(),front=side==='attack'?33:68,dir=side==='attack'?-1:1;
 const forward=ids.filter(id=>id<=8),bands=scheme==='242'?[[1,2],[3,4,5,6],[7,8]]:[[1],[2,3,4],[5,6,7],[8]];
 let j=0;
 bands.forEach((band,b)=>band.filter(k=>forward.includes(k)).forEach((k,i)=>{
  out[k]={x:front+dir*(9+i*5),y:clamp(13+b*(74/Math.max(1,bands.length-1))+(i-(band.length-1)/2)*5,7,93)};
  j++;
 }));
 let i=0;ids.filter(k=>k>=9).forEach(k=>{
  const custom={9:[47,47],10:[52,58],11:[44,10],12:[60,57],13:[65,69],14:[54,90],15:[29,89]};
  const q=custom[k]||[50+i*3,15+i*8];out[k]={x:side==='attack'?q[0]:100-q[0],y:q[1]};i++;
 });
}
function formation(id){
 const stage=defaultScene(),m=String(id||'').match(/^(scrum|lineout)-(attack|defence)-(left|centre|right)$/);
 const names={'attack-open':'Open-play attacking shape','attack-1331':'1–3–3–1 phase attack','attack-242':'2–4–2 phase attack','defence-line':'Defensive line and backfield cover'};
 if(id==='attack-open'||id==='attack-1331'||id==='attack-242')setPhase(stage.attack,'attack',id==='attack-242'?'242':'1331');
 else if(id==='defence-line')stage.attack=defaultScene().attack;
 else if(m){
  const [,type,side,where]=m;
  if(type==='lineout' && (size()<15||state.age==='U13'||state.age==='U12'))return {error:'This age grade does not play formed line-outs. Choose a suitable free-pass restart instead.'};
  if(type==='scrum' && size()<=7)return {error:'This age-grade format has no scrums.'};
  if(type==='scrum'){
    setScrum(stage.attack,'attack',where);setScrum(stage.defence,'defence',where);
    stage.ball={x:47,y:where==='left'?26:where==='right'?74:50};
  }else{
    setLineout(stage.attack,'attack',where);setLineout(stage.defence,'defence',where);
    stage.ball={x:39,y:where==='left'?8:92};
  }
  return {...stage,name:(type==='scrum'?'Scrum':'Line-out')+' · '+where+' · '+side};
 }else return null;
 return {...stage,name:names[id]||'Rugby formation'};
}
W.touchlineAgePositions=positions;
W.touchlineAgeRole=role;
W.touchlineAgePitchPoint=selectionPoints;
W.touchlineAgeScene=defaultScene;
W.touchlineFormation=formation;
})();
