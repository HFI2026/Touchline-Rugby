/* Site-wide club theme, live preview and reliable contrast */
(function(){
'use strict';
const W=window;
function textFor(hex){
 const h=/^#[\da-f]{6}$/i.test(hex||'')?hex:'#25483c';
 const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
 const lum=c.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 return lum>.46?'#14221c':'#ffffff';
}
function theme(){
 const p=/^#[\da-f]{6}$/i.test(state.col||'')?state.col:'#25483c',
 a=/^#[\da-f]{6}$/i.test(state.accent||'')?state.accent:'#d9c9a6';
 const root=document.documentElement.style;
 root.setProperty('--primary',p);
 root.setProperty('--accent',a);
 root.setProperty('--tl4-on-primary',textFor(p));
 root.setProperty('--tl4-on-accent',textFor(a));
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',p);
}
document.addEventListener('input',e=>{
 if(e.target?.id==='clubCol'||e.target?.id==='clubAccent'){
  const value=e.target.value;
  if(!/^#[\da-f]{6}$/i.test(value))return;
  if(e.target.id==='clubCol')state.col=value;else state.accent=value;
  save();theme();
 }
});
const formerSaveSettings=saveSettings;
saveSettings=async function(){await formerSaveSettings();theme()};
W.touchlineApplyTheme=theme;
theme();
})();
