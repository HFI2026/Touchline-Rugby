/* Touchline Live Beta — private authenticated 4-user shared workspace
 * Requires TOUCHLINE_CLOUD_CONFIG.enabled and a provisioned Supabase project.
 * No service role credentials or private API secrets belong in this file.
 */
/* Browser SDK is loaded on demand only after a cloud project is configured. */

const config=window.TOUCHLINE_CLOUD_CONFIG||{};
const ready=Boolean(config.enabled&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.projectUrl||'')&&/^(sb_publishable_|eyJ)/.test(config.publishableKey||''));
const app=document.querySelector('.app');
const main=document.querySelector('.main');
let client=null,user=null,workspace=null,role=null,channel=null;
let baseline=null,baselineJson='',localQueued=null,version=0,flushing=false,conflicted=false;
let flushTimer=0,refreshTimer=0,poller=0,status='setup',incomingVersion=0;
let activityStamp=0,channelConnected=false;
let pendingInvite=null;
const pagesWithPrivateData=true;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const isObject=o=>o&&typeof o==='object'&&!Array.isArray(o);
const copy=obj=>JSON.parse(JSON.stringify(obj));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const escapeText=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const uiFields=['matchId','sessionId','clockFixtureId','activePlay','activeFrame','selection','bench'];
const DEFAULT_ROOM_KEY='touchline-beta-workspace';
function localDocument(){
  const s=window.touchlineReadState?.();
  if(!s)return {};
  const d=copy(s);
  for(const key of uiFields)delete d[key];
  if(isObject(d.periodPlans))for(const plan of Object.values(d.periodPlans))if(isObject(plan))delete plan.active;
  // Never replicate ephemeral browser-only flags.
  delete d.liveSync;delete d.liveUser;
  return d;
}
function documentString(d){return JSON.stringify(d)}
function localPreferences(){
  const s=window.touchlineReadState?.()||{};
  return {matchId:s.matchId,sessionId:s.sessionId,clockFixtureId:s.clockFixtureId,
    activePlay:s.activePlay,activeFrame:s.activeFrame,activePeriods:Object.fromEntries(
     Object.entries(s.periodPlans||{}).map(([id,p])=>[id,Number(p.active)||0]))};
}
function mergeServerState(doc){
  if(!isObject(doc)||!Array.isArray(doc.players)||!Array.isArray(doc.fixtures))throw new Error('The shared workspace has invalid team data');
  const prefs=localPreferences(),next=copy(doc);
  const fixtureIds=next.fixtures.map(f=>f.id),matchIds=next.fixtures.filter(f=>f.type==='Match').map(f=>f.id);
  next.matchId=matchIds.includes(prefs.matchId)?prefs.matchId:(matchIds[0]||null);
  next.sessionId=fixtureIds.includes(prefs.sessionId)?prefs.sessionId:(fixtureIds[0]||null);
  next.clockFixtureId=matchIds.includes(prefs.clockFixtureId)?prefs.clockFixtureId:next.matchId;
  next.activePlay=next.plays?.some(p=>p.id===prefs.activePlay)?prefs.activePlay:(next.plays?.[0]?.id||null);
  next.activeFrame=Number(prefs.activeFrame)||0;
  next.periodPlans??={};next.lineups??={};
  Object.entries(next.periodPlans).forEach(([id,p])=>{
    const max={single:1,halves:2,thirds:3,quarters:4}[p.mode]||1;
    p.active=Math.min(Math.max(0,prefs.activePeriods[id]||0),max-1);
  });
  let lineup=next.periodPlans[next.matchId]?.periods?.[next.periodPlans[next.matchId].active]
    ||next.lineups[next.matchId]||{selection:{},bench:[]};
  next.selection=copy(lineup.selection||{});
  next.bench=copy(lineup.bench||[]);
  window.touchlineCloudSilence=true;
  try {window.touchlineReceiveState(next)} finally {window.touchlineCloudSilence=false}
}
function notice(message,level='info'){
  const panel=document.getElementById('tl-live-notice');
  if(panel){panel.textContent=message;panel.dataset.level=level}
}
function setStatus(next,detail=''){
  status=next;
  document.body.classList.toggle('tl-live-offline',next==='offline');
  const t=document.getElementById('tl-live-status'),message=document.getElementById('tl-live-label');
  if(t){t.dataset.status=next;t.title=detail||next}
  if(message)message.textContent=({connected:'Live · All changes saved',saving:'Syncing…',queued:'Changes waiting to sync',
    offline:'Offline · changes not shared',polling:'Connected · checking for updates',conflict:'Edit conflict — review needed',
    connecting:'Connecting…',login:'Sign in for shared data',setup:'Live setup required',
    viewer:'Live · View only',error:'Sync unavailable'})[next]||next;
  if(detail&&['error','conflict','offline'].includes(next))notice(detail,'warning');
  updateLock();
}
function lock(yes,why=''){
  document.body.classList.toggle('tl-live-locked',yes);
  if(why)notice(why,'warning');
}
function updateLock(){
  const deny=!user||!workspace||conflicted;
  const shell=document.getElementById('tl-live-lock');
  if(shell){
    shell.hidden=!deny;
    shell.setAttribute('aria-hidden',deny?'false':'true');
    if(deny){
      shell.innerHTML=(!user?'Sign in to access the shared team.':
        !workspace?'Choose or join a team to begin.':
        conflicted?'Another user updated the same information. Resolve this conflict to continue.':
        'Viewing only — coaches can edit this fixture.');
    }
  }
  document.body.classList.toggle('tl-live-no-edit',Boolean(role==='viewer'&&workspace));
}
function showAuthPanel(){
  let overlay=document.getElementById('tl-live-gate');
  if(!overlay){
    overlay=document.createElement('section');overlay.id='tl-live-gate';
    overlay.innerHTML='<div class="tl-live-access">'+
      '<div class="tl-live-kicker">TOUCHLINE / PRIVATE BETA</div><h1>Keep everyone on the same team sheet.</h1>'+
      '<p>Four authorised testers. One shared squad, fixture and match centre, with live updates.</p>'+
      '<div class="tl-live-form"><label for="tl-live-email">Your email address</label>'+
      '<input id="tl-live-email" type="email" placeholder="coach@example.com" autocomplete="email" required />'+
      '<button id="tl-live-send">Email me a sign-in link</button></div>'+
      '<p id="tl-live-auth-message" class="tl-live-hint">Your private team data is available only after signing in.</p>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#tl-live-send').onclick=async()=>{
      const email=overlay.querySelector('#tl-live-email').value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){overlay.querySelector('#tl-live-auth-message').textContent='Enter a valid email address';return}
      const b=overlay.querySelector('#tl-live-send');b.disabled=true;
      try {
        const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
        if(error)throw error;
        overlay.querySelector('#tl-live-auth-message').textContent='Check your email and open the sign-in link on this device.';
      }catch(err){overlay.querySelector('#tl-live-auth-message').textContent='Could not send sign-in link: '+(err.message||'Unknown error')}
      finally{b.disabled=false}
    };
  }
  overlay.hidden=Boolean(user);
  if(!user)document.body.classList.add('tl-live-auth-locked');else document.body.classList.remove('tl-live-auth-locked');
}
function mountStatus(){
  if(document.getElementById('tl-live-bar'))return;
  const bar=document.createElement('div');bar.id='tl-live-bar';
  bar.innerHTML='<span id="tl-live-status" data-status="connecting"><i></i><span id="tl-live-label">Connecting…</span></span>'+
    '<span id="tl-live-room" class="tl-live-room"></span><button id="tl-live-panel-button" type="button">Team access</button>';
  document.body.prepend(bar);
  bar.querySelector('#tl-live-panel-button').onclick=()=>showRoomPanel();
  const lock=document.createElement('div');lock.id='tl-live-lock';lock.hidden=true;
  document.body.appendChild(lock);
  const n=document.createElement('div');n.id='tl-live-notice';n.setAttribute('role','status');n.setAttribute('aria-live','polite');
  document.body.appendChild(n);
}
function showRoomPanel(){
  let el=document.getElementById('tl-live-room-panel');
  if(el){el.remove();return}
  el=document.createElement('div');el.id='tl-live-room-panel';
  el.innerHTML='<div class="tl-live-room-card">'+
    '<div class="tl-live-room-head"><div><h2>Shared team access</h2><p id="tl-live-user"></p></div><button id="tl-live-close" aria-label="Close">×</button></div>'+
    '<div id="tl-live-workspace-controls"></div>'+
    '<button id="tl-live-signout" class="tl-live-minor">Sign out</button></div>';
  document.body.appendChild(el);
  el.querySelector('#tl-live-close').onclick=()=>el.remove();
  el.onclick=e=>{if(e.target===el)el.remove()};
  el.querySelector('#tl-live-signout').onclick=async()=>{el.remove();await client.auth.signOut()};
  updateRoomPanel();
}
function updateRoomPanel(){
  const panel=document.getElementById('tl-live-room-panel');if(!panel)return;
  panel.querySelector('#tl-live-user').textContent=user?.email||'Signed out';
  const target=panel.querySelector('#tl-live-workspace-controls');
  if(!user){target.innerHTML='<p>Sign in to access a shared team.</p>';return}
  if(!workspace){
    target.innerHTML='<h3>Start your shared test</h3>'+
      '<button id="tl-live-create" class="tl-live-primary">Create shared team from this device</button>'+
      '<div class="tl-live-divider">OR JOIN AN EXISTING TEAM</div>'+
      '<label>Invitation code<input id="tl-live-invite-code" placeholder="Paste invite code" autocomplete="off" value="'+escapeText(pendingInvite||'')+'"></label>'+
      '<button id="tl-live-join" class="tl-live-primary">Join shared team</button><p class="tl-live-hint">Only an owner can create invitations. Each invitation works for one tester.</p>';
    target.querySelector('#tl-live-create').onclick=createRoom;
    target.querySelector('#tl-live-join').onclick=async()=>{
      const code=target.querySelector('#tl-live-invite-code').value.trim();if(!code)return;
      const btn=target.querySelector('#tl-live-join');btn.disabled=true;
      try {
        const {data,error}=await client.rpc('touchline_join_workspace',{_code:code});
        if(error)throw error;pendingInvite=null;sessionStorage.removeItem('tl-pending-invite');await chooseWorkspace(data);panel.remove();
      }catch(err){notice('Could not join: '+err.message,'warning');btn.disabled=false}
    };
    return;
  }
  const stamp=activityStamp?new Date(activityStamp).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'—';
  target.innerHTML='<p><strong>'+escapeText(workspace.club_name)+'</strong> · '+escapeText(role||'')+'</p>'+
    '<p class="tl-live-hint">Last shared update: '+stamp+'</p>'+
    (role==='owner'?'<h3>Invite testers</h3><div class="tl-live-invites">'+
      '<button id="tl-live-invite-editor" class="tl-live-primary">New coach invitation</button>'+
      '<button id="tl-live-invite-viewer" class="tl-live-minor">New view-only invitation</button></div>'+
      '<p class="tl-live-hint">Each link expires after five days and can be used once. Maximum four users including you.</p>'+
      '<p id="tl-live-generated" class="tl-live-hint"></p>':'')+
    '<button id="tl-live-refresh" class="tl-live-minor">Refresh shared data</button>'+
    '<button id="tl-live-download-local" class="tl-live-minor">Download current team backup</button>';
  target.querySelector('#tl-live-refresh').onclick=()=>refresh(true);
  target.querySelector('#tl-live-download-local').onclick=()=>exportBackup();
  if(role==='owner'){
    target.querySelector('#tl-live-invite-editor').onclick=()=>generateInvite('editor');
    target.querySelector('#tl-live-invite-viewer').onclick=()=>generateInvite('viewer');
  }
}
async function generateInvite(access){
  if(!workspace||role!=='owner')return;
  try{
    const {data,error}=await client.rpc('touchline_issue_invite',{_workspace:workspace.id,_role:access});
    if(error)throw error;
    const link=location.origin+location.pathname+'#invite='+encodeURIComponent(String(data));
    const target=document.getElementById('tl-live-generated');
    if(target){
      target.innerHTML='<strong>One-use '+(access==='editor'?'coach':'viewer')+' link:</strong> '+
        '<button id="tl-live-copy" class="tl-live-primary">Copy invitation link</button>';
      document.getElementById('tl-live-copy').onclick=async()=>{
        try{await navigator.clipboard.writeText(link);notice('Invitation link copied. Share privately with one tester.')}
        catch(e){prompt('Copy this invitation link',link)}
      };
    }
  }catch(err){notice('Could not create invitation: '+err.message,'warning')}
}
function exportBackup(){
  const body=JSON.stringify(window.touchlineReadState(),null,2);
  const blob=new Blob([body],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='touchline-unsynced-backup.json';document.body.appendChild(a);
  a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function createRoom(){
  if(!user||workspace)return;
  if(!confirm('Create a private shared team using this device’s existing squad and fixtures? Other signed-in testers will join through invitations.'))return;
  const data=localDocument();
  if(!Array.isArray(data.players)||!Array.isArray(data.fixtures))return notice('Local squad or fixture data is not valid','warning');
  try{
    const {data:id,error}=await client.rpc('touchline_create_workspace',{_club:data.club||'Rugby Club',_document:data});
    if(error)throw error;await chooseWorkspace(id);
    document.getElementById('tl-live-room-panel')?.remove();
    notice('Private team created. Open Team access to invite your testers.');
  }catch(err){notice('Could not create shared workspace: '+err.message,'warning')}
}
async function loadMembership(){
  if(!user){workspace=null;role=null;return}
  const {data,error}=await client.from('touchline_members').select('workspace_id,role').eq('user_id',user.id).limit(2);
  if(error)throw error;
  if(!data?.length){workspace=null;role=null;setStatus('login','Create or join a team through Team access.');if(pendingInvite){showRoomPanel()}return}
  await chooseWorkspace(data[0].workspace_id,data[0].role);
}
async function chooseWorkspace(id,knownRole=null){
  if(!id)throw new Error('Missing shared workspace');
  if(channel){await client.removeChannel(channel);channel=null;channelConnected=false}
  const {data,error}=await client.from('touchline_workspaces').select('*').eq('id',id).single();
  if(error)throw error;
  const {data:member,error:memberError}=await client.from('touchline_members').select('role').eq('workspace_id',id).eq('user_id',user.id).single();
  if(memberError)throw memberError;
  role=member.role;workspace={id:data.id,club_name:data.club_name};
  version=Number(data.version);baseline=copy(data.document);baselineJson=documentString(baseline);
  localQueued=null;conflicted=false;
  mergeServerState(baseline);
  activityStamp=Date.parse(data.updated_at||new Date().toISOString());
  try{sessionStorage.setItem(DEFAULT_ROOM_KEY,id)}catch(e){}
  setStatus('connecting');
  const roomLabel=document.getElementById('tl-live-room');if(roomLabel)roomLabel.textContent=data.club_name;
  channel=client.channel('touchline-room-'+id).on('postgres_changes',
    {event:'UPDATE',schema:'public',table:'touchline_updates',filter:'workspace_id=eq.'+id},
    payload=>{if(Number(payload.new?.version)>version)refresh(true)}).subscribe((subStatus)=>{
      if(subStatus==='CHANNEL_ERROR'||subStatus==='TIMED_OUT'){channelConnected=false;setStatus('polling','Live channel interrupted. Changes are checked periodically.')} 
      if(subStatus==='SUBSCRIBED'){channelConnected=true;if(!conflicted&&!localQueued)setStatus(role==='viewer'?'viewer':'connected')}
    });
  updateRoomPanel();updateLock();
}
const ABSENT=Symbol('absent');
function eq(a,b){if(a===ABSENT||b===ABSENT)return a===b;return equal(a,b)}
function combine(base,local,remote,path,errors){
 if(eq(local,base))return remote===ABSENT?ABSENT:copy(remote);
 if(eq(remote,base))return local===ABSENT?ABSENT:copy(local);
 if(eq(local,remote))return local===ABSENT?ABSENT:copy(local);
 if(isObject(base)||isObject(local)||isObject(remote)){
  if([base,local,remote].every(x=>x===ABSENT||isObject(x))){
    const out={},keys=new Set([...Object.keys(base===ABSENT?{}:base),...Object.keys(local===ABSENT?{}:local),...Object.keys(remote===ABSENT?{}:remote)]);
    for(const key of keys){
      const next=combine(base!==ABSENT&&hasOwn(base,key)?base[key]:ABSENT,
        local!==ABSENT&&hasOwn(local,key)?local[key]:ABSENT,
        remote!==ABSENT&&hasOwn(remote,key)?remote[key]:ABSENT,[...path,key],errors);
      if(next!==ABSENT)out[key]=next;
    }
    return out;
  }
 }
 if([base,local,remote].every(x=>Array.isArray(x))){
  const ids=arr=>arr.every(item=>isObject(item)&&typeof item.id==='string')&&new Set(arr.map(x=>x.id)).size===arr.length;
  if(ids(base)&&ids(local)&&ids(remote)){
    const get=arr=>Object.fromEntries(arr.map(x=>[x.id,x]));
    const bm=get(base),lm=get(local),rm=get(remote),ordered=[...new Set([...remote.map(x=>x.id),...local.map(x=>x.id),...base.map(x=>x.id)])];
    return ordered.map(id=>combine(hasOwn(bm,id)?bm[id]:ABSENT,hasOwn(lm,id)?lm[id]:ABSENT,hasOwn(rm,id)?rm[id]:ABSENT,[...path,id],errors)).filter(x=>x!==ABSENT);
  }
  const samePrefix=(base,x)=>base.length<=x.length&&base.every((v,i)=>eq(v,x[i]));
  if(samePrefix(base,local)&&samePrefix(base,remote)){
    const additions=[...remote.slice(base.length),...local.slice(base.length)];
    const seen=new Set();
    const unique=additions.filter(x=>{const key=JSON.stringify(x);if(seen.has(key))return false;seen.add(key);return true});
    return [...copy(base),...copy(unique)];
  }
 }
 errors.push(path.join('.')||'team data');
 return local===ABSENT?ABSENT:copy(local);
}
function threeWay(base,local,remote){
 const errors=[],merged=combine(base,local,remote,[],errors);
 return {merged,errors};
}
function currentLocal(){return localDocument()}
function hasChanges(){return workspace && documentString(currentLocal())!==baselineJson}
function setConflict(detail,latest){
  conflicted=true;localQueued=currentLocal();setStatus('conflict',detail);
  let div=document.getElementById('tl-live-conflict');
  if(div)return;
  div=document.createElement('div');div.id='tl-live-conflict';
  div.innerHTML='<div><h2>Two people edited the same information</h2>'+
    '<p>Your changes have <strong>not</strong> replaced the other person’s updates.</p>'+
    '<p>Download a backup of your current changes before loading the latest shared version.</p>'+
    '<button id="tl-live-save-draft">Download my changes</button>'+
    '<button id="tl-live-use-server">Load latest shared version</button></div>';
  document.body.appendChild(div);
  div.querySelector('#tl-live-save-draft').onclick=exportBackup;
  div.querySelector('#tl-live-use-server').onclick=async()=>{
    if(!confirm('Discard your unsaved local edits and load the latest team version? Download a backup first if needed.'))return;
    div.remove();conflicted=false;localQueued=null;
    await refresh(true,true);
  };
}
async function handleRemote(row){
 if(!workspace||!row||row.id!==workspace.id)return;
 const newer=Number(row.version)||0;
 if(newer<=version)return;
 if(!isObject(row.document))return;
 const remote=copy(row.document),local=currentLocal();
 const localChanged=!equal(local,baseline);
 if(!localChanged){
   baseline=remote;baselineJson=documentString(remote);version=newer;
   mergeServerState(remote);
   activityStamp=Date.parse(row.updated_at||new Date().toISOString());
   setStatus(role==='viewer'?'viewer':channelConnected?'connected':'polling');return;
 }
 const {merged,errors}=threeWay(baseline,local,remote);
 baseline=remote;baselineJson=documentString(remote);version=newer;
 if(errors.length){
  setConflict('A teammate edited '+errors.slice(0,3).join(', ')+'. Save a backup and refresh to resolve.');
  return;
 }
 mergeServerState(merged);
 localQueued=documentString(merged)===baselineJson?null:merged;
 activityStamp=Date.parse(row.updated_at||new Date().toISOString());
 if(localQueued){setStatus('queued');scheduleSave(50)}else setStatus(role==='viewer'?'viewer':'connected');
}
async function refresh(force=false,discard=false){
 if(!workspace||!client||!user)return;
 try{
  const {data,error}=await client.from('touchline_workspaces').select('*').eq('id',workspace.id).single();
  if(error)throw error;
  if(discard){
   baseline=copy(data.document);baselineJson=documentString(baseline);
   version=Number(data.version);mergeServerState(baseline);localQueued=null;conflicted=false;
   const d=document.getElementById('tl-live-conflict');d?.remove();
   setStatus(role==='viewer'?'viewer':'connected');return;
  }
  await handleRemote(data);
  if(!conflicted&&!localQueued)setStatus(role==='viewer'?'viewer':channelConnected?'connected':'polling');
 }catch(err){setStatus('offline','Could not reach the shared team: '+err.message)}
}
function scheduleSave(delay=260){
 if(flushTimer)clearTimeout(flushTimer);
 flushTimer=setTimeout(()=>{flushTimer=0;flush()},delay);
}
window.touchlineCloudEnqueueSave=function(){
 if(!ready||!user||!workspace||role==='viewer'||window.touchlineCloudSilence||conflicted)return;
 const doc=currentLocal();
 if(equal(doc,baseline))return;
 localQueued=doc;
 setStatus('queued');scheduleSave();
};
async function flush(){
 if(!workspace||!user||role==='viewer'||conflicted||flushing||!localQueued)return;
 flushing=true;setStatus('saving');
 const desired=copy(localQueued),expected=version;
 try{
  const {data,error}=await client.rpc('touchline_write_workspace',
    {_workspace:workspace.id,_expected_version:expected,_document:desired});
  if(error)throw error;
  if(!data?.ok){
    await refresh(true);
  }else{
    baseline=desired;baselineJson=documentString(desired);version=Number(data.version);
    localQueued=equal(currentLocal(),desired)?null:currentLocal();
    activityStamp=now();
    if(localQueued){setStatus('queued')}else setStatus(channelConnected?'connected':'polling');
  }
 }catch(err){localQueued=currentLocal();setStatus('offline','Not saved yet. Reconnect to sync. '+err.message)}
 finally {
  flushing=false;
  if(localQueued&&!conflicted&&navigator.onLine!==false)scheduleSave(status==='offline'?4500:250);
 }
}
function now(){return Date.now()}
async function bootstrap(){
 mountStatus();
 const inviteMatch=new URLSearchParams(location.hash.replace(/^#/,''));
 const code=inviteMatch.get('invite');
 if(code && /^[0-9a-f]{36}$/i.test(code)){
   pendingInvite=code;try{sessionStorage.setItem('tl-pending-invite',code)}catch(e){}
   try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
 } else {try{pendingInvite=sessionStorage.getItem('tl-pending-invite')}catch(e){}}

 if(!ready){setStatus('setup','Cloud credentials are not yet configured.');return}
  try{
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
    document.body.classList.add('tl-cloud-enabled');
    client=createClient(config.projectUrl,config.publishableKey,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }catch(err){setStatus('error',err.message);return}
  client.auth.onAuthStateChange((event,session)=>{
    const previous=user?.id;
    user=session?.user||null;
    showAuthPanel();
    if(!user){
      if(channel){client.removeChannel(channel);channel=null;channelConnected=false}
      role=null;workspace=null;localQueued=null;baseline=null;baselineJson='';
      setStatus('login');updateRoomPanel();return;
    }
    if(event==='SIGNED_IN'&&previous!==user.id){
      setTimeout(()=>{loadMembership().catch(e=>{setStatus('error',e.message);notice('Use Team access to join or create a team.','warning')})},50);
    }
  });
  try{
    const {data:{session},error}=await client.auth.getSession();
    if(error)throw error;
    user=session?.user||null;
    showAuthPanel();
    if(user)await loadMembership();
    else setStatus('login');
  }catch(err){setStatus('error','Authentication failed: '+err.message)}
  window.addEventListener('online',()=>{if(workspace){refresh(true);if(localQueued)scheduleSave(100)}});
  window.addEventListener('offline',()=>{if(workspace)setStatus('offline','No connection — edits cannot reach other testers. Reconnect before continuing.')});
  window.addEventListener('focus',()=>{if(workspace)refresh(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&workspace)refresh(true)});
  poller=setInterval(()=>{if(workspace&&navigator.onLine!==false)refresh(false)},22000);
}
bootstrap();
window.touchlineCloudDebug=()=>({enabled:ready,workspaceId:workspace?.id||null,role,version,status,queued:!!localQueued,conflicted});
