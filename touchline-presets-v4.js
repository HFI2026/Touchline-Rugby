/* Touchline formation presets V4 — age-specific player positions, collision-free schematic layouts */
(function(){
'use strict';
const W=window;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const clone=o=>JSON.parse(JSON.stringify(o));
const allIds=()=>W.touchlineAgePositions();
function separate(scene){
 const used=[];const min=10;
 for(const side of ['attack','defence']){
   for(const id of allIds()){
     const initial=scene[side][id]||{x:side==='attack'?30:70,y:50};
     let point={x:clamp(Number(initial.x)||50,6,94),y:clamp(Number(initial.y)||50,6,94)};
     const available=p=>used.every(u=>Math.hypot(p.x-u.x,p.y-u.y)>=min);
     if(!available(point)){
       let found=false;
       for(let radius=2;radius<=60&&!found;radius+=2){
         for(let i=0;i<36;i++){const a=2*Math.PI*i/36,candidate={x:clamp(point.x+radius*Math.cos(a),6,94),y:clamp(point.y+radius*Math.sin(a),6,94)};
          if(available(candidate)){point=candidate;found=true;break}
         }
       }
     }
     scene[side][id]={x:+point.x.toFixed(2),y:+point.y.toFixed(2)};
     used.push(point);
   }
 }
 return scene;
}
W.tl3Preset=function(id){
 const m=W.touchlineFormation?.(id);
 if(!m){alert('Unknown formation preset.');return}
 if(m.error){alert(m.error);return}
 const play=state.plays?.find(p=>p.id===state.activePlay)||state.plays?.[0];
 if(!play?.frames?.length)return;
 if(!confirm('Apply '+m.name+' to this step? Other animation steps will stay unchanged.'))return;
 const index=clamp(Number(state.activeFrame)||0,0,play.frames.length-1),step=play.frames[index];
 const scene=separate(clone(m));
 step.positions=scene.attack;step.opposition=scene.defence;step.ball=scene.ball;
 play.preset=id;play.ageSchemaV4=true;
 save();render();
};
const oldRender=render;
render=function(){
 oldRender();
 if(page!=='tactics')return;
 const select=document.getElementById('tl3PresetSelect');
 if(!select)return;
 select.querySelectorAll?.('option').forEach(opt=>{
  if(!opt.value)return;
  opt.disabled=state.code!=='Union'||(opt.value.startsWith('lineout')&&size()<15)||(opt.value.startsWith('scrum')&&size()<=7);
 });
};
W.touchlineFormationVersion=4;
})();
