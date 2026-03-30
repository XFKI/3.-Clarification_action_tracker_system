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
};

// ===== CONSTANTS =====
const DISCIPLINES_DEFAULT=['Process','Electrical','Instrument','Piping','Mechanical','Structural','HVAC'];
const PRIORITIES=['High','Medium','Low'];
const CL_TYPES_DEFAULT=['DCP','PID','Datasheet','Spec','Drawing','General'];
const STATUS_STD=['OPEN','IN_PROGRESS','CLOSED'];
const ACTION_BY=['WISON','BH','Owner'];
const REQUIRED_FIELDS={
  clarification:['actionId','clarification','actionBy','openDate','status'],
  meeting:['no','subject','clarification','actionBy','plannedDate','status']
};

// ===== STATE =====
let projects=JSON.parse(localStorage.getItem('et_projects'))||[];
let activeProjectId=localStorage.getItem('et_active_project')||'';
let operatorName=localStorage.getItem('et_operator')||'ME';
let sidebarCollapsed=localStorage.getItem('et_sidebar_collapsed')==='1';
let state={currentTab:'dashboard',clarifications:[],actions:[],meetings:[],trash:[],selected:new Set(),sort:{field:null,dir:'asc'},filters:{search:'',status:'',discipline:'',priority:'',actionBy:'',overdueOnly:false,duplicateOnly:false},editingId:null,meetingDateFilter:'',meetingSubjectFilter:'',actionReplyEditId:''};
let duplicateIdSet=new Set();
let disciplineOptions=[...DISCIPLINES_DEFAULT];
let typeOptions=[...CL_TYPES_DEFAULT];
let pendingAttachmentTarget=null;

function ensureDefaultProject(){
  if(!projects.length){projects.push({id:'default',name:'GENTING FLNG F450'});activeProjectId='default';saveProjects()}
  if(!activeProjectId||!projects.find(p=>p.id===activeProjectId)){activeProjectId=projects[0].id;saveProjects()}
}
function saveProjects(){localStorage.setItem('et_projects',JSON.stringify(projects));localStorage.setItem('et_active_project',activeProjectId)}
function projKey(suffix){return`et_${activeProjectId}_${suffix}`}
function save(){
  localStorage.setItem(projKey('cl'),JSON.stringify(state.clarifications));
  localStorage.setItem(projKey('act'),JSON.stringify(state.actions));
  localStorage.setItem(projKey('mt'),JSON.stringify(state.meetings));
  localStorage.setItem(projKey('trash'),JSON.stringify(state.trash));
  localStorage.setItem(projKey('disc_opts'),JSON.stringify(disciplineOptions));
  localStorage.setItem(projKey('type_opts'),JSON.stringify(typeOptions));
}
function load(){
  try{
    state.clarifications=JSON.parse(localStorage.getItem(projKey('cl')))||[];
    state.actions=JSON.parse(localStorage.getItem(projKey('act')))||[];
    state.meetings=JSON.parse(localStorage.getItem(projKey('mt')))||[];
    state.trash=JSON.parse(localStorage.getItem(projKey('trash')))||[];
    disciplineOptions=JSON.parse(localStorage.getItem(projKey('disc_opts')))||[...DISCIPLINES_DEFAULT];
    typeOptions=JSON.parse(localStorage.getItem(projKey('type_opts')))||[...CL_TYPES_DEFAULT];
  }catch(e){
    state.clarifications=[];state.actions=[];state.meetings=[];state.trash=[];
    disciplineOptions=[...DISCIPLINES_DEFAULT];
    typeOptions=[...CL_TYPES_DEFAULT];
  }
  migrateData();
  rebuildCategoryOptions();
  refreshDuplicateSet();
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function fmtDate(d){if(!d)return'—';const dt=new Date(d);return isNaN(dt)?'—':dt.toISOString().slice(0,10)}
function nowIso(){return new Date().toISOString()}
function normalizeStatus(raw){
  const s=String(raw||'OPEN').trim().toUpperCase().replace(/[-\s]+/g,'_');
  if(s==='CLOSE'||s==='CLOSED')return'CLOSED';
  if(s==='IN_PROGRESS')return'IN_PROGRESS';
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
  state.meetings.forEach(i=>ensureOption(d,i.discipline));
  state.trash.forEach(x=>{ensureOption(d,x.item?.discipline);ensureOption(t,x.item?.type)});
  disciplineOptions=[...new Set([...(disciplineOptions||[]),...d])];
  typeOptions=[...new Set([...(typeOptions||[]),...t])];
}
function addCategory(kind){
  const name=prompt(kind==='discipline'?'输入新专业类别':'输入新意见类型');
  if(!name)return;
  if(kind==='discipline')ensureOption(disciplineOptions,name); else ensureOption(typeOptions,name);
  save();renderCurrentView();toast('类别已添加');
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
function isOverdue(item){const due=getDueDate(item);if(!due)return false;const s=normalizeStatus(item.status);if(s==='CLOSED')return false;return new Date(due)<new Date()}
function toast(msg,type='success'){const el=document.createElement('div');el.className='toast toast-'+type;el.textContent=msg;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>el.remove(),3000)}
function escHtml(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function escJs(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ')}
function getFieldAttachments(item,fieldKey){
  const map=item.fieldAttachments||{};
  return Array.isArray(map[fieldKey])?map[fieldKey]:[];
}
function isImageAttachment(att){return String(att.type||'').startsWith('image/')}
function openImagePreview(src,name){
  const modal=document.getElementById('modal');
  modal.innerHTML=`<div class="modal-content" style="max-width:960px"><div class="modal-header"><h2>${escHtml(name||'图片预览')}</h2><button class="modal-close" onclick="closeModalPreview()">✕</button></div><div class="modal-body" style="text-align:center"><img class="preview-image" src="${src}" alt="preview"></div></div>`;
  modal.classList.add('open');
}
function openImagePreviewFromEl(el){openImagePreview(el.dataset.src||'',el.dataset.name||'图片预览')}
function closeModalPreview(){const modal=document.getElementById('modal');modal.classList.remove('open');modal.innerHTML=''}
function renderAttachmentThumb(att){
  if(isImageAttachment(att))return `<button style="border:none;background:transparent;padding:0;cursor:pointer" data-src="${escHtml(att.data)}" data-name="${escHtml(att.name)}" onclick="openImagePreviewFromEl(this)" title="预览 ${escHtml(att.name)}"><img src="${att.data}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"></button>`;
  return `<a href="${att.data}" download="${escHtml(att.name)}" title="${escHtml(att.name)}" style="font-size:.66rem;padding:2px 6px;border:1px solid var(--border);border-radius:4px;color:var(--text-secondary)">FILE</a>`;
}
function renderFieldWithAttachments(item,fieldKey,sourceType,isEditing,maxW){
  const text=isEditing
    ? `<div class="inline-cell" contenteditable="true" data-field="${fieldKey}" style="max-width:${maxW||280}px" onpaste="handleAttachmentPaste(event,'${sourceType}','${item.id}','${fieldKey}')">${escHtml(item[fieldKey]||'')}</div>`
    : `<div class="cell-text" onclick="this.classList.toggle('expanded')">${escHtml(item[fieldKey]||'')}</div>`;
  const list=getFieldAttachments(item,fieldKey);
  const thumbs=list.slice(0,3).map(renderAttachmentThumb).join('');
  return `${text}<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap"><button class="btn btn-outline" style="padding:2px 8px;font-size:.7rem" onclick="openAttachmentPicker('${sourceType}','${item.id}','${fieldKey}')">+附件</button><span class="cell-date">${list.length}</span>${thumbs}</div>`;
}
function openAttachmentPicker(sourceType,id,fieldKey){pendingAttachmentTarget={sourceType,id,fieldKey};document.getElementById('attachmentInput').click()}
function findCollectionByType(type){return type==='clarification'?state.clarifications:type==='meeting'?state.meetings:state.actions}
function attachToItem(sourceType,id,fieldKey,file,rerender){
  const shouldRerender=rerender!==false;
  const arr=findCollectionByType(sourceType);
  const item=arr.find(i=>i.id===id);if(!item)return;
  const reader=new FileReader();
  reader.onload=e=>{
    item.fieldAttachments=item.fieldAttachments||{};
    item.fieldAttachments[fieldKey]=item.fieldAttachments[fieldKey]||[];
    item.fieldAttachments[fieldKey].push({name:file.name,type:file.type||'application/octet-stream',size:file.size,data:e.target.result});
    updateMeta(item,{type:'ATTACH_ADD',field:fieldKey,from:'',to:file.name});
    save();
    if(shouldRerender)renderCurrentView();
    toast('附件已添加');
  };
  reader.readAsDataURL(file);
}
function handleAttachmentPaste(event,sourceType,id,fieldKey){
  const items=(event.clipboardData&&event.clipboardData.items)||[];
  for(let i=0;i<items.length;i++){
    const it=items[i];
    if(it.kind==='file'&&String(it.type||'').startsWith('image/')){
      const file=it.getAsFile();
      if(file){
        const fname=`pasted_${Date.now()}.png`;
        const imgFile=new File([file],fname,{type:file.type||'image/png'});
        attachToItem(sourceType,id,fieldKey,imgFile,false);
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
  if(!silent){save();renderNav();renderCurrentView();toast('已移至回收站');}
}
function restoreFromTrash(trashId,silent){
  const idx=state.trash.findIndex(t=>t.trashId===trashId);if(idx<0)return;
  const tr=state.trash[idx];state.trash.splice(idx,1);
  const arr=findCollectionByType(tr.sourceType);
  arr.unshift(tr.item);
  rebuildCategoryOptions();
  refreshDuplicateSet();
  if(!silent){save();renderNav();renderCurrentView();toast('已恢复');}
}
function emptyTrash(){state.trash=[];save();renderNav();renderCurrentView();toast('回收站已清空')}
function getAllOpenItems(){
  const cl=state.clarifications.filter(i=>{const s=normalizeStatus(i.status);return s==='OPEN'||s==='IN_PROGRESS'});
  const mt=state.meetings.filter(i=>{const s=normalizeStatus(i.status);return s==='OPEN'||s==='IN_PROGRESS'});
  return[...cl.map(i=>({...i,_source:'澄清'})),...mt.map(i=>({...i,_source:'会议'}))];
}

// ===== SIDEBAR =====
function renderSidebar(){
  const sb=document.getElementById('sidebar');
  sb.innerHTML=`
  <div class="sb-logo"><div class="sb-logo-mark">ET</div><div class="sb-logo-text">Eng Tracker<small>设备采购追踪系统</small></div></div>
  <div class="sb-section">
    <div class="sb-section-title">项目目录 Projects</div>
    <ul class="sb-proj-list">${projects.map(p=>`<li class="sb-proj-item${p.id===activeProjectId?' active':''}" onclick="switchProject('${p.id}')"><span>${escHtml(p.name)}</span>${projects.length>1?`<button class="proj-del" onclick="event.stopPropagation();deleteProject('${p.id}')" title="删除">✕</button>`:''}</li>`).join('')}</ul>
    <div class="sb-add-proj"><input id="newProjInput" placeholder="新增项目名..." onkeydown="if(event.key==='Enter')addProject()"><button onclick="addProject()">添加</button></div>
  </div>`;
}
function switchProject(id){activeProjectId=id;saveProjects();load();state.selected.clear();state.editingId=null;state.meetingDateFilter='';state.meetingSubjectFilter='';state.actionReplyEditId='';renderAll()}
function addProject(){const inp=document.getElementById('newProjInput');const n=inp.value.trim();if(!n){toast('请输入项目名','error');return}projects.push({id:uid(),name:n});saveProjects();inp.value='';renderSidebar()}
function deleteProject(id){if(!confirm('确认删除此项目及所有数据？'))return;['cl','act','mt'].forEach(k=>localStorage.removeItem(`et_${id}_${k}`));projects=projects.filter(p=>p.id!==id);if(activeProjectId===id)activeProjectId=projects[0]?.id||'';saveProjects();ensureDefaultProject();load();renderAll()}

// ===== HEADER =====
function renderHeader(){
  const pName=projects.find(p=>p.id===activeProjectId)?.name||'';
  document.getElementById('mainHeader').innerHTML=`
  <div style="font-size:1.15rem;font-weight:700;letter-spacing:.4px">${escHtml(pName)}</div>
  <div class="header-right">
    <button class="hdr-btn" onclick="toggleSidebar()">目录</button>
    <input id="operatorInput" value="${escHtml(operatorName)}" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-deep);color:var(--text-primary);font-size:.75rem;width:110px" placeholder="操作人" onchange="setOperator(this.value)">
    <button class="hdr-btn" onclick="importSampleData()">${IC.db} 示例数据</button>
    <button class="hdr-btn" onclick="document.getElementById('xlsxFileInput').click()">${IC.upload} 导入Excel</button>
    <button class="hdr-btn" onclick="exportXlsx()">${IC.download} 导出Excel</button>
  </div>`;
}
function setOperator(v){operatorName=(v||'ME').trim()||'ME';localStorage.setItem('et_operator',operatorName);toast(`操作人已设为 ${operatorName}`,'info')}
function toggleSidebar(){
  sidebarCollapsed=!sidebarCollapsed;
  localStorage.setItem('et_sidebar_collapsed',sidebarCollapsed?'1':'0');
  document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);
}

// ===== NAV (行动项 moved before 技术澄清) =====
function renderNav(){
  const openAll=getAllOpenItems().length;
  const tabs=[
    {id:'dashboard',label:'仪表盘 Dashboard'},
    {id:'action',label:'行动项 Actions',count:openAll,warn:true},
    {id:'clarification',label:'技术澄清 Clarifications',count:state.clarifications.length},
    {id:'meeting',label:'会议纪要 Meetings',count:state.meetings.length},
    {id:'recycle',label:'回收站 Recycle',count:state.trash.length},
  ];
  document.getElementById('mainNav').innerHTML=tabs.map(t=>{
    const badgeCls=t.warn&&t.count>0?'badge badge-warn':'badge';
    return`<div class="nav-tab${state.currentTab===t.id?' active':''}" onclick="switchTab('${t.id}')">${t.label}${t.count!=null?`<span class="${badgeCls}">${t.count}</span>`:''}</div>`;
  }).join('');
}
function switchTab(id){state.currentTab=id;state.selected.clear();state.editingId=null;if(id!=='clarification')state.filters.duplicateOnly=false;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id+'View').classList.add('active');renderNav();renderCurrentView()}

// ===== DASHBOARD =====
function renderDashboard(){
  const all=[...state.clarifications,...state.actions,...state.meetings];
  const total=all.length;
  const openItems=getAllOpenItems().length;
  const overdueItems=all.filter(isOverdue).length;
  const closedItems=all.filter(i=>normalizeStatus(i.status)==='CLOSED').length;
  const rate=total?Math.round(closedItems/total*100):0;
  const weekly=buildOwnerWeekLoad();
  const dash=document.getElementById('dashboardView');
  dash.innerHTML=`
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">全部条目 Total</div><div class="kpi-value">${total}</div><div class="kpi-sub">澄清${state.clarifications.length} / 行动汇总${openItems} / 会议${state.meetings.length}</div></div>
    <div class="kpi-card card-open"><div class="kpi-label">待处理 Open</div><div class="kpi-value">${openItems}</div><div class="kpi-sub">需要跟进处理</div></div>
    <div class="kpi-card card-overdue"><div class="kpi-label">逾期 Overdue</div><div class="kpi-value">${overdueItems}</div><div class="kpi-sub">超过计划日期</div></div>
    <div class="kpi-card card-closed"><div class="kpi-label">关闭率 Closed Rate</div><div class="kpi-value">${rate}%</div><div class="kpi-sub">${closedItems}/${total} 已关闭</div></div>
  </div>
  <div class="charts-row">
    <div class="chart-box"><h3>状态分布 Status Distribution</h3><canvas id="chartStatus"></canvas></div>
    <div class="chart-box"><h3>专业分布 Discipline Breakdown</h3><canvas id="chartDiscipline"></canvas></div>
  </div>
  <div class="charts-row">
    <div class="chart-box"><h3>责任方分布 Action By</h3><canvas id="chartActionBy"></canvas></div>
    <div class="chart-box"><h3>优先级分布 Priority</h3><canvas id="chartPriority"></canvas></div>
  </div>`;
  dash.innerHTML+=`<div class="chart-box"><h3>责任方 + 到期周负荷 Owner-Week Workload (OPEN/IN_PROGRESS)</h3>
    <div class="table-scroll" style="max-height:260px"><table><thead><tr><th>责任方</th><th>到期周</th><th>数量</th></tr></thead><tbody>
    ${weekly.length?weekly.map(r=>`<tr><td>${escHtml(r.owner)}</td><td class="cell-date">${escHtml(r.week)}</td><td>${r.count}</td></tr>`).join(''):'<tr><td colspan="3" class="no-data">暂无待处理数据</td></tr>'}
    </tbody></table></div></div>`;
  const cOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10,family:'Noto Sans SC'},padding:10}}}};
  const dOpts={...cOpts,cutout:'60%'};
  const sCounts={OPEN:0,'IN PROGRESS':0,CLOSED:0,Info:0};
  all.forEach(i=>{const s=statusLabel(i.status);if(sCounts[s]!=null)sCounts[s]++;else if(s==='INFO')sCounts.Info++});
  new Chart(document.getElementById('chartStatus'),{type:'doughnut',data:{labels:Object.keys(sCounts),datasets:[{data:Object.values(sCounts),backgroundColor:['#f59e0b','#06b6d4','#10b981','#3b82f6'],borderWidth:0}]},options:dOpts});
  const disc={};[...state.clarifications,...state.meetings].forEach(i=>{if(i.discipline){disc[i.discipline]=(disc[i.discipline]||0)+1}});
  new Chart(document.getElementById('chartDiscipline'),{type:'bar',data:{labels:Object.keys(disc),datasets:[{data:Object.values(disc),backgroundColor:'rgba(59,130,246,.6)',borderRadius:4}]},options:{...cOpts,plugins:{...cOpts.plugins,legend:{display:false}},scales:{x:{ticks:{color:'#64748b',font:{size:9}},grid:{display:false}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(42,54,84,.4)'}}}}});
  const ab={};all.forEach(i=>{if(i.actionBy){ab[i.actionBy]=(ab[i.actionBy]||0)+1}});
  new Chart(document.getElementById('chartActionBy'),{type:'doughnut',data:{labels:Object.keys(ab),datasets:[{data:Object.values(ab),backgroundColor:['#3b82f6','#10b981','#f59e0b','#8b5cf6'],borderWidth:0}]},options:dOpts});
  const pri={High:0,Medium:0,Low:0};state.clarifications.forEach(i=>{if(i.priority&&pri[i.priority]!=null)pri[i.priority]++});
  new Chart(document.getElementById('chartPriority'),{type:'doughnut',data:{labels:Object.keys(pri),datasets:[{data:Object.values(pri),backgroundColor:['#ef4444','#f59e0b','#10b981'],borderWidth:0}]},options:dOpts});
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
    if(f==='status'){va=normalizeStatus(va);vb=normalizeStatus(vb)}
    if(typeof va==='string')va=va.toLowerCase();if(typeof vb==='string')vb=vb.toLowerCase();
    return va<vb?-dir:va>vb?dir:0;
  })
}
function toggleSort(field){if(state.sort.field===field)state.sort.dir=state.sort.dir==='asc'?'desc':'asc';else{state.sort.field=field;state.sort.dir='asc'}renderCurrentView()}
function thSort(f,zhLabel,enLabel){return`<th class="${state.sort.field===f?'sorted':''}" onclick="toggleSort('${f}')">${zhLabel}<span class="th-sub">${enLabel}</span><span class="sort-icon">${state.sort.field===f?(state.sort.dir==='asc'?'▲':'▼'):'⇅'}</span></th>`}

// ===== TOOLBAR =====
function renderToolbar(type,opts){
  const sOpts=opts.statuses||STATUS_STD;const showD=opts.showDiscipline!==false;const showP=opts.showPriority||false;
  return`<div class="toolbar">
    <div class="search-box">${IC.search}<input type="text" placeholder="搜索 Search..." value="${escHtml(state.filters.search)}" oninput="handleSearchInput(this.value,'${type}')"></div>
    <select class="filter-select" onchange="state.filters.status=this.value;renderCurrentView()"><option value="">全部状态 All</option>${sOpts.map(s=>`<option value="${s}"${state.filters.status===s?' selected':''}>${s}</option>`).join('')}</select>
    ${showD?`<select class="filter-select" onchange="state.filters.discipline=this.value;renderCurrentView()"><option value="">全部专业 All</option>${disciplineOptions.map(d=>`<option value="${d}"${state.filters.discipline===d?' selected':''}>${d}</option>`).join('')}</select>`:''}
    ${showP?`<select class="filter-select" onchange="state.filters.priority=this.value;renderCurrentView()"><option value="">优先级 All</option>${PRIORITIES.map(p=>`<option value="${p}"${state.filters.priority===p?' selected':''}>${p}</option>`).join('')}</select>`:''}
    <select class="filter-select" onchange="state.filters.actionBy=this.value;renderCurrentView()"><option value="">责任方 All</option>${ACTION_BY.map(a=>`<option value="${a}"${state.filters.actionBy===a?' selected':''}>${a}</option>`).join('')}</select>
    <button class="btn ${state.filters.overdueOnly?'btn-danger':'btn-outline'}" onclick="state.filters.overdueOnly=!state.filters.overdueOnly;renderCurrentView()">逾期项</button>
    ${showD?`<button class="btn btn-outline" onclick="addCategory('discipline')">+专业</button>`:''}
    ${type==='clarification'?`<button class="btn btn-outline" onclick="addCategory('type')">+类型</button>`:''}
    ${type==='clarification'?`<button class="btn ${state.filters.duplicateOnly?'btn-danger':'btn-outline'}" onclick="state.filters.duplicateOnly=!state.filters.duplicateOnly;renderCurrentView()">疑似重复</button>`:''}
    <button class="btn btn-primary" onclick="addNewRow('${type}')">${IC.plus} 新增</button>
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
function renderBatchBar(type){const n=state.selected.size;return`<div class="batch-bar${n?' visible':''}"><span>已选 <span class="count">${n}</span> 项</span><select class="filter-select" id="batchStatus"><option value="">批量状态...</option>${STATUS_STD.map(s=>`<option value="${s}">${s}</option>`).join('')}</select><button class="btn btn-outline" onclick="batchUpdate('${type}')">应用</button><button class="btn btn-danger" onclick="batchDelete('${type}')">删除</button></div>`}
function batchUpdate(type){
  const s=normalizeStatus(document.getElementById('batchStatus').value);
  if(!s){toast('请选择状态','error');return}
  const arr=type==='clarification'?state.clarifications:type==='action'?state.actions:state.meetings;
  let c=0;
  arr.forEach(i=>{
    if(state.selected.has(i.id)){
      const before=i.status;
      i.status=s;
      if(s==='CLOSED')i.completionDate=fmtDate(new Date());
      updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(before),to:statusLabel(s)});
      c++;
    }
  });
  refreshDuplicateSet();
  state.selected.clear();save();renderNav();renderCurrentView();toast(`已更新 ${c} 项`)
}
function batchDelete(type){
  const ids=[...state.selected];
  ids.forEach(id=>moveToTrash(type,id,true));
  state.selected.clear();
  refreshDuplicateSet();
  save();renderNav();renderCurrentView();toast(`已移入回收站 ${ids.length} 项`);
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
  save();renderNav();renderCurrentView();toast('已关闭');
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
  if(!v.ok){toast(`缺少必填: ${v.missing.join(', ')}`,'error');return}
  if(prev.status!==item.status)updateMeta(item,{type:'STATUS_CHANGE',field:'status',from:statusLabel(prev.status),to:statusLabel(item.status)});
  if((prev.reply||'')!==(item.reply||''))updateMeta(item,{type:'REPLY_CHANGE',field:'reply',from:'(edited)',to:'(edited)'});
  updateMeta(item,{type:'EDIT'});
  refreshDuplicateSet();
  state.editingId=null;save();renderNav();renderCurrentView();toast('已保存');
}
function addNewRow(type){
  const obj={id:uid()};
  if(type==='clarification'){obj.actionId=''+(state.clarifications.length+1);obj.priority='Medium';obj.discipline='';obj.type='';obj.clarification='';obj.reply='';obj.actionBy='WISON';obj.openDate=fmtDate(new Date());obj.currentDueDate='';obj.status='OPEN';obj.createdAt=nowIso();obj.updatedAt=obj.createdAt;obj.updatedBy=operatorName;obj.history=[{at:obj.createdAt,by:operatorName,type:'CREATE',field:'',from:'',to:''}];state.clarifications.unshift(obj)}
  else if(type==='action'){obj.no=''+(state.actions.length+1);obj.status='OPEN';obj.action='';obj.project='';obj.dateIdentified=fmtDate(new Date());obj.needDate='';obj.actionBy='WISON';obj.remarks='';state.actions.unshift(obj)}
  else{obj.no=''+(state.meetings.length+1);obj.subject='';obj.discipline='';obj.clarification='';obj.reply='';obj.actionBy='WISON';obj.plannedDate=fmtDate(new Date());obj.status='OPEN';obj.createdAt=nowIso();obj.updatedAt=obj.createdAt;obj.updatedBy=operatorName;obj.history=[{at:obj.createdAt,by:operatorName,type:'CREATE',field:'',from:'',to:''}];state.meetings.unshift(obj)}
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
function inDate(item,field,isEditing){
  if(isEditing)return`<input type="date" class="inline-date" data-field="${field}" value="${item[field]||''}">`;
  return`<span class="cell-date">${fmtDate(item[field])}</span>`;
}
function inInput(item,field,isEditing,w){
  if(isEditing)return`<div class="inline-cell" contenteditable="true" data-field="${field}" style="min-width:${w||50}px">${escHtml(item[field]||'')}</div>`;
  return escHtml(item[field]||'—');
}
function actionBtns(type,item,isEditing){
  const isOpen=normalizeStatus(item.status)!=='CLOSED';
  if(isEditing)return`<div class="edit-save-bar"><button class="save-btn" onclick="saveEdit('${type}','${item.id}')">${IC.check} 保存</button><button class="cancel-btn" onclick="cancelEdit()">取消</button></div>`;
  return`<div class="row-actions">${isOpen?`<button class="row-action-btn close-btn" onclick="quickClose('${type}','${item.id}')" title="一键关闭">${IC.check}</button>`:''}<button class="row-action-btn" onclick="showHistory('${type}','${item.id}')" title="历史">${IC.save}</button><button class="row-action-btn" onclick="startEdit('${type}','${item.id}')" title="编辑">${IC.edit}</button><button class="row-action-btn delete" onclick="deleteItem('${type}','${item.id}')" title="删除">${IC.trash}</button></div>`;
}
function startActionReplyEdit(id){state.actionReplyEditId=id;renderActions()}
function cancelActionReplyEdit(){state.actionReplyEditId='';renderActions()}
function saveActionReplyEdit(id,source){
  const arr=source==='澄清'?state.clarifications:state.meetings;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const el=document.getElementById(`replyEdit_${id}`);if(!el)return;
  const before=item.reply||'';
  item.reply=el.value.trim();
  if(before!==item.reply)updateMeta(item,{type:'REPLY_CHANGE',field:'reply',from:'(edited)',to:'(edited)'});
  state.actionReplyEditId='';
  save();renderActions();toast('回复已更新');
}
function renderActionReplyCell(item,sourceType){
  const st=sourceType==='澄清'?'clarification':'meeting';
  if(state.actionReplyEditId===item.id){
    return `<div style="display:flex;gap:4px;align-items:center"><input id="replyEdit_${item.id}" value="${escHtml(item.reply||'')}" style="padding:4px 6px;border-radius:4px;border:1px solid var(--accent);background:var(--bg-deep);color:var(--text-primary);font-size:.74rem;width:160px"><button class="btn btn-green" style="padding:3px 8px;font-size:.7rem" onclick="saveActionReplyEdit('${item.id}','${sourceType}')">保存</button><button class="btn btn-outline" style="padding:3px 8px;font-size:.7rem" onclick="cancelActionReplyEdit()">取消</button></div><div style="margin-top:4px">${renderFieldWithAttachments(item,'reply',st,false)}</div>`;
  }
  return `${renderFieldWithAttachments(item,'reply',st,false)}<div class="cell-text" onclick="startActionReplyEdit('${item.id}')" style="margin-top:4px;color:var(--accent)">编辑回复</div>`;
}
function showHistory(type,id){
  const arr=type==='clarification'?state.clarifications:type==='meeting'?state.meetings:state.actions;
  const item=arr.find(i=>i.id===id);if(!item)return;
  const logs=(item.history||[]).slice(-12).map(h=>`${fmtDate(h.at)} ${h.by||''} ${h.type||'EDIT'} ${h.field?`[${h.field}]`:''} ${h.from?`${h.from} ->`:''} ${h.to||''}`).join('\n');
  alert(logs||'暂无历史记录');
}

// ===== CLARIFICATION VIEW =====
function renderClarifications(){
  const filtered=sortData(applyFilters(state.clarifications));const ids=filtered.map(i=>i.id);
  const v=document.getElementById('clarificationView');
  v.innerHTML=renderToolbar('clarification',{statuses:STATUS_STD,showDiscipline:true,showPriority:true})+renderBatchBar('clarification')
  +`<div class="table-wrap"><div class="table-scroll"><table id="clarificationTable"><thead><tr>
    <th><input type="checkbox" class="cb" onclick="toggleSelectAll(${JSON.stringify(ids).replace(/"/g,'&quot;')})"></th>
    ${thSort('actionId','编号','ID')}${thSort('priority','优先级','Priority')}${thSort('discipline','专业','Discipline')}${thSort('type','类型','Type')}
    <th>澄清内容<span class="th-sub">Clarification</span></th><th>回复记录<span class="th-sub">Reply</span></th>
    ${thSort('actionBy','责任方','Action By')}${thSort('openDate','开始日期','Open Date')}${thSort('currentDueDate','当前到期','Due Date')}${thSort('status','状态','Status')}<th>操作<span class="th-sub">Actions</span></th>
  </tr></thead><tbody>
  ${filtered.length?filtered.map(i=>{const ed=state.editingId===i.id;return`<tr data-id="${i.id}" class="${isOverdue(i)?'overdue':''} ${duplicateIdSet.has(i.id)?' duplicate':''} ${ed?'edit-row':''}">
    <td><input type="checkbox" class="cb" ${state.selected.has(i.id)?'checked':''} onchange="toggleSelect('${i.id}')"></td>
    <td class="cell-id">${inInput(i,'actionId',ed,40)}</td>
    <td>${ed?inSelect(i,'priority',PRIORITIES,true):`<span class="cell-priority priority-${(i.priority||'').toLowerCase()}">${escHtml(i.priority||'—')}</span>`}</td>
    <td>${ed?inSelect(i,'discipline',[''].concat(disciplineOptions),true):`<span class="cell-discipline">${escHtml(i.discipline||'—')}</span>`}</td>
    <td>${ed?inSelect(i,'type',[''].concat(typeOptions),true):escHtml(i.type||'—')}</td>
    <td>${renderFieldWithAttachments(i,'clarification','clarification',ed)}</td><td>${renderFieldWithAttachments(i,'reply','clarification',ed)}</td>
    <td>${ed?inSelect(i,'actionBy',ACTION_BY,true):`<span class="cell-action-by">${escHtml(i.actionBy||'')}</span>`}</td>
    <td>${inDate(i,'openDate',ed)}</td><td>${inDate(i,'currentDueDate',ed)}</td>
    <td>${ed?inSelect(i,'status',STATUS_STD,true):`<span class="cell-status ${statusClass(i.status)}">${escHtml(statusLabel(i.status)||'')}</span>`}</td>
    <td>${actionBtns('clarification',i,ed)}</td>
  </tr>`}).join(''):`<tr class="no-data-row"><td colspan="12" class="no-data">${IC.empty}<div>暂无数据 — 点击新增添加</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>共 ${filtered.length} 条</span><span>逾期 ${filtered.filter(isOverdue).length} 项</span></div></div>`;
}

// ===== ACTION VIEW (aggregates open items from CL + MT) =====
function renderActions(){
  const openItems=getAllOpenItems();
  const v=document.getElementById('actionView');
  v.innerHTML=`<div class="toolbar"><div class="search-box">${IC.search}<input type="text" placeholder="搜索 Search..." value="${escHtml(state.filters.search)}" oninput="handleSearchInput(this.value,'action')"></div></div>
  <div class="table-wrap"><div class="table-scroll"><table id="actionTable"><thead><tr>
    ${thSort('_source','来源','Source')}${thSort('actionId','编号','ID')}${thSort('discipline','专业','Discipline')}
    <th>内容<span class="th-sub">Content</span></th><th>回复<span class="th-sub">Reply</span></th>
    ${thSort('actionBy','责任方','Action By')}${thSort('dueWeek','到期周','Due Week')}${thSort('currentDueDate','到期日期','Due Date')}${thSort('status','状态','Status')}
    <th>操作<span class="th-sub">Actions</span></th>
  </tr></thead><tbody>
  ${openItems.length?openItems.map(i=>`<tr class="${isOverdue(i)?'overdue':''}">
    <td><span class="cell-discipline">${escHtml(i._source)}</span></td>
    <td class="cell-id">${escHtml(i.actionId||i.no||'')}</td>
    <td><span class="cell-discipline">${escHtml(i.discipline||'—')}</span></td>
    <td>${renderFieldWithAttachments(i,'clarification',i._source==='澄清'?'clarification':'meeting',false)}</td>
    <td>${renderActionReplyCell(i,i._source)}</td>
    <td class="cell-action-by">${escHtml(i.actionBy||'')}</td>
    <td class="cell-date">${isoWeek(getDueDate(i))}</td>
    <td class="cell-date">${fmtDate(getDueDate(i))}</td>
    <td><span class="cell-status ${statusClass(i.status)}">${escHtml(statusLabel(i.status)||'')}</span></td>
    <td><button class="btn btn-green" style="padding:4px 10px;font-size:.72rem" onclick="quickCloseFromAction('${i.id}','${i._source}')">${IC.check} 关闭</button></td>
  </tr>`).join(''):`<tr class="no-data-row"><td colspan="10" class="no-data">${IC.empty}<div>全部已关闭</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>待处理行动项: ${openItems.length} 条 (来自技术澄清 + 会议纪要的OPEN项)</span></div></div>`;
}
function quickCloseFromAction(id,source){
  if(source==='澄清'){const i=state.clarifications.find(x=>x.id===id);if(i){const b=i.status;i.status='CLOSED';i.completionDate=fmtDate(new Date());updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(b),to:'CLOSED'})}}
  else{const i=state.meetings.find(x=>x.id===id);if(i){const b=i.status;i.status='CLOSED';i.completionDate=fmtDate(new Date());updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(b),to:'CLOSED'})}}
  save();renderNav();renderCurrentView();toast('已关闭');
}

// ===== RECYCLE VIEW =====
function renderRecycle(){
  const items=[...state.trash];
  const v=document.getElementById('recycleView');
  v.innerHTML=`<div class="toolbar"><div class="search-box">${IC.search}<input placeholder="搜索回收站..." value="${escHtml(state.filters.search)}" oninput="handleSearchInput(this.value,'recycle')"></div><button class="btn btn-outline" onclick="restoreAllTrash()">全部恢复</button><button class="btn btn-danger" onclick="emptyTrash()">清空回收站</button></div>
  <div class="table-wrap"><div class="table-scroll"><table id="recycleTable"><thead><tr>
    <th>来源</th><th>编号</th><th>主题/内容</th><th>责任方</th><th>删除时间</th><th>操作</th>
  </tr></thead><tbody>
  ${items.length?items.map(t=>`<tr>
    <td><span class="cell-discipline">${escHtml(t.sourceType)}</span></td>
    <td class="cell-id">${escHtml(t.item.actionId||t.item.no||'')}</td>
    <td><div class="cell-text">${escHtml(t.item.subject||t.item.clarification||'')}</div></td>
    <td class="cell-action-by">${escHtml(t.item.actionBy||'')}</td>
    <td class="cell-date">${fmtDate(t.deletedAt)}</td>
    <td><button class="btn btn-green" style="padding:4px 10px;font-size:.72rem" onclick="restoreFromTrash('${t.trashId}')">恢复</button></td>
  </tr>`).join(''):`<tr class="no-data-row"><td colspan="6" class="no-data">${IC.empty}<div>回收站为空</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>回收站条目: ${items.length}</span></div></div>`;
}
function restoreAllTrash(){
  const ids=state.trash.map(t=>t.trashId);
  ids.forEach(id=>restoreFromTrash(id,true));
  save();renderNav();renderCurrentView();
  toast(`已恢复 ${ids.length} 项`);
}

// ===== MEETING VIEW =====
function renderMeetings(){
  const filtered=sortData(applyFilters(state.meetings));
  // date directory
  const dates=[...new Set(state.meetings.map(i=>i.plannedDate).filter(Boolean))].sort().reverse();
  let display=filtered;
  if(state.meetingDateFilter)display=filtered.filter(i=>i.plannedDate===state.meetingDateFilter);
  if(state.meetingSubjectFilter)display=display.filter(i=>String(i.subject||'').toLowerCase().includes(state.meetingSubjectFilter.toLowerCase()));
  const ids=display.map(i=>i.id);
  const v=document.getElementById('meetingView');
  v.innerHTML=renderToolbar('meeting',{statuses:STATUS_STD,showDiscipline:true,showPriority:false})
  +`<div class="toolbar" style="margin-top:-4px"><div class="search-box">${IC.search}<input value="${escHtml(state.meetingSubjectFilter)}" placeholder="按会议主题筛选 Subject..." oninput="handleMeetingSubjectInput(this.value)"></div></div>`
  +`<div class="meeting-date-bar"><span class="date-label">日期目录 Dates:</span><span class="meeting-date-chip${!state.meetingDateFilter?' active':''}" onclick="state.meetingDateFilter='';renderCurrentView()">全部</span>${dates.map(d=>`<span class="meeting-date-chip${state.meetingDateFilter===d?' active':''}" onclick="state.meetingDateFilter='${d}';renderCurrentView()">${d}</span>`).join('')}</div>`
  +renderBatchBar('meeting')
  +`<div class="table-wrap"><div class="table-scroll"><table id="meetingTable"><thead><tr>
    <th><input type="checkbox" class="cb" onclick="toggleSelectAll(${JSON.stringify(ids).replace(/"/g,'&quot;')})"></th>
    ${thSort('no','编号','No.')}${thSort('subject','议题','Subject')}${thSort('discipline','专业','Discipline')}
    <th>澄清内容<span class="th-sub">Clarification</span></th><th>回复<span class="th-sub">Reply</span></th>
    ${thSort('actionBy','责任方','Action By')}${thSort('plannedDate','计划日期','Planned Date')}${thSort('status','状态','Status')}<th>操作<span class="th-sub">Actions</span></th>
  </tr></thead><tbody>
  ${display.length?display.map(i=>{const ed=state.editingId===i.id;return`<tr data-id="${i.id}" class="${isOverdue(i)?'overdue':''} ${ed?'edit-row':''}">
    <td><input type="checkbox" class="cb" ${state.selected.has(i.id)?'checked':''} onchange="toggleSelect('${i.id}')"></td>
    <td class="cell-id">${inInput(i,'no',ed,40)}</td>
    <td>${inInput(i,'subject',ed,120)}</td>
    <td>${ed?inSelect(i,'discipline',[''].concat(disciplineOptions),true):`<span class="cell-discipline">${escHtml(i.discipline||'—')}</span>`}</td>
    <td>${renderFieldWithAttachments(i,'clarification','meeting',ed)}</td><td>${renderFieldWithAttachments(i,'reply','meeting',ed)}</td>
    <td>${ed?inSelect(i,'actionBy',ACTION_BY,true):`<span class="cell-action-by">${escHtml(i.actionBy||'')}</span>`}</td>
    <td>${inDate(i,'plannedDate',ed)}</td>
    <td>${ed?inSelect(i,'status',STATUS_STD,true):`<span class="cell-status ${statusClass(i.status)}">${escHtml(statusLabel(i.status)||'')}</span>`}</td>
    <td>${actionBtns('meeting',i,ed)}</td>
  </tr>`}).join(''):`<tr class="no-data-row"><td colspan="10" class="no-data">${IC.empty}<div>暂无数据</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>共 ${display.length} 条</span></div></div>`;
}

// ===== EXCEL IMPORT/EXPORT =====
document.getElementById('xlsxFileInput').addEventListener('change',function(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      const wb=XLSX.read(ev.target.result,{type:'array',cellDates:true});
      let imported={cl:0,mt:0};
      wb.SheetNames.forEach(name=>{
        const data=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
        if(!data.length)return;
        const cols=Object.keys(data[0]).map(c=>c.toLowerCase());
        const isCL=cols.some(c=>c.includes('clarification')||c.includes('priority')||c.includes('澄清'));
        const isMT=cols.some(c=>c.includes('subject')||c.includes('clause')||c.includes('议题'));
        data.forEach(row=>{
          const obj={id:uid()};const vals=Object.values(row);const keys=Object.keys(row);
          keys.forEach((k,idx)=>{const kl=k.toLowerCase();const v=vals[idx];
            if(kl.includes('priority')||kl.includes('优先级'))obj.priority=String(v);
            else if(kl.includes('discipline')||kl.includes('专业'))obj.discipline=String(v);
            else if(kl.includes('clarification')||kl.includes('澄清'))obj.clarification=String(v);
            else if(kl.includes('reply')||kl.includes('回复'))obj.reply=String(v);
            else if(kl.includes('action by')||kl.includes('责任'))obj.actionBy=String(v);
            else if(kl.includes('status')||kl.includes('状态'))obj.status=normalizeStatus(v);
            else if(kl.includes('type')||kl.includes('类型'))obj.type=String(v);
            else if(kl.includes('subject')||kl.includes('clause')||kl.includes('议题'))obj.subject=String(v);
            else if(kl.includes('planned')||kl.includes('计划'))obj.plannedDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('open date')||kl.includes('开始'))obj.openDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('due')||kl.includes('到期'))obj.currentDueDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('no')||kl.includes('id')||kl.includes('编号'))obj.actionId=String(v);
          });
          if(!obj.actionId)obj.actionId=obj.no||'';
          if(isMT&&!isCL){obj.no=obj.actionId||'';state.meetings.push(normalizeItem('meeting',obj));imported.mt++}
          else{state.clarifications.push(normalizeItem('clarification',obj));imported.cl++}
        });
      });
      refreshDuplicateSet();
      save();renderNav();renderCurrentView();
      toast(`导入成功: ${imported.cl}条澄清, ${imported.mt}条会议`);
    }catch(err){toast('导入失败: '+err.message,'error')}
  };
  reader.readAsArrayBuffer(file);e.target.value='';
});
document.getElementById('attachmentInput').addEventListener('change',function(e){
  const file=e.target.files[0];
  if(file&&pendingAttachmentTarget)attachToItem(pendingAttachmentTarget.sourceType,pendingAttachmentTarget.id,pendingAttachmentTarget.fieldKey,file);
  pendingAttachmentTarget=null;
  e.target.value='';
});
document.getElementById('modal').addEventListener('click',function(e){if(e.target.id==='modal')closeModalPreview()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModalPreview()});

function totalAttachments(item){
  const map=item.fieldAttachments||{};
  return Object.values(map).reduce((n,arr)=>n+(Array.isArray(arr)?arr.length:0),0);
}
function attachmentNames(item){
  const map=item.fieldAttachments||{};
  const all=[];
  Object.keys(map).forEach(k=>{(map[k]||[]).forEach(a=>all.push(`${k}:${a.name}`))});
  return all.join('; ');
}

function exportXlsx(){
  const wb=XLSX.utils.book_new();
  if(state.clarifications.length){
    const data=state.clarifications.map(i=>({'编号 ID':i.actionId,'优先级 Priority':i.priority,'专业 Discipline':i.discipline,'类型 Type':i.type,'澄清内容 Clarification':i.clarification,'回复 Reply':i.reply,'责任方 Action By':i.actionBy,'开始日期 Open Date':i.openDate,'当前到期 Due Date':i.currentDueDate,'完成日期 Completion':i.completionDate,'状态 Status':normalizeStatus(i.status),'附件数 Attachment Count':totalAttachments(i),'附件名 Attachment Names':attachmentNames(i),'创建时间 Created At':i.createdAt,'更新时间 Updated At':i.updatedAt,'更新人 Updated By':i.updatedBy,'历史 History':JSON.stringify(i.history||[])}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'技术澄清');
  }
  if(state.meetings.length){
    const data=state.meetings.map(i=>({'编号 No':i.no,'议题 Subject':i.subject,'专业 Discipline':i.discipline,'澄清 Clarification':i.clarification,'回复 Reply':i.reply,'责任方 Action By':i.actionBy,'计划日期 Planned':i.plannedDate,'状态 Status':normalizeStatus(i.status),'附件数 Attachment Count':totalAttachments(i),'附件名 Attachment Names':attachmentNames(i),'创建时间 Created At':i.createdAt,'更新时间 Updated At':i.updatedAt,'更新人 Updated By':i.updatedBy,'历史 History':JSON.stringify(i.history||[])}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'会议纪要');
  }
  const pName=projects.find(p=>p.id===activeProjectId)?.name||'export';
  XLSX.writeFile(wb,`${pName}_${fmtDate(new Date())}.xlsx`);
  toast('Excel导出成功');
}

// ===== SAMPLE DATA =====
function importSampleData(){
  if(state.clarifications.length||state.meetings.length){if(!confirm('将覆盖现有数据，确认？'))return}
  state.clarifications=[
    {id:uid(),actionId:'1',priority:'High',discipline:'Electrical',type:'DCP',clarification:'Email to WISON 20240115: DCP feeder for staging and metering skid to be on same MCC as per latest SLD.',reply:'Email to BH 20240116: Wison can only provide 400VAC or 230VAC. Vendor shall provide step down transformer.',actionBy:'WISON',openDate:'2024-01-15',status:'CLOSED'},
    {id:uid(),actionId:'2',priority:'High',discipline:'Process',type:'General',clarification:'Email to WISON 20231220: Review questions from Systems Engineering team. Booster compressor requirement and seal gas system design confirmation.',reply:'WISON REPLY 20240123: Booster is required and confirmed. Seal gas - treated feed gas 64barg.',actionBy:'WISON',openDate:'2023-12-20',status:'CLOSED'},
    {id:uid(),actionId:'3',priority:'Medium',discipline:'Process',type:'PID',clarification:'P&ID review query: seal gas pressure and temperature at battery limit needed.',reply:'WISON REPLY 20240117: Process will provide seal gas P&T in battery limit. Update in next P&ID rev.',actionBy:'WISON',openDate:'2024-01-12',status:'CLOSED'},
    {id:uid(),actionId:'4',priority:'High',discipline:'Instrument',type:'Datasheet',clarification:'Gas detector type/location for MRC area. SIL rating for ESD valves.',reply:'BH to provide spec. SIL 2 confirmed for all ESD valves.',actionBy:'BH',openDate:'2024-02-15',currentDueDate:'2024-04-30',status:'CLOSED'},
    {id:uid(),actionId:'5',priority:'Medium',discipline:'Mechanical',type:'Spec',clarification:'Vibration monitoring: online vs portable. API 670 compliance level.',reply:'',actionBy:'BH',openDate:'2024-03-01',currentDueDate:'2024-06-15',status:'OPEN'},
    {id:uid(),actionId:'6',priority:'High',discipline:'Process',type:'General',clarification:'N2 purge case for MRC commissioning. Define purge volume and flow rate.',reply:'',actionBy:'WISON',openDate:'2024-06-24',currentDueDate:'2024-09-30',status:'OPEN'},
    {id:uid(),actionId:'7',priority:'Low',discipline:'Piping',type:'Drawing',clarification:'Piping GA review: nozzle orientation, pipe supports, anti-vibration design.',reply:'BH provided updated GA rev.B on 20240520.',actionBy:'BH',openDate:'2024-04-10',status:'CLOSED'},
    {id:uid(),actionId:'8',priority:'High',discipline:'Electrical',type:'Spec',clarification:'MCC interfaces with UCP. BH to send AC motor typicals first.',reply:'BH shared by emails. Wison reviewing.',actionBy:'BH',openDate:'2024-06-24',currentDueDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),actionId:'9',priority:'Medium',discipline:'HVAC',type:'General',clarification:'WHRU tags and limit switch positions for dampers. Exhaust duct volume and heat recovery data.',reply:'Wison reply 20240705: WHRU tag 25-PKG-003_WHR-001. Limit switch details provided.',actionBy:'WISON',openDate:'2024-06-24',currentDueDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),actionId:'10',priority:'High',discipline:'Process',type:'Datasheet',clarification:'Gas turbine performance datasheet: ambient temp correction and site derating.',reply:'',actionBy:'BH',openDate:'2024-07-15',currentDueDate:'2024-10-30',status:'IN_PROGRESS'},
  ];
  state.meetings=[
    {id:uid(),no:'1',subject:'Hazop meeting date',discipline:'Process',clarification:'Wison to share official email about Hazop date.',reply:'Confirmed 2Sep-6Sep 2024 for MRC package.',actionBy:'WISON',plannedDate:'2024-06-28',status:'CLOSED'},
    {id:uid(),no:'2',subject:'MCC interfaces',discipline:'Electrical',clarification:'MCC-UCP interfaces. BH to send AC motor typicals.',reply:'BH shared by emails.',actionBy:'BH',plannedDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),no:'3',subject:'WHRU tags',discipline:'HVAC',clarification:'WHRU tags and limit switch positions for dampers.',reply:'Wison reply 20240705: tag 25-PKG-003_WHR-001.',actionBy:'WISON',plannedDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),no:'4',subject:'N2 purge commissioning',discipline:'Process',clarification:'N2 purge case for MRC commissioning shall be confirmed by Wison.',reply:'',actionBy:'WISON',plannedDate:'2024-09-30',status:'OPEN'},
    {id:uid(),no:'5',subject:'Exhaust duct volume',discipline:'Process',clarification:'Exhaust duct volume and heat recovery. BH confirm purge time.',reply:'WISON reply 20240722: refer to clarification item 85.',actionBy:'WISON',plannedDate:'2024-10-30',status:'OPEN'},
    {id:uid(),no:'Gen-1',subject:'Seal gas system',discipline:'Process',clarification:'TA P15 No.32 seal gas external source. Booster evaluation.',reply:'Treated feed gas 64barg, 39°C. Settle out 29barg.',actionBy:'WISON',plannedDate:'2023-12-15',status:'CLOSED'},
    {id:uid(),no:'Gen-2',subject:'Backup time UPS',discipline:'Electrical',clarification:'TA p9 No.9 backup time from UPS system.',reply:'Min 180min for GT cool down. Emergency generator provides AC.',actionBy:'BH',plannedDate:'2023-12-15',status:'CLOSED'},
    {id:uid(),no:'Gen-4',subject:'Terminal box material',discipline:'Electrical',clarification:'TA p18 No.46 ex-n availability. 316L material confirmation.',reply:'Zone 2 confirmed. Ex-e in 316SS. Impact check pending.',actionBy:'BH',plannedDate:'2023-12-15',status:'CLOSED'},
  ];
  migrateData();
  refreshDuplicateSet();
  state.actions=[];save();renderNav();renderCurrentView();toast('示例数据已导入');
}

// ===== RENDER =====
function renderCurrentView(){
  if(state.currentTab==='dashboard')renderDashboard();
  else if(state.currentTab==='clarification')renderClarifications();
  else if(state.currentTab==='action')renderActions();
  else if(state.currentTab==='meeting')renderMeetings();
  else if(state.currentTab==='recycle')renderRecycle();
}
function renderAll(){renderSidebar();renderHeader();renderNav();renderCurrentView()}

// ===== INIT =====
ensureDefaultProject();load();document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);renderAll();
