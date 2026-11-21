/* Touchline V6 — club badge framing, responsive rugby selection and PNG team-sheet studio */
(function(){
'use strict';
const W=window, oldRender=render;
let crop=null, exportDataUrl='', exportName='',zoom=1;
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
const within=(v,a,b)=>Math.max(a,Math.min(b,v));
const goodHex=(s,d)=>/^#[\da-f]{6}$/i.test(s||'')?s:d;
const col=()=>goodHex(state.col,'#244736'),accent=()=>goodHex(state.accent,'#e5d0a8');
const ids=()=>W.touchlineAgePositions();
const posModel={
 1:[18,12],2:[50,12],3:[82,12],
 4:[35,24],5:[65,24],
 6:[16,36],7:[84,36],8:[50,36],
 9:[38,47],10:[53,57],
 11:[17,78],12:[68,67],13:[72,79],14:[86,91],15:[47,92]
};
function selectionCoords(){
 const roster=ids(),points={};
 if(roster.length>=12){
  for(const id of roster){const p=posModel[id]||[50,50];points[id]={x:p[0],y:p[1]}}
  if(!roster.includes(8)&&roster.includes(9))points[9]={x:40,y:43};
  return points;
 }
 const rows=[roster.slice(0,3),roster.slice(3,6),roster.slice(6,9),roster.slice(9,12),roster.slice(12)];
 rows.filter(row=>row.length).forEach((row,j)=>row.forEach((id,i)=>{
  points[id]={x:row.length===1?50:row.length===2?(i?68:32):[18,50,82][i],y:18+j*16};
 }));
 return points;
}
W.touchlineAgePitchPoint=selectionCoords;
const htmlEsc=s=>esc(s);
function cropImage(src){
 if(!src){alert('Upload a club badge first, or save a badge image URL.');return}
 const img=new Image();
 if(/^https?:/i.test(src))img.crossOrigin='anonymous';
 img.onload=()=>{
  crop={img,cx:img.naturalWidth/2,cy:img.naturalHeight/2,zoom:1,baseline:1,source:src};
  openCropUI();
  cropAutoFit(false);
 };
 img.onerror=()=>alert('This image cannot be opened for cropping. If it is hosted on another site, download it and upload the image directly instead.');
 img.src=src;
}
function renderCrop(){
 if(!crop)return;
 const canvas=document.getElementById('tl6CropCanvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d'),size=canvas.width,im=crop.img;
 const cover=Math.max(size/im.naturalWidth,size/im.naturalHeight),scale=cover*crop.zoom;
 ctx.clearRect(0,0,size,size);
 ctx.fillStyle='#e4e8e1';ctx.fillRect(0,0,size,size);
 ctx.drawImage(im,size/2-crop.cx*scale,size/2-crop.cy*scale,im.naturalWidth*scale,im.naturalHeight*scale);
 const value=document.getElementById('tl6CropZoomValue');
 if(value)value.textContent=Math.round(crop.zoom*100)+'%';
 const range=document.getElementById('tl6CropZoom');
 if(range)range.value=Math.round(crop.zoom*100);
}
function cropAutoFit(quiet){
 if(!crop)return;
 const img=crop.img,small=document.createElement('canvas');
 const factor=Math.min(1,360/Math.max(img.naturalWidth,img.naturalHeight));
 small.width=Math.max(1,Math.round(img.naturalWidth*factor));
 small.height=Math.max(1,Math.round(img.naturalHeight*factor));
 const cx=small.getContext('2d',{willReadFrequently:true});
 cx.drawImage(img,0,0,small.width,small.height);
 let data;
 try{data=cx.getImageData(0,0,small.width,small.height).data}
 catch(err){if(!quiet)alert('Automatic trimming is unavailable for this remote image. Upload the original image to crop it.');renderCrop();return}
 let left=small.width,top=small.height,right=-1,bottom=-1,found=0;
 // Identify image detail while ignoring transparent and near-white border pixels.
 for(let y=0;y<small.height;y+=2)for(let x=0;x<small.width;x+=2){
  const k=(y*small.width+x)*4,r=data[k],g=data[k+1],b=data[k+2],a=data[k+3];
  if(a<32)continue;
  if(r>235&&g>235&&b>235)continue;
  if(Math.max(r,g,b)-Math.min(r,g,b)<8 && r>220)continue;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);found++;
 }
 if(found>6&&right>left&&bottom>top){
  const W0=(right-left+1)/factor,H0=(bottom-top+1)/factor;
  crop.cx=(left+right)/2/factor;crop.cy=(top+bottom)/2/factor;
  const cover=Math.max(1/img.naturalWidth,1/img.naturalHeight);
  const want=(1/Math.max(W0,H0)/cover)/1.09;
  crop.zoom=limit(want,.6,8);
 } else if(!quiet)alert('Could not detect white margins. You can still zoom and drag the badge manually.');
 renderCrop();
}
function exportCrop(){
 const canvas=document.createElement('canvas'),res=640;
 canvas.width=canvas.height=res;
 const ctx=canvas.getContext('2d'),img=crop.img,scale=Math.max(res/img.naturalWidth,res/img.naturalHeight)*crop.zoom;
 // Preserve original transparent pixels; do not erase white portions within club crests.
 ctx.clearRect(0,0,res,res);
 ctx.drawImage(img,res/2-crop.cx*scale,res/2-crop.cy*scale,img.naturalWidth*scale,img.naturalHeight*scale);
 return canvas.toDataURL('image/png');
}
function finishCrop(){
 if(!crop)return;
 let result;
 try{result=exportCrop()}catch(e){alert('This image cannot be exported due to remote image permissions. Upload the file directly and retry.');return}
 // Cap the eventual localStorage footprint, using PNG first and JPEG only when necessary.
 if(result.length>1250000){
  const tmp=document.createElement('canvas');tmp.width=tmp.height=560;
  const context=tmp.getContext('2d');
  context.drawImage(document.getElementById('tl6CropCanvas'),0,0,560,560);
  const fallback=tmp.toDataURL('image/jpeg',.87);
  if(fallback.length<result.length)result=fallback;
 }
 state.badge=result;
 const badgeInput=document.getElementById('clubBadge');if(badgeInput)badgeInput.value=result;
 const upload=document.getElementById('badgeUpload');if(upload)upload.value='';
 crop=null;
 const overlay=document.getElementById('tl6CropEditor');overlay?.remove();
 document.body.classList.remove('tl6-crop-open');
 save();render();
}
function closeCrop(){
 crop=null;document.getElementById('tl6CropEditor')?.remove();document.body.classList.remove('tl6-crop-open')
}
W.tl6CloseCrop=closeCrop;W.tl6ApplyCrop=finishCrop;W.tl6AutoCrop=()=>cropAutoFit(false);
W.tl6CropZoom=function(val){if(!crop)return;crop.zoom=limit(Number(val)/100,.6,8);renderCrop()};
W.tl6OpenBadge=function(){
 const field=document.getElementById('clubBadge');
 cropImage((field?.value||'').trim()||state.badge);
};
function openCropUI(){
 document.getElementById('tl6CropEditor')?.remove();
 const modal=document.createElement('div');modal.className='tl6-crop-editor';modal.id='tl6CropEditor';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Crop club badge');
 modal.innerHTML='<div class="tl6-crop-window"><div class="tl6-crop-header"><div><h2>Crop your club crest</h2><p>Fill the badge frame. Drag to reposition and zoom to remove extra white margins.</p></div><button type="button" class="tl6-crop-close" onclick="tl6CloseCrop()" aria-label="Close crop editor">×</button></div>'+
 '<div class="tl6-crop-canvas-box"><canvas id="tl6CropCanvas" width="420" height="420" aria-label="Drag the badge to position it in the crop frame"></canvas></div>'+
 '<label class="tl6-crop-zoom"><div><span>Zoom</span><span id="tl6CropZoomValue">100%</span></div><input id="tl6CropZoom" type="range" min="60" max="800" step="2" value="100" oninput="tl6CropZoom(this.value)"></label>'+
 '<div class="tl6-crop-actions"><button class="btn alt" onclick="tl6AutoCrop()" type="button">Auto-fit crest</button><div><button class="btn alt" onclick="tl6CloseCrop()" type="button">Cancel</button><button class="btn" onclick="tl6ApplyCrop()" type="button">Apply badge</button></div></div>'+
 '<p class="tl6-crop-tip">The crop is saved privately on this device. The original photo is not uploaded to any server.</p></div>';
 document.body.appendChild(modal);document.body.classList.add('tl6-crop-open');
 const canvas=document.getElementById('tl6CropCanvas');
 let drag=null;
 canvas.addEventListener('pointerdown',event=>{
  event.preventDefault();drag={id:event.pointerId,x:event.clientX,y:event.clientY,cx:crop.cx,cy:crop.cy};
  canvas.setPointerCapture?.(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId||!crop)return;
  const box=canvas.getBoundingClientRect(),factor=canvas.width/Math.max(1,box.width);
  const scale=Math.max(canvas.width/crop.img.naturalWidth,canvas.width/crop.img.naturalHeight)*crop.zoom;
  crop.cx=drag.cx-(event.clientX-drag.x)*factor/scale;
  crop.cy=drag.cy-(event.clientY-drag.y)*factor/scale;
  renderCrop();
 });
 const end=()=>{drag=null};
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 modal.addEventListener('click',event=>{if(event.target===modal)closeCrop()});
 renderCrop();
}
function settingsBadge(){
 if(page!=='settings')return;
 const upload=document.getElementById('badgeUpload');
 if(!upload)return;
 const host=upload.closest('label')||upload.parentElement;
 if(!host||document.getElementById('tl6BadgeSettings'))return;
 const el=document.createElement('div');el.className='tl6-crest-settings';el.id='tl6BadgeSettings';
 const badge=state.badge||'';
 el.innerHTML='<h3>Club crest display</h3><p>Upload a badge, then crop and zoom so the emblem fills its frame on your club overview. Uploads and edits stay on this device.</p>'+
 '<div class="tl6-badge-preview">'+(badge?'<img alt="Current club badge preview" src="'+htmlEsc(badge)+'">':'<div class="tl6-badge-blank">RFC</div>')+
 '<div><strong>Current badge</strong><div class="tl6-badge-tools"><button type="button" class="btn alt" onclick="tl6OpenBadge()">Crop / zoom badge</button></div></div></div>';
 host.insertAdjacentElement('afterend',el);
 upload.addEventListener('change',event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){upload.value='';alert('Please choose a PNG, JPG or WebP badge.');return}
  if(file.size>8*1024*1024){upload.value='';alert('Please select an image below 8MB.');return}
  const reader=new FileReader();
  reader.onload=()=>{upload.value='';cropImage(String(reader.result))};
  reader.onerror=()=>{upload.value='';alert('Could not load that badge image.')};
  reader.readAsDataURL(file);
 });
}
/* Export a polished vector-like raster image without taking a screenshot of scrolling UI. */
function roundRect(ctx,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
 ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function fill(ctx,color,x,y,w,h,r=0){ctx.fillStyle=color;roundRect(ctx,x,y,w,h,r);ctx.fill()}
function inkFor(hex){
 const s=goodHex(hex,'#25483c');const rgb=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>165?'#173224':'#fffef9';
}
function fitText(ctx,text,maxWidth,start=20,min=11){
 for(let f=start;f>=min;f--){ctx.font='700 '+f+'px system-ui, -apple-system, sans-serif';if(ctx.measureText(text).width<=maxWidth)return f}
 return min;
}
function write(ctx,text,x,y,maxWidth,font=20,color='#23372c',weight=700){
 ctx.textAlign='center';ctx.fillStyle=color;fitText(ctx,String(text),maxWidth,font,12);
 ctx.fillText(String(text),x,y,maxWidth);
}
function makeCanvasImage(){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const w=1440,h=1920;canvas.width=w;canvas.height=h;
 const green=col(),gold=accent(),on=inkFor(green),f=match(),coords=selectionCoords(),keys=ids();
 const mode=document.getElementById('tl6ExportMode')?.value||'full';
 fill(ctx,'#f8f7f1',0,0,w,h);
 fill(ctx,green,0,0,w,250);
 ctx.textAlign='left';ctx.fillStyle=on;ctx.font='800 21px system-ui';ctx.fillText('TOUCHLINE  /  MATCH DAY',92,63);
 ctx.font='800 51px system-ui';ctx.fillText(String(state.club||'Rugby Club').slice(0,40),92,140,1030);
 ctx.font='600 27px system-ui';ctx.fillText(String(state.team||'Team').slice(0,45),94,186,1030);
 ctx.font='600 20px system-ui';const periodPlan=state.periodPlans?.[f?.id],periodName=periodPlan?.mode==='halves'?'Half':periodPlan?.mode==='thirds'?'Third':periodPlan?.mode==='quarters'?'Quarter':'';const periodText=periodName?'   •   '+periodName+' '+((periodPlan.active||0)+1):'';ctx.fillText((f?'vs '+(f.opposition||'Opposition'):'Team selection')+'   •   '+(f?.date||'')+periodText,94,222,1040);
 fill(ctx,gold,1220,38,138,138,18);
 const field={x:80,y:298,w:1280,h:1275};
 fill(ctx,'#e6eadf',field.x-9,field.y-9,field.w+18,field.h+18,20);
 ctx.save();roundRect(ctx,field.x,field.y,field.w,field.h,14);ctx.clip();
 fill(ctx,'#36824b',field.x,field.y,field.w,field.h);
 for(let i=0;i<9;i++)if(i%2===0)fill(ctx,'#ffffff0b',field.x+i*field.w/9,field.y,field.w/9,field.h);
 // The team sheet is a clean green formation board; field markings are deliberately omitted.
 ctx.fillStyle='#f4f9eddd';ctx.textAlign='center';ctx.font='800 17px system-ui';ctx.fillText('↑  ATTACKING DIRECTION',field.x+field.w/2,field.y+55);
 const onlyNumber=mode==='numbers';
 for(const n of keys){
  const q=coords[n]||{x:50,y:50},x=field.x+q.x/100*field.w,y=field.y+q.y/100*field.h;
  const p=player(state.selection[n]),name=p?.name||'Unselected',role=W.touchlineAgeRole(n);
  if(!onlyNumber){
   const rw=184,rh=106;
   fill(ctx,'#11221c32',x-rw/2+4,y-rh/2+6,rw,rh,13);
   fill(ctx,'#fffef6',x-rw/2,y-rh/2,rw,rh,13);
   ctx.strokeStyle=green;ctx.lineWidth=2;roundRect(ctx,x-rw/2,y-rh/2,rw,rh,13);ctx.stroke();
   fill(ctx,green,x-29,y-rh/2+8,58,38,17);
   write(ctx,n,x,y-rh/2+35,45,24,on);
   if(mode==='full'||mode==='positions')write(ctx,role,x,y+14,170,17,green);
   if(mode==='full'||mode==='names')write(ctx,name,x,y+(mode==='full'?39:22),170,19,'#202f26');
  }else{
   ctx.fillStyle='#f9f7e6';ctx.beginPath();ctx.arc(x,y,36,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=green;ctx.lineWidth=4;ctx.stroke();write(ctx,n,x,y+11,62,31,green);
  }
 }
 ctx.restore();
 fill(ctx,'#f8f7f1',80,1600,1280,240,14);
 ctx.textAlign='left';ctx.fillStyle=green;ctx.font='800 24px system-ui';ctx.fillText('REPLACEMENTS',96,1645);
 const subs=state.bench.map(id=>player(id)?.name||'Player');
 const subsLine=subs.length?subs.join('     •     '):'No substitutes selected';
 ctx.font='600 21px system-ui';ctx.fillStyle='#3b5143';
 const lines=[];let current='';
 for(const item of (subs.length?subs:['No substitutes selected'])){
  const next=current?current+'     •     '+item:item;
  if(ctx.measureText(next).width>1220 && current){lines.push(current);current=item}else current=next;
 }
 if(current)lines.push(current);
 lines.slice(0,5).forEach((line,i)=>ctx.fillText(line,96,1687+i*31,1210));
 ctx.fillStyle='#708176';ctx.font='600 20px system-ui';ctx.fillText('Prepared in Touchline Rugby  •  Selection is subject to coach approval',91,1880);
 return {canvas,field,green,gold,mode};
}
function loadBadge(url){return new Promise(resolve=>{
 if(!url){resolve(null);return}
 const img=new Image();if(/^https?:/i.test(url))img.crossOrigin='anonymous';
 img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;
})}
let imageOpen=false;
W.tl6SaveTeamImage=async function(){
 try{
  const {canvas}=makeCanvasImage(),ctx=canvas.getContext('2d');
  const badge=await loadBadge(state.badge);
  if(badge){try{
   // Preserve aspect and keep the logo inside a designed highlight.
   const b=Math.max(badge.naturalWidth,badge.naturalHeight),side=122;
   ctx.drawImage(badge,1228+(side-badge.naturalWidth/b*side)/2,46+(side-badge.naturalHeight/b*side)/2,badge.naturalWidth/b*side,badge.naturalHeight/b*side);
  }catch(e){/* remote badges without canvas permissions can be omitted */}
  }
  let url;
  try{url=canvas.toDataURL('image/png')}catch(err){
   // Retry without a remote image if it tainted the canvas.
   if(badge){const retry=makeCanvasImage().canvas;url=retry.toDataURL('image/png')}
   else throw err;
  }
  exportDataUrl=url;
  const p=state.periodPlans?.[match()?.id];const suffix=p&&p.mode!=='single'?'-'+p.mode+'-'+((p.active||0)+1):'';const label=(state.club||'Touchline')+'-'+(state.team||'Team')+'-'+(match()?.date||'team-sheet')+suffix;
  exportName=label.toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,90)+'.png';
  showImagePreview();
 }catch(err){console.error('Team image export',err);alert('Could not generate the image in this browser. Try again after reopening Touchline.')}
};
function showImagePreview(){
 document.getElementById('tl6ImagePreview')?.remove();
 const el=document.createElement('div');el.id='tl6ImagePreview';el.className='tl6-image-modal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Team image preview');
 el.innerHTML='<div class="tl6-image-sheet"><div class="tl6-image-bar"><div><h2>Your team image</h2><p>Save or share this image. The layout includes the currently selected match period.</p></div><button type="button" aria-label="Close preview" onclick="tl6CloseImage()">×</button></div>'+
 '<div class="tl6-image-picture"><img alt="Generated rugby team sheet" id="tl6ImageResult"></div>'+
 '<div class="tl6-image-buttons"><button class="btn alt" onclick="tl6CloseImage()">Close</button><button class="btn alt" onclick="tl6ShareTeamImage()">Share image</button><button class="btn" onclick="tl6DownloadTeamImage()">Save PNG</button></div></div>';
 document.body.appendChild(el);document.getElementById('tl6ImageResult').src=exportDataUrl;imageOpen=true;document.body.classList.add('tl6-image-open');
 el.addEventListener('click',e=>{if(e.target===el)W.tl6CloseImage()});
}
W.tl6CloseImage=function(){document.getElementById('tl6ImagePreview')?.remove();document.body.classList.remove('tl6-image-open');imageOpen=false};
W.tl6DownloadTeamImage=function(){
 if(!exportDataUrl)return;
 const a=document.createElement('a');a.href=exportDataUrl;a.download=exportName||'touchline-team.png';document.body.appendChild(a);a.click();a.remove();
};
W.tl6ShareTeamImage=async function(){
 if(!exportDataUrl)return;
 try{
  const blob=await (await fetch(exportDataUrl)).blob();
  const file=new File([blob],exportName||'touchline-team.png',{type:'image/png'});
  if(!navigator.share||navigator.canShare&&!navigator.canShare({files:[file]})){W.tl6DownloadTeamImage();return}
  await navigator.share({files:[file],title:'Touchline team sheet'});
 }catch(err){if(err?.name!=='AbortError'){W.tl6DownloadTeamImage()}}
};
W.tl6ZoomPitch=function(direction){
 zoom=limit(Math.round((zoom+direction*.2)*10)/10,1,2.4);
 const pitch=document.querySelector('.tl5-expanded .tl4-pitch');
 pitch?.style.setProperty('--tl6-zoom',zoom);
 const label=document.getElementById('tl6ZoomValue');if(label)label.textContent=Math.round(zoom*100)+'%';
};
function decorateSelection(){
 if(page!=='selection')return;
 const heading=document.querySelector('.tl4-pitch-heading');
 const shell=document.querySelector('.tl4-pitch-shell');
 if(!heading||!shell)return;
 if(!document.getElementById('tl6SheetControls')){
  const actions=document.createElement('div');actions.id='tl6SheetControls';actions.className='tl6-export-controls';
  actions.innerHTML='<label class="label" for="tl6ExportMode">Image details</label>'+
  '<select id="tl6ExportMode" class="field" aria-label="Choose team image details">'+
  '<option value="full">Numbers, positions & names</option><option value="names">Numbers & names</option>'+
  '<option value="positions">Numbers & positions</option><option value="numbers">Numbers only</option></select>'+
  '<button type="button" class="btn" onclick="tl6SaveTeamImage()">Save team image</button>';
  heading.insertAdjacentElement('afterend',actions);
 }
 if(!document.getElementById('tl6ZoomControls')){
  const tools=document.createElement('div');tools.className='tl6-zoom-ui';tools.id='tl6ZoomControls';
  tools.innerHTML='<button type="button" onclick="tl6ZoomPitch(-1)" aria-label="Zoom out">−</button>'+
  '<span id="tl6ZoomValue">100%</span><button type="button" onclick="tl6ZoomPitch(1)" aria-label="Zoom in">+</button>';
  heading.appendChild(tools);
 }
 const pitch=shell.querySelector('.tl4-pitch');
 pitch?.style.setProperty('--tl6-zoom',zoom);
}
const previousRender=render;
render=function(){previousRender();settingsBadge();decorateSelection()};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(crop)closeCrop();else if(imageOpen)W.tl6CloseImage()}
});
W.touchlineVisualVersion='6.0';
render();
})();