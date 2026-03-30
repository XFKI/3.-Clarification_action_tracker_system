// ===== ICONS =====
const IC={
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  download:'<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload:'<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  check:'<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  save:'<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  x:'<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  empty:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  db:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  help:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 1 1 4.9 1.8c-.8.9-1.6 1.3-1.6 2.4"/><circle cx="12" cy="17" r=".9"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20.2 14.2A8.2 8.2 0 1 1 9.8 3.8a7 7 0 1 0 10.4 10.4z"/></svg>',
};

// ===== CONSTANTS =====
const DISCIPLINES_DEFAULT=['Process','Electrical','Instrument','Piping','Mechanical','Structural','HVAC'];
const PRIORITIES=['High','Medium','Low'];
const CL_TYPES_DEFAULT=['DCP','PID','Datasheet','Spec','Drawing','General'];
const STATUS_STD=['OPEN','IN_PROGRESS','INFO','CLOSED'];
const ACTION_BY_DEFAULT=['WISON','BH','Owner'];
const SOURCES_DEFAULT=['Email','企业微信','会议','电话','其他'];
const REQUIRED_FIELDS={
  clarification:['actionId','clarification','actionBy','openDate','status'],
  meeting:['no','subject','clarification','actionBy','meetingDate','plannedDate','status']
};

// ===== STATE =====
let projects=JSON.parse(localStorage.getItem('et_projects'))||[];
let activeProjectId=localStorage.getItem('et_active_project')||'';
let operatorName=localStorage.getItem('et_operator')||'ME';
let sidebarCollapsed=localStorage.getItem('et_sidebar_collapsed')==='1';
let uiTheme=localStorage.getItem('et_theme')||'light';
let uiLang=localStorage.getItem('et_lang')||'zh';
let state={currentTab:'dashboard',clarifications:[],actions:[],meetings:[],trash:[],selected:new Set(),sort:{field:null,dir:'asc'},filters:{search:'',status:'',discipline:'',priority:'',actionBy:'',overdueOnly:false,duplicateOnly:false},editingId:null,meetingDateFilter:'',meetingSubjectFilter:'',actionReplyEditId:''};
let docBoard={packages:[],activePackageId:'',search:'',statusFilter:'ALL'};
let duplicateIdSet=new Set();
let disciplineOptions=[...DISCIPLINES_DEFAULT];
let typeOptions=[...CL_TYPES_DEFAULT];
let actionByOptions=[...ACTION_BY_DEFAULT];
let sourceOptions=[...SOURCES_DEFAULT];
let pendingAttachmentTarget=null;
let dashboardCharts=[];
let pendingOptionDeleteContext=null;
let columnWidthMap={};
let focusedRowRef={id:'',sourceType:''};
let attachmentDbPromise=null;
let attachmentMigrationRunning=false;
let backendMode=false;
let backendMetaSyncTimer=null;
let backendStateSyncTimer=null;
let backendStateSyncInFlight=false;
let backendSyncSuppress=false;
let backendShadowSnapshot=null;
let backendClientId='';
let backendHeartbeatTimer=null;
let backendClientRegistered=false;
const ATTACHMENT_DB_NAME='et_attachments_db';
const ATTACHMENT_STORE='attachments';
const APP_TITLE_ZH='工程澄清与行动追踪';
const APP_TITLE_EN='Clarification Action Tracker';
const FIRST_USE_INTRO_KEY='et_first_use_intro_seen_v1';
const BACKEND_SYNC_DELAY_MS=900;
const CLIENT_HEARTBEAT_MS=8000;
const WEB_MODE_PARAM='mode';
const WEB_MODE_VALUE='web';

function isWebModeRequested(){
  try{
    const q=new URLSearchParams(window.location.search||'');
    if(String(q.get(WEB_MODE_PARAM)||'').toLowerCase()===WEB_MODE_VALUE)return true;
  }catch(e){/* ignore */}
  const host=String(window.location.hostname||'').toLowerCase();
  return host.endsWith('.vercel.app');
}

function t(zh,en){return uiLang==='en'?en:zh}
function applyTheme(){document.body.classList.toggle('theme-dark',uiTheme==='dark')}
function applyLanguageClass(){
  document.body.classList.toggle('lang-zh',uiLang==='zh');
  document.body.classList.toggle('lang-en',uiLang==='en');
}
function toggleTheme(){
  uiTheme=uiTheme==='dark'?'light':'dark';
  localStorage.setItem('et_theme',uiTheme);
  applyTheme();
  renderHeader();
  toast(uiTheme==='dark'?t('已切换深色主题','Switched to night theme'):t('已切换浅色主题','Switched to light theme'),'info');
}
function toggleLanguage(){
  uiLang=uiLang==='zh'?'en':'zh';
  localStorage.setItem('et_lang',uiLang);
  applyLanguageClass();
  renderAll();
}

function ensureDefaultProject(){
  if(!projects.length){projects.push({id:'default',name:'GENTING FLNG F450'});activeProjectId='default';saveProjects()}
  if(!activeProjectId||!projects.find(p=>p.id===activeProjectId)){activeProjectId=projects[0].id;saveProjects()}
}
function saveProjects(){
  localStorage.setItem('et_projects',JSON.stringify(projects));
  localStorage.setItem('et_active_project',activeProjectId);
  scheduleBackendMetaSync();
}
function projKey(suffix){return`et_${activeProjectId}_${suffix}`}

function createEmptyDocBoard(){
  return{packages:[],activePackageId:'',search:'',statusFilter:'ALL',pdfComments:[],pdfFilter:'ALL',pdfSelected:{},matchPreview:[],unmatchedFiles:[]};
}
function normalizeDocBoard(raw){
  const base=createEmptyDocBoard();
  if(!raw||typeof raw!=='object')return base;
  base.packages=Array.isArray(raw.packages)?raw.packages:[];
  base.activePackageId=String(raw.activePackageId||'');
  base.search=String(raw.search||'');
  base.statusFilter=String(raw.statusFilter||'ALL');
  base.pdfComments=Array.isArray(raw.pdfComments)?raw.pdfComments:[];
  base.pdfFilter=String(raw.pdfFilter||'ALL');
  base.pdfSelected=raw.pdfSelected&&typeof raw.pdfSelected==='object'?raw.pdfSelected:{};
  base.matchPreview=Array.isArray(raw.matchPreview)?raw.matchPreview:[];
  base.unmatchedFiles=Array.isArray(raw.unmatchedFiles)?raw.unmatchedFiles:[];
  if(!base.activePackageId&&base.packages.length)base.activePackageId=String(base.packages[0].id||'');
  return base;
}
function loadDocBoard(){
  try{
    const raw=JSON.parse(localStorage.getItem(projKey('doc_board'))||'null');
    docBoard=normalizeDocBoard(raw);
  }catch(e){
    docBoard=createEmptyDocBoard();
  }
}
function saveDocBoard(){
  try{localStorage.setItem(projKey('doc_board'),JSON.stringify(docBoard))}catch(e){/* ignore */}
}

function newClientId(){return`client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}

function renderBackendRequiredScreen(){
  document.body.innerHTML=`<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#e2e8f0;padding:24px;font-family:'Microsoft YaHei','Segoe UI',sans-serif"><div style="max-width:720px;border:1px solid #334155;border-radius:12px;padding:24px;background:#111827"><h2 style="margin:0 0 12px">${t('后端未启动，已阻断进入','Backend is required and not running')}</h2><p style="margin:0 0 10px;line-height:1.6">${t('本版本默认强制后端模式：意见和附件仅存储在项目目录数据库中。','This build uses forced backend mode by default: records and attachments are stored in project-folder DB.')}</p><p style="margin:0 0 10px;line-height:1.6">${t('请先运行 quick-start.bat（或 quick-start.sh），再刷新页面。','Run quick-start.bat (or quick-start.sh) first, then refresh this page.')}</p><p style="margin:0 0 16px;line-height:1.6">${t('若已部署到 Vercel，可在地址后追加 ?mode=web 进入网页本地模式。','If deployed on Vercel, append ?mode=web to URL to use web local mode.')}</p><button onclick="location.reload()" style="padding:8px 14px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;cursor:pointer">${t('刷新重试','Retry')}</button></div></div>`;
}

async function apiRequest(path,options){
  const res=await fetch(path,options);
  if(!res.ok)throw new Error(`API ${res.status}`);
  const text=await res.text();
  return text?JSON.parse(text):{};
}
async function detectBackendMode(){
  try{
    const data=await apiRequest('/api/health');
    return !!(data&&data.ok);
  }catch(e){
    return false;
  }
}
function deepClone(obj){return JSON.parse(JSON.stringify(obj))}
function safeJson(v){try{return JSON.stringify(v)}catch(e){return ''}}
function valueEqual(a,b){return safeJson(a)===safeJson(b)}
function collectSnapshot(){
  return{
    clarifications:deepClone(state.clarifications||[]),
    actions:deepClone(state.actions||[]),
    meetings:deepClone(state.meetings||[]),
    trash:deepClone(state.trash||[]),
    options:{
      disciplineOptions:deepClone(disciplineOptions||[]),
      typeOptions:deepClone(typeOptions||[]),
      actionByOptions:deepClone(actionByOptions||[]),
      sourceOptions:deepClone(sourceOptions||[]),
      columnWidthMap:deepClone(columnWidthMap||{})
    },
    meta:{
      operatorName,
      uiTheme,
      uiLang
    }
  };
}
async function blobToDataUrl(blob){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>resolve(e.target.result);
    reader.onerror=()=>reject(reader.error||new Error('blob to dataurl failed'));
    reader.readAsDataURL(blob);
  });
}
async function inlineSnapshotAttachments(snapshot){
  const collections=[snapshot.clarifications||[],snapshot.meetings||[]];
  (snapshot.trash||[]).forEach(t=>{if(t&&t.item)collections.push([t.item])});
  for(const list of collections){
    for(const item of list){
      const map=item.fieldAttachments||{};
      for(const fieldKey of Object.keys(map)){
        const arr=map[fieldKey]||[];
        for(const att of arr){
          if(att&&att.storage==='idb'&&att.id){
            try{
              const blob=await getAttachmentBlob(att.id);
              if(blob){
                att.data=await blobToDataUrl(blob);
                att.storage='inline';
              }
            }catch(e){/* keep metadata fallback */}
          }
        }
      }
    }
  }
}
async function pushBackendMeta(){
  if(!backendMode)return;
  try{
    await apiRequest('/api/meta',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({projects,activeProjectId})
    });
  }catch(e){/* soft fail */}
}
function scheduleBackendMetaSync(){
  if(!backendMode||backendSyncSuppress)return;
  clearTimeout(backendMetaSyncTimer);
  backendMetaSyncTimer=setTimeout(()=>{pushBackendMeta()},BACKEND_SYNC_DELAY_MS);
}
async function pushBackendStateNow(){
  if(!backendMode||backendSyncSuppress||backendStateSyncInFlight||!activeProjectId)return;
  backendStateSyncInFlight=true;
  try{
    const snapshot=collectSnapshot();
    await inlineSnapshotAttachments(snapshot);
    const patches=buildSnapshotPatches(backendShadowSnapshot,snapshot);
    if(patches.length){
      await apiRequest(`/api/state/patch?projectId=${encodeURIComponent(activeProjectId)}`,
        {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patches})}
      );
      backendShadowSnapshot=snapshot;
    }
  }catch(e){/* soft fail */}
  backendStateSyncInFlight=false;
}
function scheduleBackendStateSync(){
  if(!backendMode||backendSyncSuppress)return;
  clearTimeout(backendStateSyncTimer);
  backendStateSyncTimer=setTimeout(()=>{pushBackendStateNow()},BACKEND_SYNC_DELAY_MS);
}
async function pullBackendMeta(){
  if(!backendMode)return;
  try{
    const data=await apiRequest('/api/meta');
    if(Array.isArray(data.projects)&&data.projects.length){
      projects=data.projects;
    }
    if(data.activeProjectId)activeProjectId=data.activeProjectId;
  }catch(e){/* keep local */}
}
async function pullBackendState(projectId){
  if(!backendMode||!projectId)return;
  try{
    const data=await apiRequest(`/api/state?projectId=${encodeURIComponent(projectId)}`);
    if(!data||!data.exists||!data.state){
      backendShadowSnapshot=collectSnapshot();
      return;
    }
    const s=data.state;
    backendSyncSuppress=true;
    state.clarifications=s.clarifications||[];
    state.actions=s.actions||[];
    state.meetings=s.meetings||[];
    state.trash=s.trash||[];
    disciplineOptions=(s.options&&s.options.disciplineOptions)||disciplineOptions;
    typeOptions=(s.options&&s.options.typeOptions)||typeOptions;
    actionByOptions=(s.options&&s.options.actionByOptions)||actionByOptions;
    sourceOptions=(s.options&&s.options.sourceOptions)||sourceOptions;
    columnWidthMap=(s.options&&s.options.columnWidthMap)||columnWidthMap;
    if(s.meta&&s.meta.operatorName)operatorName=s.meta.operatorName;
    backendShadowSnapshot=collectSnapshot();
    save();
    backendSyncSuppress=false;
  }catch(e){
    backendSyncSuppress=false;
  }
}

function buildCollectionPatches(prevList,nextList,collection,keyField){
  const patches=[];
  const pMap=new Map((prevList||[]).map(i=>[String((i&&i[keyField])||''),i]).filter(x=>x[0]));
  const nMap=new Map((nextList||[]).map(i=>[String((i&&i[keyField])||''),i]).filter(x=>x[0]));
  nMap.forEach((nextItem,id)=>{
    const prevItem=pMap.get(id);
    if(!prevItem){
      patches.push({op:'upsert_item',collection,item:nextItem});
      return;
    }
    const keys=new Set([...Object.keys(prevItem||{}),...Object.keys(nextItem||{})]);
    const set={};
    const unset=[];
    keys.forEach(k=>{
      const hasNext=Object.prototype.hasOwnProperty.call(nextItem,k);
      const hasPrev=Object.prototype.hasOwnProperty.call(prevItem,k);
      if(hasNext&&!hasPrev){set[k]=nextItem[k];return}
      if(!hasNext&&hasPrev){unset.push(k);return}
      if(!valueEqual(prevItem[k],nextItem[k]))set[k]=nextItem[k];
    });
    if(Object.keys(set).length||unset.length)patches.push({op:'patch_item',collection,id,set,unset});
  });
  pMap.forEach((_,id)=>{if(!nMap.has(id))patches.push({op:'remove_item',collection,id})});
  return patches;
}

function buildSnapshotPatches(prev,next){
  if(!next)return[];
  if(!prev){
    const bootstrap=[];
    (next.clarifications||[]).forEach(item=>bootstrap.push({op:'upsert_item',collection:'clarifications',item}));
    (next.actions||[]).forEach(item=>bootstrap.push({op:'upsert_item',collection:'actions',item}));
    (next.meetings||[]).forEach(item=>bootstrap.push({op:'upsert_item',collection:'meetings',item}));
    (next.trash||[]).forEach(item=>bootstrap.push({op:'upsert_item',collection:'trash',item}));
    bootstrap.push({op:'set_options',values:next.options||{}});
    bootstrap.push({op:'set_meta',values:next.meta||{}});
    return bootstrap;
  }
  const patches=[];
  patches.push(...buildCollectionPatches(prev.clarifications||[],next.clarifications||[],'clarifications','id'));
  patches.push(...buildCollectionPatches(prev.actions||[],next.actions||[],'actions','id'));
  patches.push(...buildCollectionPatches(prev.meetings||[],next.meetings||[],'meetings','id'));
  patches.push(...buildCollectionPatches(prev.trash||[],next.trash||[],'trash','trashId'));
  if(!valueEqual(prev.options||{},next.options||{}))patches.push({op:'set_options',values:next.options||{}});
  if(!valueEqual(prev.meta||{},next.meta||{}))patches.push({op:'set_meta',values:next.meta||{}});
  return patches;
}

async function registerBackendClient(){
  if(!backendMode)return;
  if(!backendClientId)backendClientId=newClientId();
  try{
    await apiRequest('/api/client/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({clientId:backendClientId,projectId:activeProjectId||''})
    });
    backendClientRegistered=true;
    if(backendHeartbeatTimer)clearInterval(backendHeartbeatTimer);
    backendHeartbeatTimer=setInterval(()=>{heartbeatBackendClient()},CLIENT_HEARTBEAT_MS);
  }catch(e){/* soft fail */}
}
async function heartbeatBackendClient(){
  if(!backendMode||!backendClientId)return;
  try{
    await apiRequest('/api/client/heartbeat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({clientId:backendClientId,projectId:activeProjectId||''})
    });
  }catch(e){/* soft fail */}
}
function unregisterBackendClient(){
  if(!backendMode||!backendClientId||!backendClientRegistered)return;
  if(backendHeartbeatTimer){clearInterval(backendHeartbeatTimer);backendHeartbeatTimer=null}
  const payload=JSON.stringify({clientId:backendClientId,projectId:activeProjectId||''});
  try{
    if(navigator.sendBeacon){
      navigator.sendBeacon('/api/client/unregister',new Blob([payload],{type:'application/json'}));
    }else{
      fetch('/api/client/unregister',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true});
    }
  }catch(e){/* ignore */}
}
function registerBackendLifecycleHooks(){
  window.addEventListener('beforeunload',()=>{unregisterBackendClient()});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')heartbeatBackendClient();
  });
}
function save(){
  try{
    if(!backendMode){
      localStorage.setItem(projKey('cl'),JSON.stringify(state.clarifications));
      localStorage.setItem(projKey('act'),JSON.stringify(state.actions));
      localStorage.setItem(projKey('mt'),JSON.stringify(state.meetings));
      localStorage.setItem(projKey('trash'),JSON.stringify(state.trash));
    }
    localStorage.setItem(projKey('disc_opts'),JSON.stringify(disciplineOptions));
    localStorage.setItem(projKey('type_opts'),JSON.stringify(typeOptions));
    localStorage.setItem(projKey('actionby_opts'),JSON.stringify(actionByOptions));
    localStorage.setItem(projKey('source_opts'),JSON.stringify(sourceOptions));
    localStorage.setItem(projKey('col_widths'),JSON.stringify(columnWidthMap));
  }catch(e){
    console.warn('save local cache failed',e);
  }
  scheduleBackendStateSync();
}
function load(){
  try{
    if(backendMode){
      state.clarifications=[];
      state.actions=[];
      state.meetings=[];
      state.trash=[];
    }else{
      state.clarifications=JSON.parse(localStorage.getItem(projKey('cl')))||[];
      state.actions=JSON.parse(localStorage.getItem(projKey('act')))||[];
      state.meetings=JSON.parse(localStorage.getItem(projKey('mt')))||[];
      state.trash=JSON.parse(localStorage.getItem(projKey('trash')))||[];
    }
    disciplineOptions=JSON.parse(localStorage.getItem(projKey('disc_opts')))||[...DISCIPLINES_DEFAULT];
    typeOptions=JSON.parse(localStorage.getItem(projKey('type_opts')))||[...CL_TYPES_DEFAULT];
    actionByOptions=JSON.parse(localStorage.getItem(projKey('actionby_opts')))||[...ACTION_BY_DEFAULT];
    sourceOptions=JSON.parse(localStorage.getItem(projKey('source_opts')))||[...SOURCES_DEFAULT];
    columnWidthMap=JSON.parse(localStorage.getItem(projKey('col_widths')))||{};
  }catch(e){
    state.clarifications=[];state.actions=[];state.meetings=[];state.trash=[];
    disciplineOptions=[...DISCIPLINES_DEFAULT];
    typeOptions=[...CL_TYPES_DEFAULT];
    actionByOptions=[...ACTION_BY_DEFAULT];
    sourceOptions=[...SOURCES_DEFAULT];
    columnWidthMap={};
  }
  migrateData();
  loadDocBoard();
  rebuildCategoryOptions();
  refreshDuplicateSet();
  if(!backendMode)setTimeout(()=>{runAttachmentMigration()},0);
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function fmtDate(d){if(!d)return'—';const dt=new Date(d);return isNaN(dt)?'—':dt.toISOString().slice(0,10)}
function nowIso(){return new Date().toISOString()}
function normalizeStatus(raw){
  const s=String(raw||'OPEN').trim().toUpperCase().replace(/[-\s]+/g,'_');
  if(s==='CLOSE'||s==='CLOSED')return'CLOSED';
  if(s==='IN_PROGRESS')return'IN_PROGRESS';
  if(s==='INFO')return'INFO';
  if(s==='OPEN')return'OPEN';
  return'OPEN';
}
function statusLabel(s){return normalizeStatus(s).replace('_',' ')}
function statusClass(s){return'status-'+normalizeStatus(s).toLowerCase().replace('_','-')}
function getDueDate(item){return item.currentDueDate||item.dueDate||item.needDate||item.plannedDate||''}
function isoWeek(dateStr){
  if(!dateStr)return'NO_DUE';
  const d=new Date(dateStr);if(isNaN(d))return'NO_DUE';
  const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=x.getUTCDay()||7;
  x.setUTCDate(x.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(x.getUTCFullYear(),0,1));
  const week=Math.ceil((((x-yearStart)/86400000)+1)/7);
  return`${x.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
}
function updateMeta(item,reason){
  item.updatedAt=nowIso();
  item.updatedBy=operatorName||'ME';
  item.history=item.history||[];
  if(reason){item.history.push({at:item.updatedAt,by:item.updatedBy,type:reason.type||'UPDATE',field:reason.field||'',from:reason.from||'',to:reason.to||''})}
}
function normalizeItem(type,item){
  item.status=normalizeStatus(item.status);
  item.history=Array.isArray(item.history)?item.history:[];
  item.fieldAttachments=item.fieldAttachments&&typeof item.fieldAttachments==='object'?item.fieldAttachments:{};
  if(Array.isArray(item.attachments)&&item.attachments.length&&!item.fieldAttachments.clarification){
    item.fieldAttachments.clarification=[...item.attachments];
  }
  delete item.attachments;
  if(!item.createdAt)item.createdAt=nowIso();
  if(!item.updatedAt)item.updatedAt=item.createdAt;
  if(!item.updatedBy)item.updatedBy=item.actionBy||operatorName||'ME';
  if(!item.actionBy)item.actionBy=actionByOptions[0]||'WISON';
  if(type==='meeting'&&!item.priority)item.priority='Medium';
  if(type==='meeting'&&!item.meetingDate)item.meetingDate=item.plannedDate||item.openDate||fmtDate(new Date());
  if(type==='clarification'&&!item.source)item.source='Email';
  if(type==='meeting'&&!item.no)item.no=item.actionId||'';
  if(type==='clarification'&&!item.actionId)item.actionId=item.no||'';
  return item;
}
function migrateData(){
  state.clarifications=state.clarifications.map(i=>normalizeItem('clarification',i));
  state.meetings=state.meetings.map(i=>normalizeItem('meeting',i));
  state.actions=state.actions.map(i=>normalizeItem('action',i));
  state.trash=(state.trash||[]).map(i=>({...i,item:normalizeItem(i.sourceType||'clarification',i.item||{})}));
  save();
}
function ensureOption(list,val){
  const v=String(val||'').trim();
  if(!v)return;
  if(!list.includes(v))list.push(v);
}
function rebuildCategoryOptions(){
  const d=[...DISCIPLINES_DEFAULT],t=[...CL_TYPES_DEFAULT];
  state.clarifications.forEach(i=>{ensureOption(d,i.discipline);ensureOption(t,i.type)});
  state.clarifications.forEach(i=>ensureOption(sourceOptions,i.source));
  state.meetings.forEach(i=>ensureOption(d,i.discipline));
  state.meetings.forEach(i=>ensureOption(actionByOptions,i.actionBy));
  state.clarifications.forEach(i=>ensureOption(actionByOptions,i.actionBy));
  state.trash.forEach(x=>{ensureOption(d,x.item?.discipline);ensureOption(t,x.item?.type)});
  state.trash.forEach(x=>{ensureOption(actionByOptions,x.item?.actionBy);ensureOption(sourceOptions,x.item?.source)});
  disciplineOptions=[...new Set([...(disciplineOptions||[]),...d])];
  typeOptions=[...new Set([...(typeOptions||[]),...t])];
  actionByOptions=[...new Set([...(actionByOptions||[]),...ACTION_BY_DEFAULT])];
  sourceOptions=[...new Set([...(sourceOptions||[]),...SOURCES_DEFAULT])];
}
function addCategory(kind){
  const promptText=kind==='discipline'?t('输入新专业类别','New discipline'):
    kind==='type'?t('输入新意见类型','New type'):
    kind==='actionBy'?t('输入新责任方','New owner'):
    t('输入新来源','New source');
  const name=prompt(promptText);
  if(!name)return;
  if(kind==='discipline')ensureOption(disciplineOptions,name);
  else if(kind==='type')ensureOption(typeOptions,name);
  else if(kind==='actionBy')ensureOption(actionByOptions,name);
  else if(kind==='source')ensureOption(sourceOptions,name);
  save();renderCurrentView();toast(t('类别已添加','Option added'));
}
function getOptionListByKind(kind){
  if(kind==='discipline')return disciplineOptions;
  if(kind==='type')return typeOptions;
  if(kind==='actionBy')return actionByOptions;
  if(kind==='source')return sourceOptions;
  return [];
}
function getOptionLabelByKind(kind){
  if(kind==='discipline')return'专业';
  if(kind==='type')return'类型';
  if(kind==='actionBy')return'责任方';
  if(kind==='source')return'来源';
  return'选项';
}
function removeCategoryValue(kind,val){
  const list=getOptionListByKind(kind);
  const idx=list.indexOf(val);
  if(idx<0)return false;
  list.splice(idx,1);
  if(kind==='discipline'){
    state.clarifications.forEach(i=>{if(i.discipline===val)i.discipline=''});
    state.meetings.forEach(i=>{if(i.discipline===val)i.discipline=''});
  }else if(kind==='type'){
    state.clarifications.forEach(i=>{if(i.type===val)i.type=''});
  }else if(kind==='actionBy'){
    state.clarifications.forEach(i=>{if(i.actionBy===val)i.actionBy=''});
    state.meetings.forEach(i=>{if(i.actionBy===val)i.actionBy=''});
    state.actions.forEach(i=>{if(i.actionBy===val)i.actionBy=''});
  }else if(kind==='source'){
    state.clarifications.forEach(i=>{if(i.source===val)i.source=''});
  }
  return true;
}
function manageInlineOption(el,kind,type,id,field){
  const val=el.value;
  if(val!=='__add__'&&val!=='__delete__')return;
  const list=getOptionListByKind(kind);
  const label=getOptionLabelByKind(kind);
  if(val==='__add__'){
    const name=(prompt(t(`新增${label}：`,`Add ${label}:`))||'').trim();
    if(name){
      ensureOption(list,name);
      const arr=findCollectionByType(type);
      const item=arr.find(i=>i.id===id);
      if(item){
        item[field]=name;
        updateMeta(item,{type:'EDIT',field,from:'',to:name});
      }
      save();
      renderCurrentView();
      toast(t(`${label}已新增`,`${label} added`),'info');
      return;
    }
  }
  if(val==='__delete__'){
    openOptionDeleteModal(kind,type,id,field);
    return;
  }
  renderCurrentView();
}
function normalizedText(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\s]/g,' ').replace(/\s+/g,' ').trim()}
function refreshDuplicateSet(){
  const map=new Map();
  state.clarifications.forEach(i=>{
    const key=normalizedText(i.clarification);
    if(key.length<12)return;
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(i.id);
  });
  duplicateIdSet=new Set();
  map.forEach(ids=>{if(ids.length>1)ids.forEach(id=>duplicateIdSet.add(id))});
}
function validateRequired(type,item){
  const req=REQUIRED_FIELDS[type]||[];
  const missing=req.filter(f=>!String(item[f]||'').trim());
  return{ok:missing.length===0,missing};
}
function validateDateRules(type,item){
  const errs=[];
  const cmp=(a,b)=>new Date(a).getTime()-new Date(b).getTime();
  if(type==='meeting'){
    if(item.meetingDate&&item.plannedDate&&!isNaN(new Date(item.meetingDate))&&!isNaN(new Date(item.plannedDate))){
      if(cmp(item.plannedDate,item.meetingDate)<0)errs.push(t('计划日期不能早于会议日期','Planned date must be after or equal to meeting date'));
    }
  }
  if(type==='clarification'){
    if(item.openDate&&item.currentDueDate&&!isNaN(new Date(item.openDate))&&!isNaN(new Date(item.currentDueDate))){
      if(cmp(item.currentDueDate,item.openDate)<0)errs.push(t('到期日不能早于开始日','Due date must be after or equal to open date'));
    }
  }
  return errs;
}
function isOverdue(item){const due=getDueDate(item);if(!due)return false;const s=normalizeStatus(item.status);if(s==='CLOSED')return false;return new Date(due)<new Date()}
function toast(msg,type='success'){const el=document.createElement('div');el.className='toast toast-'+type;el.textContent=msg;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>el.remove(),3000)}
function escHtml(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function escJs(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ')}
function bytesToSize(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return`${n} B`;
  if(n<1024*1024)return`${(n/1024).toFixed(1)} KB`;
  return`${(n/1024/1024).toFixed(2)} MB`;
}
function openAttachmentDb(){
  if(attachmentDbPromise)return attachmentDbPromise;
  attachmentDbPromise=new Promise((resolve,reject)=>{
    if(!window.indexedDB){resolve(null);return}
    const req=indexedDB.open(ATTACHMENT_DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(ATTACHMENT_STORE)){
        const store=db.createObjectStore(ATTACHMENT_STORE,{keyPath:'id'});
        store.createIndex('projectId','projectId',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('open indexeddb failed'));
  });
  return attachmentDbPromise;
}
async function withAttachmentStore(mode,runner){
  const db=await openAttachmentDb();
  if(!db)return null;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(ATTACHMENT_STORE,mode);
    const store=tx.objectStore(ATTACHMENT_STORE);
    const out=runner(store,tx);
    tx.oncomplete=()=>resolve(out);
    tx.onerror=()=>reject(tx.error||new Error('indexeddb tx failed'));
  });
}
async function putAttachmentBlob(meta,blob){
  const db=await openAttachmentDb();
  if(!db)throw new Error('IndexedDB unavailable');
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(ATTACHMENT_STORE,'readwrite');
    const store=tx.objectStore(ATTACHMENT_STORE);
    const req=store.put({
      id:meta.id,
      projectId:meta.projectId,
      itemId:meta.itemId,
      fieldKey:meta.fieldKey,
      sourceType:meta.sourceType,
      name:meta.name,
      type:meta.type,
      size:meta.size,
      createdAt:nowIso(),
      blob
    });
    req.onsuccess=()=>resolve(true);
    req.onerror=()=>reject(req.error||new Error('put blob failed'));
  });
}
async function getAttachmentBlob(attId){
  const db=await openAttachmentDb();
  if(!db)return null;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(ATTACHMENT_STORE,'readonly');
    const req=tx.objectStore(ATTACHMENT_STORE).get(attId);
    req.onsuccess=()=>resolve(req.result?req.result.blob:null);
    req.onerror=()=>reject(req.error||new Error('get blob failed'));
  });
}
async function deleteAttachmentBlob(attId){
  const db=await openAttachmentDb();
  if(!db)return false;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(ATTACHMENT_STORE,'readwrite');
    const req=tx.objectStore(ATTACHMENT_STORE).delete(attId);
    req.onsuccess=()=>resolve(true);
    req.onerror=()=>reject(req.error||new Error('delete blob failed'));
  });
}
async function deleteProjectAttachments(projectId){
  const db=await openAttachmentDb();
  if(!db)return;
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(ATTACHMENT_STORE,'readwrite');
    const store=tx.objectStore(ATTACHMENT_STORE);
    const idx=store.index('projectId');
    const req=idx.openCursor(IDBKeyRange.only(projectId));
    req.onsuccess=e=>{
      const cursor=e.target.result;
      if(!cursor){resolve();return}
      cursor.delete();
      cursor.continue();
    };
    req.onerror=()=>reject(req.error||new Error('delete project blobs failed'));
  });
}
function dataUrlToBlob(dataUrl){
  const parts=String(dataUrl||'').split(',');
  if(parts.length<2)return null;
  const mime=(parts[0].match(/:(.*?);/)||[])[1]||'application/octet-stream';
  const bstr=atob(parts[1]);
  const len=bstr.length;
  const bytes=new Uint8Array(len);
  for(let i=0;i<len;i++)bytes[i]=bstr.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
async function downloadAttachmentBlob(attId,name,preview){
  const blob=await getAttachmentBlob(attId);
  if(!blob){toast(t('附件内容不存在，可能已被清理','Attachment blob is missing, it may have been cleaned'),'error');return}
  const url=URL.createObjectURL(blob);
  if(preview){
    openImagePreview(url,name||t('图片预览','Image Preview'));
    return;
  }
  const a=document.createElement('a');
  a.href=url;
  a.download=name||'attachment';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function collectAllAttachmentRows(){
  const rows=[];
  const pushRows=(list,sourceType,inTrash)=>{
    (list||[]).forEach(item=>{
      const map=item.fieldAttachments||{};
      Object.keys(map).forEach(fieldKey=>{
        (map[fieldKey]||[]).forEach((att,idx)=>{
          const sourceLabel=sourceType==='clarification'?t('澄清','Clarification'):
            sourceType==='meeting'?t('会议','Meeting'):
            sourceType==='action'?t('行动项','Action'):
            sourceType;
          rows.push({
            sourceType,
            sourceLabel,
            itemId:item.id,
            itemNo:item.actionId||item.no||'',
            fieldKey,
            index:idx,
            inTrash,
            name:att.name||'file',
            size:Number(att.size)||0,
            attId:att.id||''
          });
        });
      });
    });
  };
  pushRows(state.clarifications,'clarification',false);
  pushRows(state.meetings,'meeting',false);
  (state.trash||[]).forEach(t=>pushRows([t.item],t.sourceType||'clarification',true));
  return rows;
}
function renderStoragePanel(stats){
  const rows=backendMode
    ? ((stats&&stats.topAttachments)||[]).map(r=>({
      sourceLabel:t('数据库附件','DB Attachment'),
      itemNo:'—',
      fieldKey:'fieldAttachments',
      name:r.name||'attachment',
      size:Number(r.size)||0,
      inTrash:false,
      sourceType:'clarification',
      itemId:'',
      index:0,
      attId:r.attId||''
    }))
    : collectAllAttachmentRows().sort((a,b)=>b.size-a.size);
  const localBytes=backendMode?Number((stats&&stats.structuredBytes)||0):estimateProjectBytes();
  const attBytes=backendMode?Number((stats&&stats.attachmentBytes)||0):rows.reduce((n,r)=>n+r.size,0);
  const top=rows.slice(0,18);
  const modeNote=backendMode
    ? t(`当前为强制后端数据库模式。结构化数据 ${bytesToSize(localBytes)}，附件 ${bytesToSize(attBytes)}，数据库文件 ${bytesToSize(Number((stats&&stats.dbFileBytes)||0))}。`,'Forced backend DB mode. Structured data, attachments and DB file size are read from backend stats directly.')
    : t('附件已优先使用 IndexedDB 存储，主数据仍在 localStorage；可在下方按大小快速清理。','Attachments now use IndexedDB while main records stay in localStorage; clean up large files below when needed.');
  const modal=document.getElementById('modal');
  modal.innerHTML=`<div class="modal-content" style="max-width:980px"><div class="modal-header"><h2>${t('本地存储分析','Storage Analysis')}</h2><button class="modal-close" onclick="closeModalPreview()">✕</button></div><div class="modal-body"><div class="storage-grid"><div class="storage-stat"><div class="storage-k">${t('结构化数据估算','Structured Data')}</div><div class="storage-v">${bytesToSize(localBytes)}</div></div><div class="storage-stat"><div class="storage-k">${t('附件估算总量','Attachment Total')}</div><div class="storage-v">${bytesToSize(attBytes)}</div></div><div class="storage-stat"><div class="storage-k">${t('附件数量','Attachment Count')}</div><div class="storage-v">${backendMode?Number((stats&&stats.attachmentCount)||0):rows.length}</div></div><div class="storage-stat"><div class="storage-k">${t('建议','Recommendation')}</div><div class="storage-v">${attBytes>20*1024*1024?t('建议清理大附件','Clean large files'):t('容量健康','Healthy')}</div></div></div><div class="storage-note">${modeNote}</div><div class="table-scroll" style="max-height:340px"><table><thead><tr><th>${t('来源','Source')}</th><th>${t('编号','No.')}</th><th>${t('字段','Field')}</th><th>${t('文件名','File')}</th><th>${t('大小','Size')}</th><th>${t('位置','Scope')}</th><th>${t('动作','Action')}</th></tr></thead><tbody>${top.length?top.map(r=>`<tr><td><span class="cell-discipline">${escHtml(r.sourceLabel||r.sourceType)}</span></td><td class="cell-id">${escHtml(r.itemNo||'—')}</td><td class="cell-date">${escHtml(r.fieldKey)}</td><td>${escHtml(r.name)}</td><td class="cell-date">${bytesToSize(r.size)}</td><td class="cell-date">${r.inTrash?t('回收站','Recycle'):t('业务区','Active')}</td><td>${backendMode?`<span class="cell-date">${t('后端维护','Backend managed')}</span>`:`<button class="btn btn-danger" style="padding:3px 8px;font-size:.7rem" onclick="removeAttachmentByRef('${escJs(r.sourceType)}','${escJs(r.itemId)}','${escJs(r.fieldKey)}',${r.index},true)">${t('删除','Delete')}</button>`}</td></tr>`).join(''):`<tr><td colspan="7" class="no-data">${t('暂无附件数据','No attachment data')}</td></tr>`}</tbody></table></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModalPreview()">${t('关闭','Close')}</button></div></div>`;
  modal.classList.add('open');
}
async function runAttachmentMigration(){
  if(attachmentMigrationRunning)return;
  attachmentMigrationRunning=true;
  let changed=false;
  const migrateOne=async(item)=>{
    const map=item.fieldAttachments||{};
    for(const fieldKey of Object.keys(map)){
      for(const att of map[fieldKey]||[]){
        if(att&&att.storage==='idb'&&att.id)continue;
        if(att&&att.data){
          const blob=dataUrlToBlob(att.data);
          if(blob){
            const id=att.id||uid();
            try{
              await putAttachmentBlob({id,projectId:activeProjectId,itemId:item.id,fieldKey,sourceType:'migrated',name:att.name||'attachment',type:att.type||blob.type||'application/octet-stream',size:att.size||blob.size},blob);
              att.id=id;
              att.storage='idb';
              att.size=att.size||blob.size;
              delete att.data;
              changed=true;
            }catch(e){/* keep inline fallback */}
          }
        }
      }
    }
  };
  for(const i of state.clarifications)await migrateOne(i);
  for(const i of state.meetings)await migrateOne(i);
  for(const tItem of state.trash||[])await migrateOne(tItem.item||{});
  if(changed){save();renderCurrentView();toast(t('历史附件已迁移到 IndexedDB','Legacy attachments migrated to IndexedDB'),'info')}
  attachmentMigrationRunning=false;
}
function estimateProjectBytes(){
  try{
    return new Blob([
      JSON.stringify(state.clarifications||[]),
      JSON.stringify(state.meetings||[]),
      JSON.stringify(state.actions||[]),
      JSON.stringify(state.trash||[])
    ]).size;
  }catch(e){
    return 0;
  }
}
async function storageReport(){
  if(backendMode){
    try{
      const stats=await apiRequest(`/api/storage/stats?projectId=${encodeURIComponent(activeProjectId)}`);
      renderStoragePanel(stats||{});
      return;
    }catch(e){
      toast(t('后端存储统计读取失败','Failed to load backend storage stats'),'error');
    }
  }
  renderStoragePanel();
}
function showQuickGuide(){
  const modal=document.getElementById('modal');
  modal.innerHTML=`<div class="modal-content" style="max-width:960px"><div class="modal-header"><h2>${t('使用说明（工程协同版）','Engineer Workflow Guide')}</h2><button class="modal-close" onclick="closeModalPreview()">✕</button></div><div class="modal-body"><div class="guide-grid"><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.plus}</span><span class="guide-title">1. ${t('先建两类源池','Build Two Source Pools')}</span></div><div class="guide-text">${t('技术澄清录入“技术澄清”，会议任务录入“会议纪要”。源池完整，行动项才会准确聚合。','Put technical queries in Clarifications and meeting tasks in Meetings. Accurate Actions require complete source pools.')}</div></div><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.search}</span><span class="guide-title">2. ${t('30秒定位待办','Find Work in 30 Seconds')}</span></div><div class="guide-text">${t('建议筛选顺序：状态 -> 责任方 -> 逾期 -> 搜索关键词；会议看板再加主题筛选可快速定位单次会议闭环。','Recommended filter order: status -> owner -> overdue -> keyword. Add subject filter in Meetings to isolate one meeting cycle.')}</div></div><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.check}</span><span class="guide-title">3. ${t('每日闭环节奏','Daily Closure Rhythm')}</span></div><div class="guide-text">${t('每天优先处理：逾期 > HIGH > 7天内到期。状态统一为 OPEN / IN_PROGRESS / CLOSED，关闭后会回写源记录。','Prioritize: Overdue > HIGH > Due in 7 days. Keep status as OPEN / IN_PROGRESS / CLOSED. Closing writes back to source.')}</div></div><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.save}</span><span class="guide-title">4. ${t('高频录入快捷键','High-Frequency Shortcuts')}</span></div><div class="guide-text">${t('Ctrl+N 新增，Ctrl+S 保存编辑，Ctrl+Shift+X 快速关闭当前行，Alt+1~6 切换主标签页（含PDF意见）。','Ctrl+N add, Ctrl+S save edit, Ctrl+Shift+X quick close focused row, Alt+1~6 switch tabs (including PDF comments).')}</div></div><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.db}</span><span class="guide-title">5. ${t('存储与性能维护','Storage and Performance')}</span></div><div class="guide-text">${t('当前为强制后端模式。存储面板数据来自后端统计，建议定期清理超大附件并按周导出归档。','Forced backend mode is enabled. Storage panel reads backend stats directly. Clean heavy attachments and archive weekly.')}</div></div><div class="guide-step"><div class="guide-head"><span class="guide-icon">${IC.download}</span><span class="guide-title">6. ${t('交接与复盘标准动作','Handover and Review')}</span></div><div class="guide-text">${t('对外沟通前导出 Excel；执行清空前先导出备份。PDF意见看板支持批量导入与导出。','Export Excel before external communication. Export backup before clear actions. PDF comments board supports batch import/export.')}</div></div></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModalPreview()">${t('关闭','Close')}</button></div></div>`;
  modal.classList.add('open');
}
function getFieldAttachments(item,fieldKey){
  const map=item.fieldAttachments||{};
  return Array.isArray(map[fieldKey])?map[fieldKey]:[];
}
function isImageAttachment(att){return String(att.type||'').startsWith('image/')}
function openImagePreview(src,name){
  const modal=document.getElementById('modal');
  modal.innerHTML=`<div class="modal-content" style="max-width:960px"><div class="modal-header"><h2>${escHtml(name||t('图片预览','Image Preview'))}</h2><button class="modal-close" onclick="closeModalPreview()">✕</button></div><div class="modal-body" style="text-align:center"><img class="preview-image" src="${src}" alt="preview"></div></div>`;
  modal.classList.add('open');
}
function openImagePreviewFromEl(el){openImagePreview(el.dataset.src||'',el.dataset.name||t('图片预览','Image Preview'))}
function closeModalPreview(){const modal=document.getElementById('modal');modal.classList.remove('open');modal.innerHTML=''}
function closeOptionDeleteModal(){pendingOptionDeleteContext=null;closeModalPreview()}
function openOptionDeleteModal(kind,type,id,field){
  const label=getOptionLabelByKind(kind);
  const options=getOptionListByKind(kind).filter(Boolean);
  if(!options.length){toast(t(`暂无可删除${label}`,`No ${label} to delete`),'error');renderCurrentView();return}
  pendingOptionDeleteContext={kind,type,id,field};
  const modal=document.getElementById('modal');
  modal.innerHTML=`<div class="modal-content" style="max-width:520px"><div class="modal-header"><h2>${t(`选择要删除的${label}`,`Select ${label} to delete`)}</h2><button class="modal-close" onclick="closeOptionDeleteModal()">✕</button></div><div class="modal-body"><div class="option-list">${options.map(v=>`<button type="button" class="option-pill" onclick="confirmDeleteOption('${kind}','${escJs(v)}')">${escHtml(v)}</button>`).join('')}</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeOptionDeleteModal()">${t('取消','Cancel')}</button></div></div>`;
  modal.classList.add('open');
}
function confirmDeleteOption(kind,val){
  const ctx=pendingOptionDeleteContext;
  if(!ctx||ctx.kind!==kind)return;
  if(!confirm(t(`确认删除${getOptionLabelByKind(kind)}：${val}？`,`Delete ${getOptionLabelByKind(kind)}: ${val}?`)))return;
  removeCategoryValue(kind,val);
  const arr=findCollectionByType(ctx.type);
  const item=arr.find(i=>i.id===ctx.id);
  if(item&&item[ctx.field]===val)item[ctx.field]='';
  save();
  closeOptionDeleteModal();
  renderCurrentView();
  toast(t(`${getOptionLabelByKind(kind)}已删除`,`${getOptionLabelByKind(kind)} removed`),'info');
}
function renderAttachmentThumb(att,meta){
  const titleDel=t('删除附件','Delete attachment');
  const deleteBtn=`<button type="button" style="border:none;background:transparent;color:var(--red);cursor:pointer;font-size:.72rem;padding:0 2px" onclick="removeAttachmentByRef('${meta.sourceType}','${meta.id}','${meta.fieldKey}',${meta.index})" title="${titleDel}">✕</button>`;
  if(att.storage==='db'&&att.id){
    const isImg=isImageAttachment(att);
    const openLabel=isImg?t('预览','Preview'):t('下载','Download');
    return `<span style="display:inline-flex;align-items:center;gap:4px"><button type="button" class="btn btn-outline" style="padding:2px 6px;font-size:.66rem" onclick="downloadBackendAttachment('${escJs(att.id)}','${escJs(att.name||'attachment')}',${isImg?'true':'false'})" title="${openLabel} ${escHtml(att.name||'')}">${isImg?'IMG':'FILE'}</button><span class="cell-date">${bytesToSize(att.size||0)}</span>${deleteBtn}</span>`;
  }
  if(att.storage==='idb'&&att.id){
    const isImg=isImageAttachment(att);
    const openLabel=isImg?t('预览','Preview'):t('下载','Download');
    return `<span style="display:inline-flex;align-items:center;gap:4px"><button type="button" class="btn btn-outline" style="padding:2px 6px;font-size:.66rem" onclick="downloadAttachmentBlob('${escJs(att.id)}','${escJs(att.name||'attachment')}',${isImg?'true':'false'})" title="${openLabel} ${escHtml(att.name||'')}">${isImg?'IMG':'FILE'}</button><span class="cell-date">${bytesToSize(att.size||0)}</span>${deleteBtn}</span>`;
  }
  if(isImageAttachment(att)&&att.data){
    return `<span style="display:inline-flex;align-items:center;gap:2px"><button style="border:none;background:transparent;padding:0;cursor:pointer" data-src="${escHtml(att.data)}" data-name="${escHtml(att.name)}" onclick="openImagePreviewFromEl(this)" title="${t('预览','Preview')} ${escHtml(att.name)}"><img src="${att.data}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"></button>${deleteBtn}</span>`;
  }
  if(att.data){
    return `<span style="display:inline-flex;align-items:center;gap:2px"><a href="${att.data}" download="${escHtml(att.name)}" title="${escHtml(att.name)}" style="font-size:.66rem;padding:2px 6px;border:1px solid var(--border);border-radius:4px;color:var(--text-secondary)">${escHtml(att.name||'FILE')}</a>${deleteBtn}</span>`;
  }
  return `<span style="display:inline-flex;align-items:center;gap:4px"><span class="cell-date">${escHtml(att.name||'FILE')}</span>${deleteBtn}</span>`;
}
async function downloadBackendAttachment(attId,name,preview){
  if(!backendMode){
    toast(t('仅后端模式支持此附件读取','This attachment requires backend mode'),'error');
    return;
  }
  try{
    const data=await apiRequest(`/api/attachment?projectId=${encodeURIComponent(activeProjectId)}&attId=${encodeURIComponent(attId)}`);
    if(!data||!data.ok||!data.data){
      toast(t('附件读取失败','Attachment read failed'),'error');
      return;
    }
    if(preview){
      openImagePreview(data.data,name||data.name||t('图片预览','Image Preview'));
      return;
    }
    const a=document.createElement('a');
    a.href=data.data;
    a.download=name||data.name||'attachment';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){
    toast(t('附件读取失败','Attachment read failed'),'error');
  }
}
function renderFieldWithAttachments(item,fieldKey,sourceType,isEditing,maxW){
  const text=isEditing
    ? `<div class="inline-cell" contenteditable="true" data-field="${fieldKey}" style="max-width:${maxW||280}px" onpaste="handleAttachmentPaste(event,'${sourceType}','${item.id}','${fieldKey}')">${escHtml(item[fieldKey]||'')}</div>`
    : `<div class="cell-text" onclick="this.classList.toggle('expanded')">${escHtml(item[fieldKey]||'')}</div>`;
  const list=getFieldAttachments(item,fieldKey);
  const thumbs=list.map((att,idx)=>renderAttachmentThumb(att,{sourceType,id:item.id,fieldKey,index:idx})).join('');
  return `${text}<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap"><button class="btn btn-outline" style="padding:2px 8px;font-size:.7rem" onclick="openAttachmentPicker('${sourceType}','${item.id}','${fieldKey}')">+${t('附件','Attach')}</button><span class="cell-date">${list.length}</span>${thumbs}</div>`;
}
function openAttachmentPicker(sourceType,id,fieldKey){pendingAttachmentTarget={sourceType,id,fieldKey};document.getElementById('attachmentInput').click()}
function findCollectionByType(type){return type==='clarification'?state.clarifications:type==='meeting'?state.meetings:state.actions}
async function attachToItem(sourceType,id,fieldKey,file,rerender){
  const shouldRerender=rerender!==false;
  const arr=findCollectionByType(sourceType);
  const item=arr.find(i=>i.id===id);if(!item)return;
  item.fieldAttachments=item.fieldAttachments||{};
  item.fieldAttachments[fieldKey]=item.fieldAttachments[fieldKey]||[];
  const attId=uid();
  const payload={id:attId,name:file.name,type:file.type||'application/octet-stream',size:file.size,storage:'idb'};
  if(backendMode){
    const data=await blobToDataUrl(file);
    payload.storage='inline';
    payload.data=data;
  }else{
    try{
      await putAttachmentBlob({id:attId,projectId:activeProjectId,itemId:id,fieldKey,sourceType,name:payload.name,type:payload.type,size:payload.size},file);
    }catch(e){
      const reader=new FileReader();
      const data=await new Promise((resolve,reject)=>{
        reader.onload=x=>resolve(x.target.result);
        reader.onerror=()=>reject(reader.error||new Error('read file failed'));
        reader.readAsDataURL(file);
      });
      payload.storage='inline';
      payload.data=data;
    }
  }
  item.fieldAttachments[fieldKey].push(payload);
  updateMeta(item,{type:'ATTACH_ADD',field:fieldKey,from:'',to:file.name});
  save();
  if(shouldRerender)renderCurrentView();
  toast(t('附件已添加','Attachment added'));
}
function findAttachmentItemRef(sourceType,id,fieldKey,index){
  const arr=findCollectionByType(sourceType);
  const item=arr.find(i=>i.id===id);
  if(!item||!item.fieldAttachments||!Array.isArray(item.fieldAttachments[fieldKey]))return null;
  const files=item.fieldAttachments[fieldKey];
  if(index<0||index>=files.length)return null;
  return{item,files,attachment:files[index]};
}
async function removeAttachmentByRef(sourceType,id,fieldKey,index,silentRefresh){
  let targetRef=findAttachmentItemRef(sourceType,id,fieldKey,index);
  if(!targetRef){
    const fromTrash=(state.trash||[]).find(t=>t.item&&t.item.id===id&&t.sourceType===sourceType);
    if(fromTrash){
      const item=fromTrash.item;
      const files=((item.fieldAttachments||{})[fieldKey]||[]);
      if(index>=0&&index<files.length)targetRef={item,files,attachment:files[index]};
    }
  }
  if(!targetRef)return;
  const removed=targetRef.files.splice(index,1)[0];
  if(removed&&removed.storage==='idb'&&removed.id){
    try{await deleteAttachmentBlob(removed.id)}catch(e){}
  }
  updateMeta(targetRef.item,{type:'ATTACH_REMOVE',field:fieldKey,from:removed?.name||'',to:''});
  save();
  if(silentRefresh){await storageReport();return}
  renderCurrentView();
  toast(t('附件已删除','Attachment removed'),'info');
}
async function removeAttachment(sourceType,id,fieldKey,index){
  await removeAttachmentByRef(sourceType,id,fieldKey,index,false);
}
async function handleAttachmentPaste(event,sourceType,id,fieldKey){
  const items=(event.clipboardData&&event.clipboardData.items)||[];
  for(let i=0;i<items.length;i++){
    const it=items[i];
    if(it.kind==='file'&&String(it.type||'').startsWith('image/')){
      const file=it.getAsFile();
      if(file){
        const fname=`pasted_${Date.now()}.png`;
        const imgFile=new File([file],fname,{type:file.type||'image/png'});
        await attachToItem(sourceType,id,fieldKey,imgFile,false);
        event.preventDefault();
      }
      break;
    }
  }
}
function moveToTrash(type,id,silent){
  const arr=findCollectionByType(type);
  const idx=arr.findIndex(i=>i.id===id);
  if(idx<0)return;
  const item=arr[idx];
  arr.splice(idx,1);
  state.trash.unshift({trashId:uid(),sourceType:type,deletedAt:nowIso(),item});
  refreshDuplicateSet();
  if(!silent){save();renderNav();renderCurrentView();toast(t('已移至回收站','Moved to recycle'));}
}
function restoreFromTrash(trashId,silent){
  const idx=state.trash.findIndex(t=>t.trashId===trashId);if(idx<0)return;
  const tr=state.trash[idx];state.trash.splice(idx,1);
  const arr=findCollectionByType(tr.sourceType);
  arr.unshift(tr.item);
  rebuildCategoryOptions();
  refreshDuplicateSet();
  if(!silent){save();renderNav();renderCurrentView();toast(t('已恢复','Restored'));}
}
async function emptyTrash(){
  if(!confirm(t('确认永久清空回收站？附件也会被删除。','Permanently empty recycle bin? Attachment blobs will also be removed.')))return;
  const rows=[];
  (state.trash||[]).forEach(tItem=>{
    const map=(tItem.item&&tItem.item.fieldAttachments)||{};
    Object.keys(map).forEach(k=>{(map[k]||[]).forEach(att=>rows.push(att))});
  });
  for(const att of rows){
    if(att&&att.storage==='idb'&&att.id){try{await deleteAttachmentBlob(att.id)}catch(e){}}
  }
  state.trash=[];
  save();
  renderNav();
  renderCurrentView();
  toast(t('回收站已清空','Recycle bin emptied'));
}
function getAllOpenItems(){
  const cl=state.clarifications.filter(i=>{const s=normalizeStatus(i.status);return s==='OPEN'||s==='IN_PROGRESS'});
  const mt=state.meetings.filter(i=>{const s=normalizeStatus(i.status);return s==='OPEN'||s==='IN_PROGRESS'});
  return[
    ...cl.map(i=>({...i,_sourceType:'clarification',_sourceLabel:t('澄清','Clarification')})),
    ...mt.map(i=>({...i,_sourceType:'meeting',_sourceLabel:t('会议','Meeting')}))
  ];
}

// ===== SIDEBAR =====
function renderSidebar(){
  const sb=document.getElementById('sidebar');
  sb.innerHTML=`
  <div class="sb-logo"><div class="sb-logo-mark">ET</div><div class="sb-logo-text">Eng Tracker<small>${t('设备采购追踪系统','Equipment Tracking')}</small></div><button id="sidebarToggleBtn" class="sb-toggle-btn" onclick="toggleSidebar()" title="${t('隐藏目录','Collapse Sidebar')}">◀</button></div>
  <div class="sb-section">
    <div class="sb-section-title">${t('项目目录','Projects')}</div>
    <ul class="sb-proj-list">${projects.map(p=>`<li class="sb-proj-item${p.id===activeProjectId?' active':''}" onclick="switchProject('${p.id}')"><span>${escHtml(p.name)}</span><span class="proj-tools"><button class="proj-del" onclick="event.stopPropagation();renameProject('${p.id}')" title="重命名">✎</button>${projects.length>1?`<button class="proj-del" onclick="event.stopPropagation();deleteProject('${p.id}')" title="删除">✕</button>`:''}</span></li>`).join('')}</ul>
    <div class="sb-add-proj"><input id="newProjInput" placeholder="${t('新增项目名...','New project name...')}" onkeydown="if(event.key==='Enter')addProject()"><button onclick="addProject()">${t('添加','Add')}</button></div>
  </div>`;
  updateSidebarToggleButtons();
}
function switchDocPackageFromSidebar(packageId){
  docBoard.activePackageId=packageId;
  saveDocBoard();
  switchTab('dashboard');
}
async function switchProject(id){
  activeProjectId=id;
  saveProjects();
  load();
  if(backendMode)await pullBackendState(activeProjectId);
  loadDocBoard();
  state.selected.clear();state.editingId=null;state.meetingDateFilter='';state.meetingSubjectFilter='';state.actionReplyEditId='';
  renderAll();
}
function addProject(){const inp=document.getElementById('newProjInput');const n=inp.value.trim();if(!n){toast(t('请输入项目名','Please input project name'),'error');return}projects.push({id:uid(),name:n});saveProjects();inp.value='';renderSidebar()}
function renameProject(id){
  const p=projects.find(x=>x.id===id);if(!p)return;
  const n=(prompt(t('修改项目名称','Rename project'),p.name)||'').trim();
  if(!n)return;
  p.name=n;
  saveProjects();
  renderSidebar();
  renderHeader();
}
async function deleteProject(id){
  if(!confirm(t('确认删除此项目及所有数据？','Delete this project and all data?')))return;
  ['cl','act','mt','trash','disc_opts','type_opts','actionby_opts','source_opts','col_widths','doc_board'].forEach(k=>localStorage.removeItem(`et_${id}_${k}`));
  await deleteProjectAttachments(id);
  projects=projects.filter(p=>p.id!==id);
  if(activeProjectId===id)activeProjectId=projects[0]?.id||'';
  saveProjects();
  ensureDefaultProject();
  load();
  renderAll();
}

// ===== HEADER =====
function renderHeader(){
  const pName=projects.find(p=>p.id===activeProjectId)?.name||'';
  document.getElementById('mainHeader').innerHTML=`
  <div class="main-title-wrap">
    <div class="main-title">${escHtml(t(APP_TITLE_ZH,APP_TITLE_EN))}</div>
    <div class="main-subtitle">${t('当前项目','Current Project')}: <span>${escHtml(pName||t('未选择','None'))}</span></div>
  </div>
  <div class="header-right">
    <input id="operatorInput" value="${escHtml(operatorName)}" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-deep);color:var(--text-primary);font-size:.75rem;width:110px" placeholder="操作人" onchange="setOperator(this.value)">
    <button class="hdr-btn" onclick="toggleLanguage()">${uiLang==='zh'?'EN':'中文'}</button>
    <button class="hdr-btn hdr-icon-btn" onclick="toggleTheme()" title="${uiTheme==='dark'?t('切换浅色主题','Switch to light mode'):t('切换夜班主题','Switch to night mode')}">${uiTheme==='dark'?IC.sun:IC.moon}</button>
    <button class="hdr-btn" onclick="storageReport()">${t('存储','Storage')}</button>
    <button class="hdr-btn" onclick="showQuickGuide()">${IC.help} ${t('使用说明','Guide')}</button>
    <button class="hdr-btn" onclick="importSampleData()">${IC.db} ${t('示例数据','Sample')}</button>
    <button class="hdr-btn" onclick="clearCurrentProjectData()">${IC.trash} ${t('清空当前项目','Clear Project')}</button>
    <button class="hdr-btn" onclick="clearAllCachedData()">${IC.trash} ${t('一键清空','Clear All')}</button>
    <button class="hdr-btn" onclick="openAutoBackupDialog()">${IC.save} ${t('自动备份设置','Auto Backup')}</button>
    <button class="hdr-btn" onclick="runManualBackupNow()">${IC.download} ${t('立即备份','Backup Now')}</button>
    <button class="hdr-btn" onclick="document.getElementById('xlsxFileInput').click()">${IC.upload} ${t('导入Excel','Import Excel')}</button>
    <button class="hdr-btn" onclick="exportXlsx()">${IC.download} ${t('导出Excel','Export Excel')}</button>
  </div>`;
}
function closeFirstUseIntro(markSeen){
  const el=document.getElementById('firstUseIntro');
  if(!el)return;
  if(markSeen)localStorage.setItem(FIRST_USE_INTRO_KEY,'1');
  el.remove();
}
function showFirstUseIntro(){
  if(document.getElementById('firstUseIntro'))return;
  const host=document.createElement('div');
  host.id='firstUseIntro';
  host.className='first-use-intro';
  host.innerHTML=`<div class="first-use-card"><div class="first-use-head"><div class="first-use-title">${t('欢迎使用工程追踪工具','Welcome to Engineering Tracker')}</div><button class="modal-close" onclick="closeFirstUseIntro(false)">✕</button></div><div class="first-use-grid"><div class="first-use-item"><span class="guide-icon">${IC.plus}</span><div><strong>${t('第一步：补齐源问题','Step 1: Fill Source Records')}</strong><p>${t('技术问题进“技术澄清”，会议任务进“会议纪要”，行动项会自动聚合。','Put technical issues into Clarifications and meeting tasks into Meetings. Actions aggregate automatically.')}</p></div></div><div class="first-use-item"><span class="guide-icon">${IC.search}</span><div><strong>${t('第二步：快速锁定风险','Step 2: Focus Risk Fast')}</strong><p>${t('按“状态-责任方-逾期”筛选，先看逾期和 HIGH。','Filter by status-owner-overdue and prioritize overdue + HIGH.')}</p></div></div><div class="first-use-item"><span class="guide-icon">${IC.check}</span><div><strong>${t('第三步：推进闭环','Step 3: Drive Closure')}</strong><p>${t('更新状态并补充回复，关闭后自动回写源条目，保证可追溯。','Update status and reply. Closing writes back to source records for traceability.')}</p></div></div></div><div class="first-use-note">${t('提示：按 Alt+1~6 可切换看板（含PDF意见），Ctrl+Shift+X 可快速关闭当前行。','Tip: Use Alt+1~6 to switch tabs (including PDF comments) and Ctrl+Shift+X to quick-close focused row.')}</div><div class="first-use-actions"><button class="btn btn-outline" onclick="closeFirstUseIntro(false)">${t('稍后再看','Later')}</button><button class="btn btn-primary" onclick="closeFirstUseIntro(true)">${t('开始使用','Start')}</button></div></div>`;
  document.body.appendChild(host);
}
function maybeShowFirstUseIntro(){
  if(localStorage.getItem(FIRST_USE_INTRO_KEY)==='1')return;
  setTimeout(()=>showFirstUseIntro(),320);
}
function setOperator(v){operatorName=(v||'ME').trim()||'ME';localStorage.setItem('et_operator',operatorName);toast(t(`操作人已设为 ${operatorName}`,`Operator set to ${operatorName}`),'info')}
async function clearCurrentProjectData(){
  const projName=projects.find(p=>p.id===activeProjectId)?.name||'当前项目';
  if(!confirm(t(`确认清空项目【${projName}】的数据？\n本次会将条目移入回收站，可后续恢复。`,`Clear all records in [${projName}]?\nItems will be moved to recycle and can be restored.`)))return;
  if(backendMode){
    try{
      await apiRequest('/api/ops/clear-project',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({projectId:activeProjectId})
      });
      await pullBackendState(activeProjectId);
      refreshDuplicateSet();
      state.selected.clear();
      state.editingId=null;
      state.meetingDateFilter='';
      state.meetingSubjectFilter='';
      state.actionReplyEditId='';
      docBoard=createEmptyDocBoard();
      saveDocBoard();
      renderAll();
      toast(t(`已清空 ${projName}，并移入回收站`,`Cleared ${projName} and moved items to recycle`),'info');
      return;
    }catch(e){
      toast(t('清空项目失败','Clear project failed'),'error');
      return;
    }
  }
  const deletedAt=nowIso();
  const moved=[];
  state.clarifications.forEach(item=>moved.push({trashId:uid(),sourceType:'clarification',deletedAt,item}));
  state.meetings.forEach(item=>moved.push({trashId:uid(),sourceType:'meeting',deletedAt,item}));
  state.actions.forEach(item=>moved.push({trashId:uid(),sourceType:'action',deletedAt,item}));
  state.trash=[...moved,...state.trash];
  state.clarifications=[];
  state.meetings=[];
  state.actions=[];
  refreshDuplicateSet();
  save();
  state.selected.clear();
  state.editingId=null;
  state.meetingDateFilter='';
  state.meetingSubjectFilter='';
  state.actionReplyEditId='';
  docBoard=createEmptyDocBoard();
  saveDocBoard();
  renderAll();
  toast(t(`已清空 ${projName}，并移入回收站`,`Cleared ${projName} and moved items to recycle`),'info');
}
async function clearAllCachedData(){
  if(!confirm(t('确认清空本工具全部缓存数据？\n将删除所有项目、澄清、会议、回收站与配置。','Clear all cached data?\nThis deletes all projects, records, recycle bin and settings.')))return;
  if(backendMode){
    try{
      await apiRequest('/api/ops/clear-all',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      Object.keys(localStorage).filter(k=>k.startsWith('et_')).forEach(k=>localStorage.removeItem(k));
      alert(t('后端数据库与本地缓存已清空，页面将刷新。','Backend DB and local cache are cleared. The page will reload.'));
      location.reload();
      return;
    }catch(e){
      toast(t('一键清空失败','Clear all failed'),'error');
      return;
    }
  }
  Object.keys(localStorage).filter(k=>k.startsWith('et_')).forEach(k=>localStorage.removeItem(k));
  try{await withAttachmentStore('readwrite',store=>{store.clear();return true})}catch(e){}
  alert(t('缓存已清空，页面将刷新。','Cache cleared, page will reload.'));
  location.reload();
}
function updateSidebarToggleButtons(){
  const sbBtn=document.getElementById('sidebarToggleBtn');
  const floatBtn=document.getElementById('sidebarFloatToggle');
  if(sbBtn){
    sbBtn.textContent=sidebarCollapsed?'▶':'◀';
    sbBtn.title=sidebarCollapsed?t('展开目录','Expand Sidebar'):t('隐藏目录','Collapse Sidebar');
  }
  if(floatBtn){
    floatBtn.style.display=sidebarCollapsed?'flex':'none';
    floatBtn.textContent='▶';
    floatBtn.title=t('展开目录','Expand Sidebar');
  }
}
function toggleSidebar(){
  sidebarCollapsed=!sidebarCollapsed;
  localStorage.setItem('et_sidebar_collapsed',sidebarCollapsed?'1':'0');
  document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);
  updateSidebarToggleButtons();
}

// ===== NAV (行动项 moved before 技术澄清) =====
function renderNav(){
  const openAll=getAllOpenItems().length;
  const commentCount=(docBoard.pdfComments||[]).length;
  const tabs=[
    {id:'dashboard',label:t('仪表盘','Dashboard')},
    {id:'action',label:t('行动项','Actions'),count:openAll,warn:true},
    {id:'clarification',label:t('技术澄清','Clarifications'),count:state.clarifications.length},
    {id:'meeting',label:t('会议纪要','Meetings'),count:state.meetings.length},
    {id:'pdfcomments',label:t('PDF意见','PDF Comments'),count:commentCount},
    {id:'recycle',label:t('回收站','Recycle'),count:state.trash.length},
  ];
  document.getElementById('mainNav').innerHTML=tabs.map(t=>{
    const badgeCls=t.warn&&t.count>0?'badge badge-warn':'badge';
    return`<div class="nav-tab${state.currentTab===t.id?' active':''}" onclick="switchTab('${t.id}')">${t.label}${t.count!=null?`<span class="${badgeCls}">${t.count}</span>`:''}</div>`;
  }).join('');
}
function switchTab(id){if(id==='docboard')id='dashboard';state.currentTab=id;state.selected.clear();state.editingId=null;if(id!=='clarification')state.filters.duplicateOnly=false;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id+'View').classList.add('active');renderNav();renderCurrentView()}

// ===== DASHBOARD =====
function renderDashboard(){
  const all=[...state.clarifications,...state.actions,...state.meetings];
  const total=all.length;
  const openItems=getAllOpenItems().length;
  const overdueItems=all.filter(isOverdue).length;
  const closedItems=all.filter(i=>normalizeStatus(i.status)==='CLOSED').length;
  const rate=total?Math.round(closedItems/total*100):0;
  const soonDueItems=all.filter(i=>isDueInDays(i,7)).length;
  const highOpen=getAllOpenItems().filter(i=>String(i.priority||'').toUpperCase()==='HIGH').length;
  const ownerRisk=buildOwnerRisk();
  const comboRisk=buildComboRiskRows();
  const labelTotal=t('全部条目','Total Items');
  const labelOpen=t('待处理','Open');
  const labelOverdue=t('逾期','Overdue');
  const labelRate=t('关闭率','Closed Rate');
  const labelDue7=t('7天内到期','Due <= 7d');
  const labelHigh=t('高优先级未关闭','High Open');
  const dash=document.getElementById('dashboardView');
  dash.innerHTML=`
  <div class="kpi-row">
    <div class="kpi-card card-total"><div class="kpi-label">${labelTotal}</div><div class="kpi-value">${total}</div><div class="kpi-sub">${t('澄清','CL')}${state.clarifications.length} / ${t('行动汇总','ACT')}${openItems} / ${t('会议','MT')}${state.meetings.length}</div></div>
    <div class="kpi-card card-open"><div class="kpi-label">${labelOpen}</div><div class="kpi-value">${openItems}</div><div class="kpi-sub">${t('需要跟进处理','Need follow-up')}</div></div>
    <div class="kpi-card card-overdue"><div class="kpi-label">${labelOverdue}</div><div class="kpi-value">${overdueItems}</div><div class="kpi-sub">${t('超过计划日期','Past due date')}</div></div>
    <div class="kpi-card card-closed"><div class="kpi-label">${labelRate}</div><div class="kpi-value">${rate}%</div><div class="kpi-sub">${closedItems}/${total} ${t('已关闭','closed')}</div></div>
    <div class="kpi-card card-due7"><div class="kpi-label">${labelDue7}</div><div class="kpi-value">${soonDueItems}</div><div class="kpi-sub">${t('短期风险窗口','Near-term risk window')}</div></div>
    <div class="kpi-card card-high"><div class="kpi-label">${labelHigh}</div><div class="kpi-value">${highOpen}</div><div class="kpi-sub">${t('优先推动闭环','Prioritize closure')}</div></div>
  </div>
  <div class="charts-row">
    <div class="chart-box"><h3>${t('状态分布','Status Distribution')}</h3><canvas id="chartStatus"></canvas></div>
    <div class="chart-box"><h3>${t('专业分布','Discipline Breakdown')}</h3><canvas id="chartDiscipline"></canvas></div>
  </div>
  <div class="charts-row">
    <div class="chart-box"><h3>${t('责任方分布','Action By')}</h3><canvas id="chartActionBy"></canvas></div>
    <div class="chart-box"><h3>${t('优先级分布','Priority')}</h3><canvas id="chartPriority"></canvas></div>
  </div>`;
  dash.innerHTML+=`<div class="chart-box"><h3>${t('最近7天新增/关闭趋势','7-Day Created vs Closed')}</h3><canvas id="chartTrend"></canvas></div>`;
  dash.innerHTML+=`<div class="chart-box"><h3>${t('责任方风险排名','Owner Risk Ranking')}</h3>
    <div class="table-scroll" style="max-height:240px"><table><thead><tr><th>${t('责任方','Owner')}</th><th>${t('未关闭','Open')}</th><th>${t('逾期','Overdue')}</th><th>${t('高优先级','High')}</th><th>${t('风险分','Risk Score')}</th></tr></thead><tbody>
    ${ownerRisk.length?ownerRisk.map(r=>`<tr><td>${escHtml(r.owner)}</td><td>${r.open}</td><td>${r.overdue}</td><td>${r.high}</td><td class="cell-date">${r.score}</td></tr>`).join(''):`<tr><td colspan="5" class="no-data">${t('暂无风险数据','No risk data')}</td></tr>`}
    </tbody></table></div></div>`;
  dash.innerHTML+=`<div class="chart-box"><h3>${t('组合风险（逾期 + 高优先级 + 责任方）','Combo Risk: Overdue + High + Owner')}</h3>
    <div class="table-scroll" style="max-height:240px"><table><thead><tr><th>${t('责任方','Owner')}</th><th>${t('风险项数','Risk Items')}</th><th>${t('动作','Action')}</th></tr></thead><tbody>
    ${comboRisk.length?comboRisk.map(r=>`<tr><td>${escHtml(r.owner)}</td><td style="color:var(--red);font-weight:700">${r.count}</td><td><button class="btn btn-danger" style="padding:2px 8px;font-size:.68rem" onclick="applyRiskPreset('${escJs(r.owner)}')">${t('查看明细','Open Details')}</button></td></tr>`).join(''):`<tr><td colspan="3" class="no-data">${t('暂无组合风险项','No combo risk items')}</td></tr>`}
    </tbody></table></div></div>`;
  if(total===0){
    dash.innerHTML+=`<div class="chart-box"><h3>${t('暂无业务数据','No Business Data')}</h3><div class="no-data" style="padding:24px 12px">${t('当前项目没有澄清/会议记录，建议点击“示例数据”或导入Excel快速开始。','No records in this project. Click Sample or Import Excel to start quickly.')}</div></div>`;
  }
  dashboardCharts.forEach(c=>{try{c.destroy()}catch(e){}});
  dashboardCharts=[];
  if(typeof Chart==='undefined'){
    dash.innerHTML+=`<div class="chart-box"><h3>图表加载失败</h3><div class="no-data" style="padding:20px 12px">当前网络环境无法加载 Chart.js，KPI 与表格仍可正常使用。</div></div>`;
    return;
  }
  const legendFamily=uiLang==='zh'?'Microsoft YaHei':'JetBrains Mono';
  const cOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10,family:legendFamily},padding:10}}}};
  const dOpts={...cOpts,cutout:'60%'};
  const sCounts={OPEN:0,'IN PROGRESS':0,CLOSED:0,INFO:0};
  all.forEach(i=>{const s=statusLabel(i.status);if(sCounts[s]!=null)sCounts[s]++;else if(s==='INFO')sCounts.INFO++});
  const statusLabels=uiLang==='zh'?[t('开放','OPEN'),t('处理中','IN PROGRESS'),t('已关闭','CLOSED'),'INFO']:["OPEN","IN PROGRESS","CLOSED","INFO"];
  dashboardCharts.push(new Chart(document.getElementById('chartStatus'),{type:'doughnut',data:{labels:statusLabels,datasets:[{data:[sCounts.OPEN,sCounts['IN PROGRESS'],sCounts.CLOSED,sCounts.INFO],backgroundColor:['#f59e0b','#06b6d4','#10b981','#3b82f6'],borderWidth:0}]},options:dOpts}));
  const disc={};[...state.clarifications,...state.meetings].forEach(i=>{if(i.discipline){disc[i.discipline]=(disc[i.discipline]||0)+1}});
  const discLabels=Object.keys(disc).length?Object.keys(disc):[t('暂无数据','No data')];
  const discValues=Object.keys(disc).length?Object.values(disc):[1];
  const discColor=Object.keys(disc).length?'rgba(59,130,246,.6)':'rgba(100,116,139,.45)';
  dashboardCharts.push(new Chart(document.getElementById('chartDiscipline'),{type:'bar',data:{labels:discLabels,datasets:[{data:discValues,backgroundColor:discColor,borderRadius:4}]},options:{...cOpts,plugins:{...cOpts.plugins,legend:{display:false}},scales:{x:{ticks:{color:'#64748b',font:{size:9}},grid:{display:false}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(42,54,84,.4)'}}}}}));
  const ab={};all.forEach(i=>{if(i.actionBy){ab[i.actionBy]=(ab[i.actionBy]||0)+1}});
  const abLabels=Object.keys(ab).length?Object.keys(ab):[t('暂无数据','No data')];
  const abValues=Object.keys(ab).length?Object.values(ab):[1];
  const abColors=Object.keys(ab).length?['#3b82f6','#10b981','#f59e0b','#8b5cf6']:['#64748b'];
  dashboardCharts.push(new Chart(document.getElementById('chartActionBy'),{type:'doughnut',data:{labels:abLabels,datasets:[{data:abValues,backgroundColor:abColors,borderWidth:0}]},options:dOpts}));
  const pri={High:0,Medium:0,Low:0};state.clarifications.forEach(i=>{if(i.priority&&pri[i.priority]!=null)pri[i.priority]++});
  dashboardCharts.push(new Chart(document.getElementById('chartPriority'),{type:'doughnut',data:{labels:Object.keys(pri),datasets:[{data:Object.values(pri),backgroundColor:['#ef4444','#f59e0b','#10b981'],borderWidth:0}]},options:dOpts}));
  const trend=buildRecentTrend();
  dashboardCharts.push(new Chart(document.getElementById('chartTrend'),{
    type:'line',
    data:{
      labels:trend.labels,
      datasets:[
        {label:t('新增','Created'),data:trend.created,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.18)',tension:.3,fill:true},
        {label:t('关闭','Closed'),data:trend.closed,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.18)',tension:.3,fill:true}
      ]
    },
    options:{...cOpts,plugins:{...cOpts.plugins,legend:{position:'top',labels:{color:'#94a3b8',font:{size:10,family:legendFamily},padding:8}}},scales:{x:{ticks:{color:'#64748b',font:{size:9}},grid:{color:'rgba(42,54,84,.25)'}},y:{beginAtZero:true,precision:0,ticks:{color:'#64748b'},grid:{color:'rgba(42,54,84,.25)'}}}}
  }));
}
function buildRecentTrend(){
  const labels=[];
  const created=[];
  const closed=[];
  const all=[...state.clarifications,...state.meetings];
  for(let i=6;i>=0;i--){
    const d=new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-i);
    const key=d.toISOString().slice(0,10);
    labels.push(key.slice(5));
    created.push(all.filter(x=>String(x.createdAt||'').slice(0,10)===key).length);
    closed.push(all.filter(x=>normalizeStatus(x.status)==='CLOSED'&&String(x.completionDate||'').slice(0,10)===key).length);
  }
  return{labels,created,closed};
}
function buildOwnerWeekLoad(){
  const rows={};
  getAllOpenItems().forEach(i=>{
    const owner=i.actionBy||'UNASSIGNED';
    const wk=isoWeek(getDueDate(i));
    const key=`${owner}__${wk}`;
    rows[key]=rows[key]||{owner,week:wk,count:0};
    rows[key].count++;
  });
  return Object.values(rows).sort((a,b)=>b.count-a.count||a.owner.localeCompare(b.owner)||a.week.localeCompare(b.week));
}
function isDueInDays(item,days){
  const due=getDueDate(item);
  if(!due||normalizeStatus(item.status)==='CLOSED')return false;
  const now=new Date();
  now.setHours(0,0,0,0);
  const d=new Date(due);
  if(isNaN(d))return false;
  const diff=Math.floor((d-now)/86400000);
  return diff>=0&&diff<=days;
}
function buildOwnerRisk(){
  const map={};
  getAllOpenItems().forEach(i=>{
    const owner=i.actionBy||'UNASSIGNED';
    if(!map[owner])map[owner]={owner,open:0,overdue:0,high:0,score:0};
    map[owner].open++;
    if(isOverdue(i))map[owner].overdue++;
    if(String(i.priority||'').toUpperCase()==='HIGH')map[owner].high++;
  });
  const rows=Object.values(map);
  rows.forEach(r=>{r.score=r.open+r.overdue*2+r.high*2});
  return rows.sort((a,b)=>b.score-a.score||b.overdue-a.overdue||a.owner.localeCompare(b.owner));
}
function buildComboRiskRows(){
  const map={};
  getAllOpenItems().forEach(i=>{
    if(!isOverdue(i))return;
    if(String(i.priority||'').toUpperCase()!=='HIGH')return;
    const owner=i.actionBy||'UNASSIGNED';
    map[owner]=(map[owner]||0)+1;
  });
  return Object.keys(map).map(owner=>({owner,count:map[owner]})).sort((a,b)=>b.count-a.count||a.owner.localeCompare(b.owner));
}
function applyRiskPreset(owner){
  state.filters.search='';
  state.filters.status='';
  state.filters.actionBy=owner||'';
  state.filters.priority='High';
  state.filters.overdueOnly=true;
  switchTab('action');
}
function applyOwnerWeekPreset(owner,week){
  state.filters.search=week||'';
  state.filters.status='';
  state.filters.actionBy=owner||'';
  state.filters.priority='';
  state.filters.overdueOnly=false;
  switchTab('action');
}

function columnWidthKey(tableId,colIdx){return`${tableId}:${colIdx}`}

// ===== FILTER/SORT =====
function applyFilters(data){
  let r=data;const f=state.filters;
  if(f.search){const q=f.search.toLowerCase();r=r.filter(i=>JSON.stringify(i).toLowerCase().includes(q))}
  if(f.status)r=r.filter(i=>normalizeStatus(i.status)===normalizeStatus(f.status));
  if(f.discipline)r=r.filter(i=>(i.discipline||'')===f.discipline);
  if(f.priority)r=r.filter(i=>(i.priority||'')===f.priority);
  if(f.actionBy)r=r.filter(i=>(i.actionBy||'')===f.actionBy);
  if(f.overdueOnly)r=r.filter(isOverdue);
  if(f.duplicateOnly)r=r.filter(i=>duplicateIdSet.has(i.id));
  return r;
}
function sortData(data){
  if(!state.sort.field)return data;
  const f=state.sort.field,dir=state.sort.dir==='asc'?1:-1;
  return[...data].sort((a,b)=>{
    let va=f==='dueWeek'?isoWeek(getDueDate(a)):(a[f]||'');
    let vb=f==='dueWeek'?isoWeek(getDueDate(b)):(b[f]||'');
    if(f==='meetingDate'){va=a.meetingDate||'';vb=b.meetingDate||''}
    if(f==='status'){va=normalizeStatus(va);vb=normalizeStatus(vb)}
    if(typeof va==='string')va=va.toLowerCase();if(typeof vb==='string')vb=vb.toLowerCase();
    return va<vb?-dir:va>vb?dir:0;
  })
}
function toggleSort(field){if(state.sort.field===field)state.sort.dir=state.sort.dir==='asc'?'desc':'asc';else{state.sort.field=field;state.sort.dir='asc'}renderCurrentView()}
function thSort(f,zhLabel,enLabel){const label=uiLang==='en'?enLabel:zhLabel;return`<th class="${state.sort.field===f?'sorted':''}" onclick="toggleSort('${f}')">${label}<span class="sort-icon">${state.sort.field===f?(state.sort.dir==='asc'?'▲':'▼'):'⇅'}</span></th>`}
function applyColumnWidth(table,colIdx,width){
  const w=Math.max(56,Math.round(width||0));
  table.querySelectorAll('tr').forEach(tr=>{
    const cell=tr.children[colIdx];
    if(cell){
      cell.style.width=w+'px';
      cell.style.minWidth=w+'px';
      cell.style.maxWidth='none';
    }
  });
}
function initColumnResize(tableId){
  const table=document.getElementById(tableId);
  if(!table||!table.tHead||!table.tHead.rows.length)return;
  const headers=[...table.tHead.rows[0].cells];
  headers.forEach((th,idx)=>{
    const saved=columnWidthMap[columnWidthKey(tableId,idx)];
    if(saved)applyColumnWidth(table,idx,saved);
    if(th.classList.contains('action-col')||th.querySelector('input.cb'))return;
    if(th.querySelector('.col-resizer'))return;
    const handle=document.createElement('span');
    handle.className='col-resizer';
    handle.title='拖拽调整列宽';
    handle.addEventListener('mousedown',e=>{
      e.preventDefault();
      e.stopPropagation();
      const startX=e.clientX;
      const startWidth=(th.getBoundingClientRect().width||th.offsetWidth||80);
      const onMove=ev=>applyColumnWidth(table,idx,startWidth+(ev.clientX-startX));
      const onUp=()=>{
        const finalWidth=(th.getBoundingClientRect().width||th.offsetWidth||80);
        columnWidthMap[columnWidthKey(tableId,idx)]=Math.max(56,Math.round(finalWidth));
        save();
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
      };
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    });
    th.appendChild(handle);
  });
}
function resetTableColumnWidths(tableId){
  Object.keys(columnWidthMap).forEach(k=>{if(k.startsWith(tableId+':'))delete columnWidthMap[k]});
  save();
  renderCurrentView();
  toast(t('已重置本表列宽','Column widths reset for this table'),'info');
}

// ===== TOOLBAR =====
function renderToolbar(type,opts){
  const sOpts=opts.statuses||STATUS_STD;const showD=opts.showDiscipline!==false;const showP=opts.showPriority||false;
  const subjectBox=opts.subjectSearch?`<div class="search-box search-box-subject">${IC.search}<input type="text" placeholder="${t('按会议主题筛选...','Filter by subject...')}" value="${escHtml(state.meetingSubjectFilter)}" oninput="handleMeetingSubjectInput(this.value)"></div>`:'';
  return`<div class="toolbar">
    <div class="search-box">${IC.search}<input type="text" placeholder="${t('搜索...','Search...')}" value="${escHtml(state.filters.search)}" oninput="handleSearchInput(this.value,'${type}')"></div>
    ${subjectBox}
    <select class="filter-select" onchange="state.filters.status=this.value;renderCurrentView()"><option value="">${t('全部状态','All Status')}</option>${sOpts.map(s=>`<option value="${s}"${state.filters.status===s?' selected':''}>${s}</option>`).join('')}</select>
    ${showD?`<select class="filter-select" onchange="state.filters.discipline=this.value;renderCurrentView()"><option value="">${t('全部专业','All Discipline')}</option>${disciplineOptions.map(d=>`<option value="${d}"${state.filters.discipline===d?' selected':''}>${d}</option>`).join('')}</select>`:''}
    ${showP?`<select class="filter-select" onchange="state.filters.priority=this.value;renderCurrentView()"><option value="">${t('优先级全部','All Priority')}</option>${PRIORITIES.map(p=>`<option value="${p}"${state.filters.priority===p?' selected':''}>${p}</option>`).join('')}</select>`:''}
    <select class="filter-select" onchange="state.filters.actionBy=this.value;renderCurrentView()"><option value="">${t('责任方全部','All Action By')}</option>${actionByOptions.map(a=>`<option value="${a}"${state.filters.actionBy===a?' selected':''}>${a}</option>`).join('')}</select>
    <button class="btn ${state.filters.overdueOnly?'btn-danger':'btn-outline'}" onclick="state.filters.overdueOnly=!state.filters.overdueOnly;renderCurrentView()">${t('逾期项','Overdue')}</button>
    ${type==='clarification'?`<button class="btn ${state.filters.duplicateOnly?'btn-danger':'btn-outline'}" onclick="state.filters.duplicateOnly=!state.filters.duplicateOnly;renderCurrentView()">${t('疑似重复','Possible Duplicate')}</button>`:''}
    <button class="btn btn-primary" onclick="addNewRow('${type}')">${IC.plus} ${t('新增','New')}</button>
  </div>`;
}
function handleSearchInput(value,type){
  state.filters.search=value;
  const tableId=type==='clarification'?'clarificationTable':type==='meeting'?'meetingTable':type==='action'?'actionTable':'recycleTable';
  const table=document.getElementById(tableId);
  if(!table){renderCurrentView();return}
  table.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.classList.contains('no-data-row'))return;
    tr.style.display=tr.textContent.toLowerCase().includes(String(value||'').toLowerCase())?'':'none';
  });
}
function handleMeetingSubjectInput(value){
  state.meetingSubjectFilter=value;
  const table=document.getElementById('meetingTable');
  if(!table)return;
  table.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.classList.contains('no-data-row'))return;
    tr.style.display=tr.textContent.toLowerCase().includes(String(value||'').toLowerCase())?'':'none';
  });
}

// ===== BATCH =====
function renderBatchBar(type){
  const n=state.selected.size;
  const dueField=type==='clarification'?'currentDueDate':type==='meeting'?'plannedDate':'needDate';
  const dueLabel=type==='meeting'?t('计划日期','Planned Date'):t('到期日期','Due Date');
  const showPriority=type==='clarification'||type==='meeting';
  return`<div class="batch-bar${n?' visible':''}"><span>${t('已选','Selected')} <span class="count">${n}</span> ${t('项','items')}</span>
  <select class="filter-select" id="batchStatus"><option value="">${t('批量状态...','Batch status...')}</option>${STATUS_STD.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
  <select class="filter-select" id="batchActionBy"><option value="">${t('批量责任方...','Batch owner...')}</option>${actionByOptions.map(a=>`<option value="${a}">${a}</option>`).join('')}</select>
  ${showPriority?`<select class="filter-select" id="batchPriority"><option value="">${t('批量优先级...','Batch priority...')}</option>${PRIORITIES.map(p=>`<option value="${p}">${p}</option>`).join('')}</select>`:''}
  <input type="date" class="inline-date" id="batchDueDate" data-field="${dueField}" title="${dueLabel}">
  <button class="btn btn-outline" onclick="batchUpdate('${type}')">${t('应用','Apply')}</button>
  <button class="btn btn-danger" onclick="batchDelete('${type}')">${t('删除','Delete')}</button></div>`
}
async function batchUpdate(type){
  const s=normalizeStatus(document.getElementById('batchStatus').value||'');
  const owner=(document.getElementById('batchActionBy')||{}).value||'';
  const dueVal=(document.getElementById('batchDueDate')||{}).value||'';
  const pEl=document.getElementById('batchPriority');
  const priority=pEl?pEl.value:'';
  if(!s&&!owner&&!dueVal&&!priority){toast(t('请至少选择一个批量字段','Select at least one batch field'),'error');return}
  const arr=type==='clarification'?state.clarifications:type==='action'?state.actions:state.meetings;
  const dueField=type==='clarification'?'currentDueDate':type==='meeting'?'plannedDate':'needDate';
  let c=0,blocked=0;
  let statusCh=0,ownerCh=0,dueCh=0,priCh=0;
  arr.forEach(i=>{
    if(!state.selected.has(i.id))return;
    if(s&&normalizeStatus(i.status)!==s)statusCh++;
    if(owner&&String(i.actionBy||'')!==owner)ownerCh++;
    if(dueVal&&String(i[dueField]||'')!==dueVal)dueCh++;
    if(priority&&String(i.priority||'')!==priority)priCh++;
  });
  const preview=[
    `${t('状态','Status')}: ${statusCh}`,
    `${t('责任方','Owner')}: ${ownerCh}`,
    `${t('日期','Date')}: ${dueCh}`,
    `${t('优先级','Priority')}: ${priCh}`
  ].join(' | ');
  if(!confirm(`${t('批量变更预览','Batch change preview')}\n${preview}`))return;
  if(backendMode){
    try{
      const ids=[...state.selected];
      const updates={};
      if(s){
        updates.status=s;
        updates.completionDate=s==='CLOSED'?fmtDate(new Date()):'';
      }
      if(owner)updates.actionBy=owner;
      if(dueVal)updates[dueField]=dueVal;
      if(priority)updates.priority=priority;
      const sourceType=type==='meeting'?'meeting':type==='action'?'action':'clarification';
      await apiRequest('/api/ops/batch-update',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({projectId:activeProjectId,sourceType,ids,updates})
      });
      await pullBackendState(activeProjectId);
      refreshDuplicateSet();
      state.selected.clear();
      renderNav();
      renderCurrentView();
      toast(t('批量更新已提交','Batch update committed'));
      return;
    }catch(e){
      toast(t('批量更新失败','Batch update failed'),'error');
      return;
    }
  }
  arr.forEach(i=>{
    if(state.selected.has(i.id)){
      const old=JSON.parse(JSON.stringify(i));
      if(s&&normalizeStatus(i.status)!==s){
        const before=i.status;
        i.status=s;
        if(s==='CLOSED')i.completionDate=fmtDate(new Date());
        if(s!=='CLOSED')i.completionDate='';
        updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(before),to:statusLabel(s)});
      }
      if(owner&&String(i.actionBy||'')!==owner){
        updateMeta(i,{type:'EDIT',field:'actionBy',from:i.actionBy||'',to:owner});
        i.actionBy=owner;
      }
      if(dueVal&&String(i[dueField]||'')!==dueVal){
        updateMeta(i,{type:'EDIT',field:dueField,from:i[dueField]||'',to:dueVal});
        i[dueField]=dueVal;
      }
      if(priority&&i.priority!==undefined&&String(i.priority||'')!==priority){
        updateMeta(i,{type:'EDIT',field:'priority',from:i.priority||'',to:priority});
        i.priority=priority;
      }
      const errs=validateDateRules(type,i);
      if(errs.length){
        Object.keys(i).forEach(k=>delete i[k]);
        Object.assign(i,old);
        blocked++;
        return;
      }
      c++;
    }
  });
  refreshDuplicateSet();
  state.selected.clear();save();renderNav();renderCurrentView();
  const msg=blocked?`${t('已更新','Updated')} ${c} ${t('项，阻断','items, blocked')} ${blocked} ${t('项（日期校验）','items (date validation)')}`:t(`已更新 ${c} 项`,`Updated ${c} items`);
  toast(msg)
}
function batchDelete(type){
  const ids=[...state.selected];
  if(backendMode){
    const sourceType=type==='meeting'?'meeting':type==='action'?'action':'clarification';
    apiRequest('/api/ops/batch-delete',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({projectId:activeProjectId,sourceType,ids})
    }).then(async()=>{
      await pullBackendState(activeProjectId);
      state.selected.clear();
      refreshDuplicateSet();
      renderNav();
      renderCurrentView();
      toast(t(`已移入回收站 ${ids.length} 项`,`Moved ${ids.length} items to recycle`));
    }).catch(()=>toast(t('批量删除失败','Batch delete failed'),'error'));
    return;
  }
  ids.forEach(id=>moveToTrash(type,id,true));
  state.selected.clear();
  refreshDuplicateSet();
  save();renderNav();renderCurrentView();toast(t(`已移入回收站 ${ids.length} 项`,`Moved ${ids.length} items to recycle`));
}
function toggleSelect(id){if(state.selected.has(id))state.selected.delete(id);else state.selected.add(id);renderCurrentView()}
function toggleSelectAll(ids){const allSel=ids.every(id=>state.selected.has(id));ids.forEach(id=>{if(allSel)state.selected.delete(id);else state.selected.add(id)});renderCurrentView()}

// ===== QUICK CLOSE =====
function quickClose(type,id){
  const arr=type==='clarification'?state.clarifications:type==='action'?state.actions:state.meetings;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const before=item.status;
  item.status='CLOSED';
  item.completionDate=fmtDate(new Date());
  updateMeta(item,{type:'STATUS_CHANGE',field:'status',from:statusLabel(before),to:'CLOSED'});
  save();renderNav();renderCurrentView();toast(t('已关闭','Closed'));
}
function quickSetStatus(type,id,nextStatus){
  const arr=type==='clarification'?state.clarifications:type==='meeting'?state.meetings:state.actions;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const after=normalizeStatus(nextStatus);
  const before=normalizeStatus(item.status);
  if(before===after)return;
  item.status=after;
  if(after==='CLOSED'&&!item.completionDate)item.completionDate=fmtDate(new Date());
  if(after!=='CLOSED')item.completionDate='';
  updateMeta(item,{type:'STATUS_CHANGE',field:'status',from:statusLabel(before),to:statusLabel(after)});
  save();renderNav();renderCurrentView();
}

// ===== INLINE EDIT =====
function startEdit(type,id){state.editingId=id;renderCurrentView()}
function cancelEdit(){state.editingId=null;renderCurrentView()}
function saveEdit(type,id){
  const arr=type==='clarification'?state.clarifications:type==='action'?state.actions:state.meetings;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const prev={status:item.status,reply:item.reply};
  const row=document.querySelector(`tr[data-id="${id}"]`);if(!row)return;
  row.querySelectorAll('[data-field]').forEach(el=>{
    const f=el.dataset.field;
    if(el.tagName==='SELECT')item[f]=el.value;
    else if(el.tagName==='INPUT')item[f]=el.value;
    else item[f]=(el.textContent||'').trim();
  });
  item.status=normalizeStatus(item.status);
  const v=validateRequired(type,item);
  if(!v.ok){toast(t(`缺少必填: ${v.missing.join(', ')}`,`Missing required fields: ${v.missing.join(', ')}`),'error');return}
  const dateErrs=validateDateRules(type,item);
  if(dateErrs.length){toast(dateErrs.join('; '),'error');return}
  if(normalizeStatus(item.status)==='CLOSED'&&!item.completionDate){
    item.completionDate=fmtDate(new Date());
  }
  if(prev.status!==item.status)updateMeta(item,{type:'STATUS_CHANGE',field:'status',from:statusLabel(prev.status),to:statusLabel(item.status)});
  if((prev.reply||'')!==(item.reply||''))updateMeta(item,{type:'REPLY_CHANGE',field:'reply',from:'(edited)',to:'(edited)'});
  updateMeta(item,{type:'EDIT'});
  refreshDuplicateSet();
  state.editingId=null;save();renderNav();renderCurrentView();toast(t('已保存','Saved'));
}
function addNewRow(type){
  const obj={id:uid()};
  if(type==='clarification'){obj.actionId=''+(state.clarifications.length+1);obj.priority='Medium';obj.discipline='';obj.type='';obj.clarification='';obj.reply='';obj.actionBy=actionByOptions[0]||'WISON';obj.openDate=fmtDate(new Date());obj.currentDueDate='';obj.status='OPEN';obj.createdAt=nowIso();obj.updatedAt=obj.createdAt;obj.updatedBy=operatorName;obj.history=[{at:obj.createdAt,by:operatorName,type:'CREATE',field:'',from:'',to:''}];state.clarifications.unshift(obj)}
  else if(type==='action'){obj.no=''+(state.actions.length+1);obj.status='OPEN';obj.action='';obj.project='';obj.dateIdentified=fmtDate(new Date());obj.needDate='';obj.actionBy=actionByOptions[0]||'WISON';obj.remarks='';state.actions.unshift(obj)}
  else{obj.no=''+(state.meetings.length+1);obj.subject='';obj.priority='Medium';obj.discipline='';obj.clarification='';obj.reply='';obj.actionBy=actionByOptions[0]||'WISON';obj.meetingDate=fmtDate(new Date());obj.plannedDate=fmtDate(new Date());obj.status='OPEN';obj.createdAt=nowIso();obj.updatedAt=obj.createdAt;obj.updatedBy=operatorName;obj.history=[{at:obj.createdAt,by:operatorName,type:'CREATE',field:'',from:'',to:''}];state.meetings.unshift(obj)}
  if(type==='clarification'){obj.source=sourceOptions[0]||'Email'}
  state.editingId=obj.id;save();renderNav();renderCurrentView();
}
function deleteItem(type,id){moveToTrash(type,id)}

// ===== INLINE CELL RENDERERS =====
function inText(item,field,isEditing,maxW){
  if(isEditing)return`<div class="inline-cell" contenteditable="true" data-field="${field}" style="max-width:${maxW||280}px">${escHtml(item[field]||'')}</div>`;
  return`<div class="cell-text" onclick="this.classList.toggle('expanded')">${escHtml(item[field]||'')}</div>`;
}
function inSelect(item,field,options,isEditing){
  if(isEditing)return`<select class="inline-select" data-field="${field}">${options.map(o=>`<option value="${o}"${item[field]===o?' selected':''}>${o}</option>`).join('')}</select>`;
  return escHtml(item[field]||'—');
}
function inManagedSelect(item,field,options,isEditing,kind,type){
  if(!isEditing)return escHtml(item[field]||'—');
  return`<select class="inline-select" data-field="${field}" onchange="manageInlineOption(this,'${kind}','${type}','${item.id}','${field}')">${options.map(o=>`<option value="${o}"${item[field]===o?' selected':''}>${o||'—'}</option>`).join('')}<option value="__add__">+ 新增选项</option><option value="__delete__">- 删除选项</option></select>`;
}
function inDate(item,field,isEditing){
  if(isEditing)return`<input type="date" class="inline-date" data-field="${field}" value="${item[field]||''}">`;
  return`<span class="cell-date">${fmtDate(item[field])}</span>`;
}
function inInput(item,field,isEditing,w){
  if(isEditing)return`<div class="inline-cell" contenteditable="true" data-field="${field}" style="min-width:${w||50}px">${escHtml(item[field]||'')}</div>`;
  return escHtml(item[field]||'—');
}
function actionBtns(type,item,isEditing){
  if(isEditing)return`<div class="edit-save-bar"><button class="save-btn" onclick="saveEdit('${type}','${item.id}')">${IC.check} 保存</button><button class="cancel-btn" onclick="cancelEdit()">取消</button></div>`;
  return`<div class="row-actions"><button class="row-action-btn" onclick="startEdit('${type}','${item.id}')" title="编辑">${IC.edit}</button><button class="row-action-btn delete" onclick="deleteItem('${type}','${item.id}')" title="删除">${IC.trash}</button></div>`;
}
function startActionReplyEdit(id){state.actionReplyEditId=id;renderActions()}
function cancelActionReplyEdit(){state.actionReplyEditId='';renderActions()}
function saveActionReplyEdit(id,source){
  const isClar=source==='clarification'||source==='澄清'||source==='Clarification';
  const arr=isClar?state.clarifications:state.meetings;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const el=document.getElementById(`replyEdit_${id}`);if(!el)return;
  const before=item.reply||'';
  item.reply=el.value.trim();
  if(before!==item.reply)updateMeta(item,{type:'REPLY_CHANGE',field:'reply',from:'(edited)',to:'(edited)'});
  state.actionReplyEditId='';
  save();renderActions();toast(t('回复已更新','Reply updated'));
}
function renderActionReplyCell(item,sourceType){
  const isClar=sourceType==='clarification'||sourceType==='澄清'||sourceType==='Clarification';
  const st=isClar?'clarification':'meeting';
  return `<div style="display:flex;gap:4px;align-items:center"><input id="replyEdit_${item.id}" value="${escHtml(item.reply||'')}" style="padding:4px 6px;border-radius:4px;border:1px solid var(--accent);background:var(--bg-deep);color:var(--text-primary);font-size:.74rem;width:170px"><button class="btn btn-green" style="padding:3px 8px;font-size:.7rem" onclick="saveActionReplyEdit('${item.id}','${sourceType}')">${t('保存','Save')}</button></div><div style="margin-top:4px">${renderFieldWithAttachments(item,'reply',st,false)}</div>`;
}
function showHistory(type,id){
  const arr=type==='clarification'?state.clarifications:type==='meeting'?state.meetings:state.actions;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const logs=(item.history||[]).slice(-12).map(h=>`${fmtDate(h.at)} ${h.by||''} ${h.type||'EDIT'} ${h.field?`[${h.field}]`:''} ${h.from?`${h.from} ->`:''} ${h.to||''}`).join('\n');
  alert(logs||t('暂无历史记录','No history available'));
}

function quickCloseFocused(){
  if(!focusedRowRef.id){toast(t('请先选择一行','Select a row first'),'error');return}
  if(state.currentTab==='action'){
    quickCloseFromAction(focusedRowRef.id,focusedRowRef.sourceType||'clarification');
    return;
  }
  if(state.currentTab==='clarification'||state.currentTab==='meeting'){
    quickClose(state.currentTab,focusedRowRef.id);
    return;
  }
  toast(t('当前看板不支持快速关闭','Quick close is not available in this view'),'error');
}
function registerGlobalHotkeys(){
  document.addEventListener('click',e=>{
    const row=e.target&&e.target.closest?e.target.closest('tr[data-id]'):null;
    if(!row)return;
    focusedRowRef.id=row.getAttribute('data-id')||'';
    focusedRowRef.sourceType=row.getAttribute('data-source')||'';
  });
  document.addEventListener('keydown',e=>{
    const key=(e.key||'').toLowerCase();
    if(e.altKey&&!e.ctrlKey&&!e.shiftKey){
      const map={1:'dashboard',2:'action',3:'clarification',4:'meeting',5:'pdfcomments',6:'recycle'};
      if(map[key]){e.preventDefault();switchTab(map[key]);return}
    }
    if(e.ctrlKey&&key==='n'){
      if(state.currentTab==='clarification'||state.currentTab==='meeting'){e.preventDefault();addNewRow(state.currentTab)}
      return;
    }
    if(e.ctrlKey&&key==='s'){
      if(state.editingId&&(state.currentTab==='clarification'||state.currentTab==='meeting')){e.preventDefault();saveEdit(state.currentTab,state.editingId)}
      return;
    }
    if(e.ctrlKey&&e.shiftKey&&key==='x'){
      e.preventDefault();
      quickCloseFocused();
    }
  });
}

async function bootstrapApp(){
  backendMode=await detectBackendMode();
  const webMode=isWebModeRequested();
  if(!backendMode&&!webMode){
    renderBackendRequiredScreen();
    return;
  }
  await pullBackendMeta();
  ensureDefaultProject();
  load();
  await pullBackendState(activeProjectId);
  await pushBackendMeta();
  applyTheme();
  applyLanguageClass();
  document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);
  renderAll();
  maybeShowFirstUseIntro();
  registerGlobalHotkeys();
  if(backendMode){
    registerBackendLifecycleHooks();
    await registerBackendClient();
    toast(t('已启用强制后端数据库模式','Forced backend DB mode enabled'),'info');
  }else{
    toast(t('已进入网页本地模式（适合Vercel演示）','Web local mode enabled (good for Vercel demo)'),'info');
  }
}

