// ===== CLARIFICATION VIEW =====
function renderClarifications(){
  const filtered=sortData(applyFilters(state.clarifications,'clarification'));const ids=filtered.map(i=>i.id);
  const v=document.getElementById('clarificationView');
  const thActions=t('操作','Actions');
  const thClar=t('澄清内容','Clarification');
  const thReply=t('回复记录','Reply');
  v.innerHTML=renderToolbar('clarification',{statuses:STATUS_STD,showDiscipline:true,showPriority:true})+renderBatchBar('clarification')
  +`<div class="table-wrap"><div class="table-scroll"><table id="clarificationTable"><thead><tr>
    <th class="action-col">${thActions}</th>
    <th><input type="checkbox" class="cb" onclick="toggleSelectAll(${JSON.stringify(ids).replace(/"/g,'&quot;')})"></th>
    ${thSort('actionId','编号','ID')}${thSort('priority','优先级','Priority')}${thSort('discipline','专业','Discipline')}${thSort('type','类型','Type')}${thSort('source','来源','Source')}
    <th>${thClar}</th><th>${thReply}</th>
    ${thSort('actionBy','责任方','Action By')}${thSort('openDate','开始日期','Open Date')}${thSort('currentDueDate','当前到期','Due Date')}${thSort('status','状态','Status')}
  </tr></thead><tbody>
  ${filtered.length?filtered.map(i=>{const ed=state.editingId===i.id;const pri=String(i.priority||'').toLowerCase();return`<tr data-id="${i.id}" class="${isOverdue(i)?'overdue':''} ${duplicateIdSet.has(i.id)?' duplicate':''} ${ed?'edit-row':''} priority-row-${pri}">
    <td class="action-col">${actionBtns('clarification',i,ed)}</td>
    <td><input type="checkbox" class="cb" ${state.selected.has(i.id)?'checked':''} onchange="toggleSelect('${i.id}')"></td>
    <td class="cell-id">${escHtml(i.actionId||'')}</td>
    <td>${ed?inSelect(i,'priority',PRIORITIES,true):`<span class="cell-priority priority-${(i.priority||'').toLowerCase()}">${escHtml(i.priority||'—')}</span>`}</td>
    <td>${ed?inManagedSelect(i,'discipline',[''].concat(disciplineOptions),true,'discipline','clarification'):`<span class="cell-discipline">${escHtml(i.discipline||'—')}</span>`}</td>
    <td>${ed?inManagedSelect(i,'type',[''].concat(typeOptions),true,'type','clarification'):escHtml(i.type||'—')}</td>
    <td>${ed?inManagedSelect(i,'source',[''].concat(sourceOptions),true,'source','clarification'):escHtml(i.source||'—')}</td>
    <td>${renderFieldWithAttachments(i,'clarification','clarification',ed)}</td><td>${renderFieldWithAttachments(i,'reply','clarification',ed)}</td>
    <td>${ed?inManagedSelect(i,'actionBy',actionByOptions,true,'actionBy','clarification'):`<span class="cell-action-by">${escHtml(i.actionBy||'')}</span>`}</td>
    <td>${inDate(i,'openDate',ed)}</td><td>${inDate(i,'currentDueDate',ed)}</td>
    <td><select class="inline-select status-select ${statusClass(i.status)}" onchange="quickSetStatus('clarification','${i.id}',this.value)">${STATUS_STD.map(s=>`<option value="${s}"${normalizeStatus(i.status)===normalizeStatus(s)?' selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></td>
  </tr>`}).join(''):`<tr class="no-data-row"><td colspan="13" class="no-data">${IC.empty}<div>暂无数据 — 点击新增添加</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>${t('共','Total')} ${filtered.length} ${t('条','items')}</span><span>${t('逾期','Overdue')} ${filtered.filter(isOverdue).length} ${t('项','items')}</span><button class="btn btn-outline" style="padding:4px 10px;font-size:.72rem" onclick="resetTableColumnWidths('clarificationTable')">${t('重置本表列宽','Reset Table Widths')}</button></div></div>`;
  initColumnResize('clarificationTable');
}

// ===== ACTION VIEW (aggregates open items from CL + MT) =====
function renderActions(){
  const disciplineList=getEffectiveDisciplineOptions();
  const actionByList=getEffectiveActionByOptions();
  const openItems=sortData(applyActionFilters(getAllOpenItems()));
  const v=document.getElementById('actionView');
  const thActions=t('操作','Actions');
  const thContent=t('内容','Content');
  const thReply=t('回复','Reply');
  v.innerHTML=`<div class="toolbar">
    <div class="search-box">${IC.search}<input type="text" placeholder="${t('搜索行动项...','Search actions...')}" value="${escHtml(state.actionFilters.search||'')}" oninput="setActionSearch(this.value)"></div>
    <select class="filter-select" onchange="setActionFilter('status',this.value)"><option value="">${t('全部状态','All Status')}</option>${STATUS_STD.map(s=>`<option value="${s}"${state.actionFilters.status===s?' selected':''}>${s}</option>`).join('')}</select>
    <select class="filter-select" onchange="setActionFilter('sourceType',this.value)"><option value="">${t('全部来源','All Sources')}</option><option value="clarification"${state.actionFilters.sourceType==='clarification'?' selected':''}>${t('澄清','Clarification')}</option><option value="meeting"${state.actionFilters.sourceType==='meeting'?' selected':''}>${t('会议','Meeting')}</option></select>
    <select class="filter-select" onchange="setActionFilter('discipline',this.value)"><option value="">${t('全部专业','All Discipline')}</option>${disciplineList.map(d=>`<option value="${d}"${state.actionFilters.discipline===d?' selected':''}>${d}</option>`).join('')}</select>
    <select class="filter-select" onchange="setActionFilter('actionBy',this.value)"><option value="">${t('责任方全部','All Action By')}</option>${actionByList.map(a=>`<option value="${a}"${state.actionFilters.actionBy===a?' selected':''}>${a}</option>`).join('')}</select>
    <select class="filter-select" onchange="setActionFilter('priority',this.value)"><option value="">${t('优先级全部','All Priority')}</option>${PRIORITIES.map(p=>`<option value="${p}"${state.actionFilters.priority===p?' selected':''}>${p}</option>`).join('')}</select>
    <button class="btn ${state.actionFilters.overdueOnly?'btn-danger':'btn-outline'}" onclick="toggleActionOverdue()">${t('仅逾期','Overdue Only')}</button>
    <button class="btn btn-outline" onclick="resetActionFilters()">${t('重置筛选','Reset')}</button>
  </div>
  <div class="table-wrap"><div class="table-scroll"><table id="actionTable"><thead><tr>
    <th class="action-col">${thActions}</th>
    ${thSort('_sourceLabel','来源','Source')}${thSort('actionId','编号','ID')}${thSort('discipline','专业','Discipline')}
    <th>${thContent}</th><th>${thReply}</th>
    ${thSort('actionBy','责任方','Action By')}${thSort('currentDueDate','到期日期','Due Date')}${thSort('status','状态','Status')}
  </tr></thead><tbody>
  ${openItems.length?openItems.map(i=>`<tr data-id="${i.id}" data-source="${i._sourceType}" class="${isOverdue(i)?'overdue':''} priority-row-${String(i.priority||'').toLowerCase()}">
    <td class="action-col"><button class="row-action-btn close-btn" title="${t('关闭','Close')}" onclick="quickCloseFromAction('${i.id}','${i._sourceType}')">${IC.check}</button></td>
    <td><span class="cell-discipline">${escHtml(i._sourceLabel)}</span></td>
    <td class="cell-id">${escHtml(i.actionId||i.no||'')}</td>
    <td><span class="cell-discipline">${escHtml(i.discipline||'—')}</span></td>
    <td>${renderFieldWithAttachments(i,'clarification',i._sourceType==='clarification'?'clarification':'meeting',false)}</td>
    <td>${renderActionReplyCell(i,i._sourceType)}</td>
    <td class="cell-action-by">${escHtml(i.actionBy||'')}</td>
    <td class="cell-date">${fmtDate(getDueDate(i))}</td>
    <td><span class="cell-status ${statusClass(i.status)}">${escHtml(statusLabel(i.status)||'')}</span></td>
  </tr>`).join(''):`<tr class="no-data-row"><td colspan="9" class="no-data">${IC.empty}<div>${t('全部已关闭','All closed')}</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>${t('待处理行动项','Open Actions')}: ${openItems.length}</span><button class="btn btn-outline" style="padding:4px 10px;font-size:.72rem" onclick="resetTableColumnWidths('actionTable')">${t('重置本表列宽','Reset Table Widths')}</button></div></div>`;
  initColumnResize('actionTable');
}
function quickCloseFromAction(id,source){
  if(source==='clarification'){const i=state.clarifications.find(x=>x.id===id);if(i){const b=i.status;i.status='CLOSED';i.completionDate=fmtDate(new Date());updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(b),to:'CLOSED'})}}
  else{const i=state.meetings.find(x=>x.id===id);if(i){const b=i.status;i.status='CLOSED';i.completionDate=fmtDate(new Date());updateMeta(i,{type:'STATUS_CHANGE',field:'status',from:statusLabel(b),to:'CLOSED'})}}
  save();renderNav();renderCurrentView();toast(t('已关闭','Closed'));
}

// ===== RECYCLE VIEW =====
function renderRecycle(){
  const rf=getBoardFilter('recycle');
  const q=String(rf.search||'').toLowerCase();
  const items=[...state.trash].filter(tr=>{
    if(!q)return true;
    return JSON.stringify(tr||{}).toLowerCase().includes(q);
  });
  const v=document.getElementById('recycleView');
  const thActions=t('操作','Actions');
  const thSource=t('来源','Source');
  const thNo=t('编号','No.');
  const thTopic=t('主题/内容','Subject/Content');
  const thOwner=t('责任方','Action By');
  const thDel=t('删除时间','Deleted At');
  v.innerHTML=`<div class="toolbar"><div class="search-box">${IC.search}<input placeholder="${t('搜索回收站...','Search recycle...')}" value="${escHtml(getBoardFilter('recycle').search)}" oninput="handleSearchInput(this.value,'recycle')"></div><button class="btn btn-outline" onclick="restoreAllTrash()">${t('全部恢复','Restore all')}</button><button class="btn btn-danger" onclick="emptyTrash()">${t('清空回收站','Empty recycle')}</button></div>
  <div class="table-wrap"><div class="table-scroll"><table id="recycleTable"><thead><tr>
    <th>${thActions}</th><th>${thSource}</th><th>${thNo}</th><th>${thTopic}</th><th>${thOwner}</th><th>${thDel}</th>
  </tr></thead><tbody>
  ${items.length?items.map(tr=>`<tr>
    <td><button class="btn btn-green" style="padding:4px 10px;font-size:.72rem" onclick="restoreFromTrash('${tr.trashId}')">${t('恢复','Restore')}</button></td>
    <td><span class="cell-discipline">${escHtml(tr.sourceType)}</span></td>
    <td class="cell-id">${escHtml((tr.item&& (tr.item.actionId||tr.item.no))||'')}</td>
    <td><div class="cell-text">${escHtml((tr.item&& (tr.item.subject||tr.item.clarification||tr.item.action||tr.item.reply))||'—')}</div></td>
    <td class="cell-action-by">${escHtml((tr.item&&tr.item.actionBy)||'')}</td>
    <td class="cell-date">${fmtDate(tr.deletedAt)}</td>
  </tr>`).join(''):`<tr class="no-data-row"><td colspan="6" class="no-data">${IC.empty}<div>${t('回收站为空','Recycle is empty')}</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>${t('回收站条目','Recycle Items')}: ${items.length}</span><button class="btn btn-outline" style="padding:4px 10px;font-size:.72rem" onclick="resetTableColumnWidths('recycleTable')">${t('重置本表列宽','Reset Table Widths')}</button></div></div>`;
  initColumnResize('recycleTable');
}
function restoreAllTrash(){
  const ids=state.trash.map(t=>t.trashId);
  ids.forEach(id=>restoreFromTrash(id,true));
  save();renderNav();renderCurrentView();
  toast(t(`已恢复 ${ids.length} 项`,`Restored ${ids.length} items`));
}

// ===== MEETING VIEW =====
function renderMeetings(){
  const filtered=sortData(applyFilters(state.meetings,'meeting'));
  // date directory by meeting date
  const dates=[...new Set(state.meetings.map(i=>i.meetingDate).filter(Boolean))].sort().reverse();
  let display=filtered;
  if(state.meetingDateFilter)display=filtered.filter(i=>i.meetingDate===state.meetingDateFilter);
  if(state.meetingSubjectFilter)display=display.filter(i=>String(i.subject||'').toLowerCase().includes(state.meetingSubjectFilter.toLowerCase()));
  const ids=display.map(i=>i.id);
  const v=document.getElementById('meetingView');
  const thActions=t('操作','Actions');
  const thClar=t('澄清内容','Clarification');
  const thReply=t('回复','Reply');
  v.innerHTML=renderToolbar('meeting',{statuses:STATUS_STD,showDiscipline:true,showPriority:true,subjectSearch:true})
  +`<div class="meeting-date-bar"><span class="date-label">${t('日期目录','Dates')}:</span><span class="meeting-date-chip${!state.meetingDateFilter?' active':''}" onclick="state.meetingDateFilter='';renderCurrentView()">${t('全部','All')}</span>${dates.map(d=>`<span class="meeting-date-chip${state.meetingDateFilter===d?' active':''}" onclick="state.meetingDateFilter='${d}';renderCurrentView()">${d}</span>`).join('')}</div>`
  +renderBatchBar('meeting')
  +`<div class="table-wrap"><div class="table-scroll"><table id="meetingTable"><thead><tr>
    <th class="action-col">${thActions}</th>
    <th><input type="checkbox" class="cb" onclick="toggleSelectAll(${JSON.stringify(ids).replace(/"/g,'&quot;')})"></th>
    ${thSort('no','编号','No.')}${thSort('priority','优先级','Priority')}${thSort('subject','议题','Subject')}${thSort('discipline','专业','Discipline')}
    <th>${thClar}</th><th>${thReply}</th>
    ${thSort('actionBy','责任方','Action By')}${thSort('meetingDate','会议日期','Meeting Date')}${thSort('plannedDate','计划日期(Due)','Due Date')}${thSort('status','状态','Status')}
  </tr></thead><tbody>
  ${display.length?display.map(i=>{const ed=state.editingId===i.id;return`<tr data-id="${i.id}" class="${isOverdue(i)?'overdue':''} ${ed?'edit-row':''} priority-row-${String(i.priority||'').toLowerCase()}">
    <td class="action-col">${actionBtns('meeting',i,ed)}</td>
    <td><input type="checkbox" class="cb" ${state.selected.has(i.id)?'checked':''} onchange="toggleSelect('${i.id}')"></td>
    <td class="cell-id">${escHtml(i.no||'')}</td>
    <td>${ed?inSelect(i,'priority',PRIORITIES,true):`<span class="cell-priority priority-${(i.priority||'').toLowerCase()}">${escHtml(i.priority||'—')}</span>`}</td>
    <td>${inInput(i,'subject',ed,120)}</td>
    <td>${ed?inManagedSelect(i,'discipline',[''].concat(disciplineOptions),true,'discipline','meeting'):`<span class="cell-discipline">${escHtml(i.discipline||'—')}</span>`}</td>
    <td>${renderFieldWithAttachments(i,'clarification','meeting',ed)}</td><td>${renderFieldWithAttachments(i,'reply','meeting',ed)}</td>
    <td>${ed?inManagedSelect(i,'actionBy',actionByOptions,true,'actionBy','meeting'):`<span class="cell-action-by">${escHtml(i.actionBy||'')}</span>`}</td>
    <td>${inDate(i,'meetingDate',ed)}</td>
    <td>${inDate(i,'plannedDate',ed)}</td>
    <td><select class="inline-select status-select ${statusClass(i.status)}" onchange="quickSetStatus('meeting','${i.id}',this.value)">${STATUS_STD.map(s=>`<option value="${s}"${normalizeStatus(i.status)===normalizeStatus(s)?' selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></td>
  </tr>`}).join(''):`<tr class="no-data-row"><td colspan="12" class="no-data">${IC.empty}<div>暂无数据</div></td></tr>`}
  </tbody></table></div>
  <div class="table-footer"><span>${t('共','Total')} ${display.length} ${t('条','items')}</span><button class="btn btn-outline" style="padding:4px 10px;font-size:.72rem" onclick="resetTableColumnWidths('meetingTable')">${t('重置本表列宽','Reset Table Widths')}</button></div></div>`;
  initColumnResize('meetingTable');
}

// ===== DOCUMENT BOARD (Independent Module) =====
let docFileDbPromise=null;
const DOC_FILE_DB_NAME='et_doc_files_db';
const DOC_FILE_STORE='pdf_files';

function openDocFileDb(){
  if(docFileDbPromise)return docFileDbPromise;
  docFileDbPromise=new Promise((resolve,reject)=>{
    if(!window.indexedDB){resolve(null);return}
    const req=indexedDB.open(DOC_FILE_DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(DOC_FILE_STORE)){
        db.createObjectStore(DOC_FILE_STORE,{keyPath:'id'});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('open doc file db failed'));
  });
  return docFileDbPromise;
}
async function putDocPdfBlob(id,file){
  const db=await openDocFileDb();
  if(!db)throw new Error('IndexedDB unavailable');
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DOC_FILE_STORE,'readwrite');
    const req=tx.objectStore(DOC_FILE_STORE).put({
      id,
      projectId:activeProjectId,
      name:file.name,
      type:file.type||'application/pdf',
      size:file.size||0,
      createdAt:nowIso(),
      blob:file
    });
    req.onsuccess=()=>resolve(true);
    req.onerror=()=>reject(req.error||new Error('put pdf blob failed'));
  });
}
async function getDocPdfBlob(id){
  const db=await openDocFileDb();
  if(!db)return null;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DOC_FILE_STORE,'readonly');
    const req=tx.objectStore(DOC_FILE_STORE).get(id);
    req.onsuccess=()=>resolve(req.result?req.result.blob:null);
    req.onerror=()=>reject(req.error||new Error('get pdf blob failed'));
  });
}
function ensureDocBoardActivePackage(){
  docBoard=normalizeDocBoard(docBoard);
  if(!docBoard.activePackageId&&docBoard.packages.length)docBoard.activePackageId=docBoard.packages[0].id;
}
function getActiveDocPackage(){
  ensureDocBoardActivePackage();
  return (docBoard.packages||[]).find(p=>p.id===docBoard.activePackageId)||null;
}
function docCreatePackage(){
  const name=(prompt(t('输入设备包名称（如 MRC Compressor）','Input package name (e.g. MRC Compressor)'))||'').trim();
  if(!name)return;
  const pkg={id:uid(),name,tag:'',folderHint:'',docs:[],createdAt:nowIso(),updatedAt:nowIso()};
  docBoard.packages.unshift(pkg);
  docBoard.activePackageId=pkg.id;
  saveDocBoard();
  renderSidebar();
  renderNav();
  renderCurrentView();
  toast(t('设备包已创建','Package created'));
}
function docDeletePackage(){
  const pkg=getActiveDocPackage();
  if(!pkg)return;
  if(!confirm(t(`确认删除设备包 ${pkg.name}？仅删除目录与索引，不删除已下载本地源文件。`,`Delete package ${pkg.name}? It deletes index only.`)))return;
  docBoard.packages=(docBoard.packages||[]).filter(p=>p.id!==pkg.id);
  docBoard.activePackageId=docBoard.packages[0]?docBoard.packages[0].id:'';
  saveDocBoard();
  renderSidebar();
  renderNav();
  renderCurrentView();
}
function docSwitchPackage(id){
  docBoard.activePackageId=id;
  saveDocBoard();
  renderCurrentView();
}
function docSetFolderHint(){
  const pkg=getActiveDocPackage();
  if(!pkg)return;
  const hint=(prompt(t('输入本地文件夹路径提示（例如 D:/Projects/F450/MRC）','Input local folder hint path'),pkg.folderHint||'')||'').trim();
  pkg.folderHint=hint;
  pkg.updatedAt=nowIso();
  saveDocBoard();
  renderCurrentView();
}
function docNormalizeNo(s){
  return String(s||'').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9\-_.]/g,'');
}
function docNormalizeToken(s){
  return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
}
function docExtractRev(name){
  const m=String(name||'').match(/(?:^|[_\-\s\.])(REV[\-_\s]?[A-Z0-9]+)/i);
  return m?m[1].toUpperCase().replace(/\s+/g,'').replace('_','-'):'REV-UNSPEC';
}
function docExtractNoFromFilename(name){
  const base=String(name||'').replace(/\.[^.]+$/i,'');
  const revPart=base.replace(/(?:^|[_\-\s])REV[\-_\s]?[A-Z0-9]+/ig,'');
  const m=revPart.match(/[A-Za-z]{1,6}[\-_\/.]?[A-Za-z0-9]{2,}[\-_\/.]?[A-Za-z0-9]{1,}/);
  if(m&&m[0])return docNormalizeNo(m[0]);
  const token=(revPart.split(/[\s_]+/)[0]||revPart).trim();
  return docNormalizeNo(token);
}
function docFindByNo(pkg,docNo){
  const key=docNormalizeNo(docNo);
  if(!key)return null;
  return (pkg.docs||[]).find(d=>docNormalizeNo(d.docNo)===key)||null;
}
function docExtractFileNo(name){
  const base=String(name||'').replace(/\.[^.]+$/,'');
  const m=base.match(/[A-Z]{1,4}[\-_]?\d{2,}/i);
  return m?docNormalizeNo(m[0]):'';
}
function docBuildMatchKeys(obj){
  const keys=[];
  ['docNo','fileNo','ownerDocNo'].forEach(k=>{if(obj&&obj[k])keys.push(docNormalizeNo(obj[k]))});
  const title=String((obj&&obj.title)||'').trim();
  if(title){
    title.split(/[\s_\-\/]+/).filter(Boolean).forEach(tk=>{
      const n=docNormalizeToken(tk);
      if(n.length>=4)keys.push(n);
    });
  }
  return [...new Set(keys.filter(Boolean))];
}
function docFindByAnyKey(pkg,candidate){
  const cKeys=docBuildMatchKeys(candidate);
  if(!cKeys.length)return null;
  let best=null;
  let bestScore=0;
  (pkg.docs||[]).forEach(d=>{
    const dKeys=docBuildMatchKeys(d);
    let score=0;
    cKeys.forEach(k=>{if(dKeys.includes(k))score+=2;else if(dKeys.some(x=>x.includes(k)||k.includes(x)))score+=1});
    if(score>bestScore){best=d;bestScore=score}
  });
  return bestScore>0?best:null;
}
function docRankMatch(pkg,candidate){
  const cKeys=docBuildMatchKeys(candidate);
  if(!cKeys.length)return{item:null,score:0,keys:[]};
  let best=null;
  let bestScore=0;
  let bestKeys=[];
  (pkg.docs||[]).forEach(d=>{
    const dKeys=docBuildMatchKeys(d);
    let score=0;
    const hit=[];
    cKeys.forEach(k=>{
      if(dKeys.includes(k)){score+=3;hit.push(k);return}
      const near=dKeys.find(x=>x.includes(k)||k.includes(x));
      if(near){score+=1;hit.push(`${k}~${near}`)}
    });
    if(score>bestScore){best=d;bestScore=score;bestKeys=hit}
  });
  return{item:best,score:bestScore,keys:bestKeys};
}
function docEnsureAuxCollections(){
  if(!Array.isArray(docBoard.matchPreview))docBoard.matchPreview=[];
  if(!Array.isArray(docBoard.unmatchedFiles))docBoard.unmatchedFiles=[];
  if(!Array.isArray(docBoard.pdfComments))docBoard.pdfComments=[];
  docBoard.pdfComments=(docBoard.pdfComments||[]).map((r,idx)=>({
    id:r&&r.id?r.id:uid(),
    fileName:String((r&&r.fileName)||''),
    commentIndex:parseInt((r&&r.commentIndex)||idx+1,10)||idx+1,
    page:parseInt((r&&r.page)||0,10)||0,
    author:String((r&&r.author)||''),
    created:String((r&&r.created)||''),
    updated:String((r&&r.updated)||''),
    annotationType:String((r&&r.annotationType)||''),
    comment:String((r&&(r.comment||r.text))||''),
  }));
  if(!docBoard.pdfSelected||typeof docBoard.pdfSelected!=='object')docBoard.pdfSelected={};
  if(!docBoard.pdfFilter)docBoard.pdfFilter='ALL';
}
function docRevRank(rev){
  const token=String(rev||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!token)return-1;
  const m=token.match(/R(\d{1,3})$/)||token.match(/REV(\d{1,3})$/)||token.match(/(\d{1,3})$/);
  if(m)return parseInt(m[1],10);
  return-1;
}
function docGetLatestRevisionText(item){
  const bucket=[];
  (item.revisions||[]).forEach(r=>{if(r&&r.rev)bucket.push(String(r.rev))});
  (item.linkedFiles||[]).forEach(l=>{if(l&&l.rev)bucket.push(String(l.rev))});
  if(!bucket.length)return'';
  let best='';
  let bestScore=-1;
  bucket.forEach(rv=>{
    const score=docRevRank(rv);
    if(score>bestScore){bestScore=score;best=rv;}
  });
  return best||bucket[bucket.length-1]||'';
}
function docNormalizePdfCommentEntries(fileName,comments){
  const rows=[];
  (comments||[]).forEach((c,idx)=>{
    if(typeof c==='string'){
      rows.push({id:uid(),fileName,commentIndex:idx+1,page:0,author:'',created:'',updated:'',annotationType:'',comment:c});
      return;
    }
    if(!c||typeof c!=='object')return;
    const text=String(c.text||c.comment||'').trim();
    if(!text)return;
    rows.push({
      id:uid(),
      fileName,
      commentIndex:idx+1,
      page:parseInt(c.page||0,10)||0,
      author:String(c.author||'').trim(),
      created:String(c.created||'').trim(),
      updated:String(c.updated||'').trim(),
      annotationType:String(c.annotationType||'').trim(),
      comment:text,
    });
  });
  return rows;
}
async function docApplyIndexedFiles(pkg,files,sourceType){
  docEnsureAuxCollections();
  const preview=[];
  const unmatched=[];
  let indexed=0;
  for(const file of files||[]){
    const rel=String(file.relativePath||file.webkitRelativePath||file.fileName||file.name||'');
    const leaf=String(file.fileName||file.name||rel.split('/').pop()||'');
    const ext=(leaf.split('.').pop()||'').toLowerCase();
    const base=String(leaf||'').replace(/\.[^.]+$/,'');
    const rev=docExtractRev(leaf);
    const probe={docNo:docExtractNoFromFilename(leaf),fileNo:docExtractFileNo(leaf),ownerDocNo:'',title:base};
    const rank=docRankMatch(pkg,probe);
    let item=rank.item;
    if(!item&&sourceType==='sdr')item=docUpsertItem(pkg,probe);
    if(!item){
      unmatched.push({id:uid(),packageId:pkg.id,fileName:leaf,relativePath:rel,candidateNo:probe.docNo||probe.fileNo||'',keys:docBuildMatchKeys(probe)});
      preview.push({fileName:leaf,relativePath:rel,matchedDoc:'',score:0,rule:'UNMATCHED'});
      continue;
    }
    const link={id:uid(),fileName:leaf,relativePath:rel,ext,size:parseInt(file.size||0,10)||0,rev,indexedAt:nowIso(),source:sourceType};
    if(sourceType==='picker'){
      const fileRefId=uid();
      try{await putDocPdfBlob(fileRefId,file.fileObj||file)}catch(err){continue}
      link.fileRefId=fileRefId;
    }else if(sourceType==='backend'){
      link.backendRelPath=rel;
      link.packageName=pkg.name;
    }
    item.linkedFiles=item.linkedFiles||[];
    item.linkedFiles.push(link);
    if(ext==='pdf'){
      let comments=[];
      let commentRows=[];
      if(sourceType==='picker'){
        comments=await docExtractPdfComments(file.fileObj||file);
        commentRows=docNormalizePdfCommentEntries(leaf,comments);
      }
      if(sourceType==='backend'){
        try{
          const data=await apiRequest(`/api/fs/pdf-comments?projectId=${encodeURIComponent(activeProjectId)}&packageName=${encodeURIComponent(pkg.name)}&relativePath=${encodeURIComponent(rel)}`);
          comments=Array.isArray(data&&data.comments)?data.comments:[];
          commentRows=docNormalizePdfCommentEntries(leaf,Array.isArray(data&&data.commentDetails)&&data.commentDetails.length?data.commentDetails:comments);
        }catch(err){comments=[]}
      }
      item.revisions=item.revisions||[];
      const dedup=(item.revisions||[]).find(r=>String(r.fileName||'').toLowerCase()===leaf.toLowerCase()&&String(r.rev||'')===rev);
      if(!dedup)item.revisions.push({id:uid(),rev,fileName:leaf,fileRefId:link.fileRefId||'',backendRelPath:link.backendRelPath||'',packageName:link.packageName||pkg.name,size:link.size||0,uploadedAt:nowIso(),comments});
      if(commentRows.length){
        docBoard.pdfComments=[...commentRows,...docBoard.pdfComments].slice(0,3000);
      }
    }
    const latest=docGetLatestRevisionText(item);
    if(latest){
      item.latestRevision=latest;
      item.fields=item.fields||{};
      item.fields['Latest Revision']=latest;
      if(!Array.isArray(pkg.sdrColumns))pkg.sdrColumns=[];
      if(!pkg.sdrColumns.includes('Latest Revision'))pkg.sdrColumns.push('Latest Revision');
    }
    item.updatedAt=nowIso();
    preview.push({fileName:leaf,relativePath:rel,matchedDoc:item.docNo||item.title||'',score:rank.score,rule:rank.keys.join('|')||'AUTO'});
    indexed++;
  }
  docBoard.matchPreview=preview.slice(0,400);
  docBoard.unmatchedFiles=unmatched.slice(0,800);
  pkg.updatedAt=nowIso();
  return indexed;
}
function docBindUnmatched(fileId,docId){
  const pkg=getActiveDocPackage();if(!pkg)return;
  docEnsureAuxCollections();
  const idx=(docBoard.unmatchedFiles||[]).findIndex(x=>x.id===fileId);
  if(idx<0)return;
  const file=docBoard.unmatchedFiles[idx];
  const item=(pkg.docs||[]).find(d=>d.id===docId);
  if(!item){toast(t('请选择重绑定目标文件条目','Select a doc entry to bind'),'error');return}
  item.linkedFiles=item.linkedFiles||[];
  const rev=docExtractRev(file.fileName||'');
  item.linkedFiles.push({id:uid(),fileName:file.fileName,relativePath:file.relativePath,ext:(file.fileName.split('.').pop()||'').toLowerCase(),rev,source:'backend',backendRelPath:file.relativePath,packageName:pkg.name,indexedAt:nowIso()});
  const latest=docGetLatestRevisionText(item);
  if(latest){
    item.latestRevision=latest;
    item.fields=item.fields||{};
    item.fields['Latest Revision']=latest;
    if(!Array.isArray(pkg.sdrColumns))pkg.sdrColumns=[];
    if(!pkg.sdrColumns.includes('Latest Revision'))pkg.sdrColumns.push('Latest Revision');
  }
  docBoard.unmatchedFiles.splice(idx,1);
  item.updatedAt=nowIso();
  pkg.updatedAt=nowIso();
  saveDocBoard();
  renderDocBoard();
  toast(t('重绑定成功','Rebind completed'));
}
function docEnsurePackageByName(name){
  const target=String(name||'').trim();
  if(!target)return null;
  let pkg=(docBoard.packages||[]).find(p=>String(p.name||'').trim().toUpperCase()===target.toUpperCase())||null;
  if(!pkg){
    pkg={id:uid(),name:target,tag:'',folderHint:'',docs:[],sdrColumns:[],createdAt:nowIso(),updatedAt:nowIso()};
    docBoard.packages.unshift(pkg);
  }
  docBoard.activePackageId=pkg.id;
  return pkg;
}
function docUpsertItem(pkg,row){
  const docNo=(row.docNo||'').trim();
  const title=(row.title||'').trim();
  const fileNo=(row.fileNo||'').trim();
  const ownerDocNo=(row.ownerDocNo||'').trim();
  if(!docNo&&!title&&!fileNo&&!ownerDocNo)return null;
  let item=docFindByNo(pkg,docNo)||docFindByAnyKey(pkg,{docNo,title,fileNo,ownerDocNo});
  if(!item){
    item={id:uid(),docNo:docNo||fileNo||ownerDocNo||`UNNO-${(pkg.docs||[]).length+1}`,fileNo:fileNo||'',ownerDocNo:ownerDocNo||'',title:title||docNo||'Untitled',discipline:'',status:'OPEN',revisions:[],linkedFiles:[],fields:{},updatedAt:nowIso()};
    pkg.docs.push(item);
  }else{
    if(title)item.title=title;
    if(fileNo&&!item.fileNo)item.fileNo=fileNo;
    if(ownerDocNo&&!item.ownerDocNo)item.ownerDocNo=ownerDocNo;
    if(!Array.isArray(item.linkedFiles))item.linkedFiles=[];
    if(!item.fields||typeof item.fields!=='object')item.fields={};
    item.updatedAt=nowIso();
  }
  if(row.fields&&typeof row.fields==='object')item.fields={...item.fields,...row.fields};
  return item;
}
function docParseSdrRows(rows){
  const out=[];
  const allColumns=new Set();
  (rows||[]).forEach(r=>{
    const keys=Object.keys(r||{});
    if(!keys.length)return;
    let docNo='';
    let fileNo='';
    let ownerDocNo='';
    let title='';
    let rev='';
    const fields={};
    let nonEmptyCount=0;
    const candidates=[];
    keys.forEach(k=>{
      const lk=String(k).toLowerCase();
      const v=String(r[k]||'').trim();
      if(!v)return;
      nonEmptyCount++;
      fields[String(k).trim()]=v;
      allColumns.add(String(k).trim());
      if(!docNo&&(/company\s*doc|company\s*document\s*number|doc\s*no\.?|document\s*(no\.?|number)|文件编号|图号|编号/.test(lk)))docNo=v;
      else if(!fileNo&&(/contractor\s*document\s*number|file\s*(no\.?|number)|文件号|文件编号/.test(lk)))fileNo=v;
      else if(!ownerDocNo&&(/owner\s*doc|owner\s*no|业主文件编号|业主编号/.test(lk)))ownerDocNo=v;
      else if(!title&&(/deliverable\s*title|title|name|文件名|文件名称|描述|description/.test(lk)))title=v;
      else if(!rev&&(/rev|revision|版次/.test(lk)))rev=v;
      const nv=docNormalizeNo(v);
      if(nv&&/[A-Z]/.test(nv)&&/\d/.test(nv)&&nv.length>=5)candidates.push(nv);
    });
    if(!docNo&&candidates.length)docNo=candidates[0];
    if(!fileNo&&candidates.length>1)fileNo=candidates[1];
    if(!docNo&&!fileNo&&candidates.length===1){
      // Keep at least one identifier so row can appear on board.
      fileNo=candidates[0];
    }
    // Drop sparse cover/meta rows that are common above SDR tables.
    if(nonEmptyCount<3&&!title&&!fileNo&&!ownerDocNo)return;
    if(!docNo&&!title&&!fileNo&&!ownerDocNo)return;
    out.push({docNo,fileNo,ownerDocNo,title,rev,fields});
  });
  return{items:out,columns:[...allColumns]};
}
function docNormalizeHeaderName(v,idx){
  const h=String(v||'').replace(/\s+/g,' ').trim();
  return h||`COL_${idx+1}`;
}
function docHeaderRowScore(matrix,rowIndex){
  const row=matrix[rowIndex]||[];
  const cells=row.map(v=>String(v||'').trim()).filter(Boolean);
  if(cells.length<3)return-1;
  const keyRx=/(doc|document|file|deliverable|title|name|rev|revision|owner|编号|文件|名称|描述|版次|业主)/i;
  let hit=0;
  let score=cells.length*2;
  cells.forEach(c=>{if(keyRx.test(c)){score+=5;hit++;} if(c.length>64)score-=2;});
  if(hit===0)return-1;
  let dataLikeRows=0;
  const scanEnd=Math.min(matrix.length,rowIndex+13);
  for(let i=rowIndex+1;i<scanEnd;i++){
    const nonEmpty=(matrix[i]||[]).map(v=>String(v||'').trim()).filter(Boolean).length;
    if(nonEmpty>=2)dataLikeRows++;
  }
  score+=dataLikeRows*3;
  return score;
}
function docFindBestSdrHeaderRow(matrix,scan){
  const hardKeyRx=/(doc\s*deliverable\s*title|contractor\s*document\s*number|company\s*doc|document\s*number|文件名称|文件编号)/i;
  const softKeyRx=/(project|activity|deliverable|document|title|revision|contractor|company|文件|编号|名称|版次)/i;
  let bestIdx=-1;
  let bestScore=-1;
  for(let i=0;i<scan;i++){
    const row=(matrix[i]||[]).map(v=>String(v||'').trim());
    const cells=row.filter(Boolean);
    if(cells.length<3)continue;
    const hardHits=cells.filter(c=>hardKeyRx.test(c)).length;
    const softHits=cells.filter(c=>softKeyRx.test(c)).length;
    if(hardHits===0&&softHits<2)continue;
    let tailDataRows=0;
    const end=Math.min(matrix.length,i+40);
    for(let r=i+1;r<end;r++){
      const rc=(matrix[r]||[]).map(v=>String(v||'').trim()).filter(Boolean);
      if(rc.length>=2)tailDataRows++;
    }
    const score=hardHits*30+softHits*6+cells.length*2+tailDataRows*3;
    if(score>bestScore){bestScore=score;bestIdx=i;}
  }
  return bestIdx;
}
function docParseSheetAutoHeader(sheet){
  const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  if(!matrix.length)return{rows:[],columns:[]};
  const scan=Math.min(matrix.length,220);
  const headerIdx=docFindBestSdrHeaderRow(matrix,scan);
  if(headerIdx<0)return{rows:[],columns:[]};
  const readMeta=(rx)=>{
    const end=Math.min(scan,headerIdx+1);
    for(let i=0;i<end;i++){
      const row=(matrix[i]||[]).map(v=>String(v||'').trim());
      for(let j=0;j<row.length;j++){
        if(!rx.test(row[j]))continue;
        for(let k=j+1;k<row.length;k++)if(row[k])return row[k];
      }
    }
    return'';
  };
  const meta={
    'Project Name':readMeta(/project|项目名称/i),
    'File Name':readMeta(/file\s*name|文件名/i),
    'CONTRACTOR Document Number':readMeta(/contractor\s*doc|contractor\s*document\s*number/i),
    'COMPANY Doc Number':readMeta(/company\s*doc|company\s*document\s*number/i),
  };
  const rawHeaders=(matrix[headerIdx]||[]).map((v,idx)=>docNormalizeHeaderName(v,idx));
  const headers=[];
  const seen={};
  rawHeaders.forEach(h=>{
    const k=h.toUpperCase();
    seen[k]=(seen[k]||0)+1;
    headers.push(seen[k]===1?h:`${h}_${seen[k]}`);
  });
  const rows=[];
  for(let r=headerIdx+1;r<matrix.length;r++){
    const arr=matrix[r]||[];
    const obj={};
    let has=false;
    let nonEmptyCount=0;
    for(let c=0;c<headers.length;c++){
      const val=String(arr[c]??'').trim();
      obj[headers[c]]=val;
      if(val){has=true;nonEmptyCount++;}
    }
    Object.keys(meta).forEach(k=>{if(meta[k])obj[k]=meta[k];});
    // Simple BI-like cleaning: skip sparse note rows under table.
    if(nonEmptyCount<2)has=false;
    if(has)rows.push(obj);
  }
  const nonEmptyCols=headers.filter(h=>rows.some(x=>String(x[h]||'').trim()));
  Object.keys(meta).forEach(k=>{if(meta[k]&&!nonEmptyCols.includes(k))nonEmptyCols.push(k);});
  return{rows,columns:nonEmptyCols};
}
function docTriggerSdrImport(){
  const el=document.getElementById('sdrFileInput');
  if(el)el.click();
}
function docTriggerPdfImport(){
  document.getElementById('pdfCommentInput').click();
}
function docTriggerFolderImport(){
  toast(t('请使用后端映射索引导入设备包文件夹','Use backend mapping index to import package folders'),'info');
}
async function docTriggerBackendFolderIndex(){
  let pkg=getActiveDocPackage();
  if(!pkg){
    const name=(prompt(t('输入设备包名称用于映射索引','Input package name for backend mapping'))||'').trim();
    if(!name)return;
    pkg=docEnsurePackageByName(name);
  }
  const root=(prompt(t('输入后端可访问的设备包目录绝对路径','Input backend-accessible package folder path'),pkg.folderHint||'')||'').trim();
  if(!root)return;
  try{
    const res=await apiRequest('/api/fs/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:activeProjectId,packageName:pkg.name,rootPath:root})});
    pkg.folderHint=String(res.rootPath||root);
    const indexed=await docApplyIndexedFiles(pkg,(res.files||[]).map(f=>({...f,fileName:f.fileName||''})),'backend');
    saveDocBoard();
    renderSidebar();
    renderNav();
    renderDocBoard();
    toast(t(`后端映射索引完成：${indexed} 条`,`Backend indexed: ${indexed} files`));
  }catch(err){
    toast(t('后端映射索引失败','Backend mapping/index failed'),'error');
  }
}
async function docExtractPdfComments(file){
  const toBase64=(buf)=>{
    let binary='';
    const bytes=new Uint8Array(buf);
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){
      const sub=bytes.subarray(i,i+chunk);
      binary+=String.fromCharCode.apply(null,sub);
    }
    return btoa(binary);
  };
  try{
    const buf=await file.arrayBuffer();
    const useBackend=typeof backendMode!=='undefined'&&!!backendMode;
    if(useBackend){
      try{
        const data=await apiRequest('/api/pdf-comments/extract',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:file.name||'',fileBase64:toBase64(buf)})});
        if(data&&Array.isArray(data.commentDetails)&&data.commentDetails.length)return data.commentDetails;
        if(data&&Array.isArray(data.comments))return data.comments.map(x=>({text:String(x||''),page:0,author:'',created:'',updated:'',annotationType:''}));
      }catch(err){
        toast(t('后端PDF意见提取失败，请确认后端已重启并已安装PyMuPDF','Backend PDF extraction failed. Restart backend and verify PyMuPDF installed'),'error');
        return[];
      }
    }
    const text=new TextDecoder('latin1').decode(buf);
    const out=[];
    const reg=/\/Contents\s*\(([^)]{1,400})\)/g;
    let m;
    while((m=reg.exec(text))&&out.length<80){
      const content=String(m[1]||'').replace(/\\[rn]/g,' ').replace(/\\\)/g,')').replace(/\\\(/g,'(').trim();
      if(content&&content.length>2)out.push({text:content,page:0,author:'',created:'',updated:'',annotationType:''});
    }
    return out;
  }catch(e){
    return[];
  }
}
async function docPreviewRevision(item,revId){
  const rev=(item.revisions||[]).find(r=>r.id===revId)||null;
  const blobRef=rev?(rev.fileRefId||rev.blobId):'';
  if(!rev){toast(t('未找到该版次文件','Revision file not found'),'error');return}
  if(!blobRef&&rev.backendRelPath){
    docOpenBackendFile(rev.packageName||getActiveDocPackage()?.name||'',rev.backendRelPath);
    return;
  }
  if(!blobRef){toast(t('未找到该版次文件','Revision file not found'),'error');return}
  const blob=await getDocPdfBlob(blobRef);
  if(!blob){toast(t('PDF内容不存在，可能已清理','PDF blob missing, may have been cleaned'),'error');return}
  const url=URL.createObjectURL(blob);
  window.open(url,'_blank','noopener');
  setTimeout(()=>URL.revokeObjectURL(url),25000);
}
async function docOpenByRef(fileRefId){
  if(!fileRefId){toast(t('未找到索引文件','Indexed file not found'),'error');return}
  const blob=await getDocPdfBlob(fileRefId);
  if(!blob){toast(t('文件内容不存在，可能已清理','File blob missing, may have been cleaned'),'error');return}
  const url=URL.createObjectURL(blob);
  window.open(url,'_blank','noopener');
  setTimeout(()=>URL.revokeObjectURL(url),25000);
}
function docOpenBackendFile(packageName,relativePath){
  const url=`/api/fs/open?projectId=${encodeURIComponent(activeProjectId)}&packageName=${encodeURIComponent(packageName)}&relativePath=${encodeURIComponent(relativePath)}`;
  window.open(url,'_blank','noopener');
}
function docExportCommentIndex(){
  const pkg=getActiveDocPackage();
  if(!pkg){toast(t('请先选择设备包','Select package first'),'error');return}
  const rows=[];
  (pkg.docs||[]).forEach(d=>{
    (d.revisions||[]).forEach(r=>{
      (r.comments||[]).forEach((c,idx)=>rows.push({docNo:d.docNo,title:d.title,rev:r.rev,fileName:r.fileName,commentIndex:idx+1,comment:c}));
    });
  });
  const blob=new Blob([JSON.stringify({package:pkg.name,exportedAt:nowIso(),rows},null,2)],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${pkg.name||'package'}_pdf_comments.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
function renderDocBoard(){
  ensureDocBoardActivePackage();
  const pkg=getActiveDocPackage();
  const docs=(pkg&&Array.isArray(pkg.docs))?pkg.docs:[];
  const search=(docBoard.search||'').toLowerCase();
  const list=docs.filter(d=>{
    const hit=!search
      ||String(d.docNo||'').toLowerCase().includes(search)
      ||String(d.fileNo||'').toLowerCase().includes(search)
      ||String(d.ownerDocNo||'').toLowerCase().includes(search)
      ||String(d.title||'').toLowerCase().includes(search);
    if(!hit)return false;
    if((docBoard.statusFilter||'ALL')==='ALL')return true;
    return String(d.status||'OPEN')===docBoard.statusFilter;
  });
  const packageOptions=(docBoard.packages||[]).map(p=>`<option value="${p.id}"${docBoard.activePackageId===p.id?' selected':''}>${escHtml(p.name)}</option>`).join('');
  const dynCols=((pkg&&Array.isArray(pkg.sdrColumns))?pkg.sdrColumns:[]).filter(Boolean);
  const v=document.getElementById('docboardView');
  docEnsureAuxCollections();
  const unmatched=(docBoard.unmatchedFiles||[]).filter(u=>!pkg||u.packageId===pkg.id);
  const preview=docBoard.matchPreview||[];
  v.innerHTML=`<div class="toolbar"><select class="filter-select" onchange="docSwitchPackage(this.value)"><option value="">${t('选择设备包...','Select Package...')}</option>${packageOptions}</select><button class="btn btn-primary" onclick="docTriggerSdrImport()">${IC.upload} ${t('导入SDR目录','Import SDR')}</button><button class="btn btn-primary" onclick="docTriggerFolderImport()">${IC.upload} ${t('导入设备包文件夹','Import Package Folder')}</button><button class="btn btn-primary" onclick="docTriggerBackendFolderIndex()">${IC.upload} ${t('后端映射索引','Backend Mapping Index')}</button><button class="btn btn-primary" onclick="docTriggerPdfImport()">${IC.upload} ${t('批量导入PDF版次','Import PDF Revisions')}</button><button class="btn btn-outline" onclick="docDeletePackage()">${IC.trash} ${t('删除设备包','Delete Package')}</button></div>
  <div class="toolbar"><div class="search-box">${IC.search}<input type="text" value="${escHtml(docBoard.search||'')}" placeholder="${t('按文件编号/文件号/业主编号/名称搜索...','Search by doc no/file no/owner no/title...')}" oninput="docBoard.search=this.value;saveDocBoard();renderDocBoard()"></div><select class="filter-select" onchange="docBoard.statusFilter=this.value;saveDocBoard();renderDocBoard()"><option value="ALL"${(docBoard.statusFilter||'ALL')==='ALL'?' selected':''}>${t('全部状态','All Status')}</option><option value="OPEN"${docBoard.statusFilter==='OPEN'?' selected':''}>OPEN</option><option value="IN_PROGRESS"${docBoard.statusFilter==='IN_PROGRESS'?' selected':''}>IN_PROGRESS</option><option value="CLOSED"${docBoard.statusFilter==='CLOSED'?' selected':''}>CLOSED</option></select>${pkg?`<span class="doc-meta-chip">${t('设备包','Package')}: ${escHtml(pkg.name)}</span>`:''}${pkg&&pkg.folderHint?`<span class="doc-meta-chip">${t('文件夹','Folder')}: ${escHtml(pkg.folderHint)}</span>`:''}</div>
  <div class="table-wrap"><div class="table-scroll"><table id="docBoardTable"><thead><tr><th>${t('文件编号','Doc No')}</th><th>${t('文件号','File No')}</th><th>${t('业主文件编号','Owner Doc No')}</th><th>${t('文件名称','Title')}</th>${dynCols.map(c=>`<th>${escHtml(c)}</th>`).join('')}<th>${t('状态','Status')}</th><th>${t('版次数','Revisions')}</th><th>${t('缺失','Missing')}</th><th>${t('动作','Actions')}</th></tr></thead><tbody>
  ${list.length?list.map(d=>{const revs=d.revisions||[];const linked=d.linkedFiles||[];const latestLinked=linked[linked.length-1]||null;const miss=linked.length?0:1;const fields=d.fields||{};return`<tr><td class="cell-id">${escHtml(d.docNo||'')}</td><td class="cell-id">${escHtml(d.fileNo||'—')}</td><td class="cell-id">${escHtml(d.ownerDocNo||'—')}</td><td><div class="cell-text expanded">${escHtml(d.title||'')}</div><div class="doc-rev-list">${revs.slice(-3).reverse().map(r=>`<span class="doc-rev-pill">${escHtml(r.rev||'REV')} · ${escHtml(r.fileName||'')}</span>`).join('')}</div></td>${dynCols.map(c=>`<td><div class="cell-text expanded">${escHtml(fields[c]||'')}</div></td>`).join('')}<td><select class="inline-select" data-doc-id="${d.id}" onchange="docSetDocStatus('${d.id}',this.value)"><option value="OPEN"${(d.status||'OPEN')==='OPEN'?' selected':''}>OPEN</option><option value="IN_PROGRESS"${d.status==='IN_PROGRESS'?' selected':''}>IN_PROGRESS</option><option value="CLOSED"${d.status==='CLOSED'?' selected':''}>CLOSED</option></select></td><td class="cell-date">${revs.length}</td><td class="cell-date" style="${miss?'color:var(--red);font-weight:700':''}">${miss}</td><td><button class="btn btn-outline" style="padding:4px 8px;font-size:.72rem" onclick="docOpenLatest('${d.id}')">${t('打开最新文件','Open Latest')}</button>${latestLinked&&latestLinked.fileRefId?`<button class="btn btn-outline" style="padding:4px 8px;font-size:.72rem" onclick="docOpenByRef('${latestLinked.fileRefId}')">${t('打开索引文件','Open Indexed')}</button>`:''}${latestLinked&&latestLinked.backendRelPath?`<button class="btn btn-outline" style="padding:4px 8px;font-size:.72rem" onclick="docOpenBackendFile('${escJs(latestLinked.packageName||pkg.name)}','${escJs(latestLinked.backendRelPath)}')">${t('打开后端文件','Open FS')}</button>`:''}</td></tr>`}).join(''):`<tr class="no-data-row"><td colspan="${9+dynCols.length}" class="no-data">${IC.empty}<div>${t('暂无文件目录，请先导入SDR或设备包文件夹。','No document index yet. Import SDR or package folder first.')}</div></td></tr>`}
  </tbody></table></div><div class="table-footer"><span>${t('文件总数','Documents')}: ${list.length}</span><span>${t('设备包数','Packages')}: ${(docBoard.packages||[]).length}</span></div></div>`;
  v.innerHTML+=`<div class="chart-box"><h3>${t('匹配规则预览面板','Match Rule Preview')}</h3><div class="table-scroll" style="max-height:220px"><table><thead><tr><th>${t('文件名','File')}</th><th>${t('匹配目标','Matched To')}</th><th>${t('分值','Score')}</th><th>${t('规则','Rule')}</th></tr></thead><tbody>${preview.length?preview.slice(0,80).map(r=>`<tr><td class="cell-id">${escHtml(r.fileName||'')}</td><td>${escHtml(r.matchedDoc||'—')}</td><td class="cell-date">${escHtml(String(r.score||0))}</td><td><div class="cell-text expanded">${escHtml(r.rule||'')}</div></td></tr>`).join(''):`<tr><td colspan="4" class="no-data">${t('暂无匹配预览','No match preview')}</td></tr>`}</tbody></table></div></div>`;
  const docOpts=(pkg&&pkg.docs||[]).map(d=>`<option value="${d.id}">${escHtml((d.docNo||'')+' '+(d.title||''))}</option>`).join('');
  v.innerHTML+=`<div class="chart-box"><h3>${t('未匹配文件池','Unmatched File Pool')}</h3><div class="table-scroll" style="max-height:260px"><table><thead><tr><th>${t('文件名','File')}</th><th>${t('候选编号','Candidate')}</th><th>${t('手动重绑定','Manual Rebind')}</th></tr></thead><tbody>${unmatched.length?unmatched.slice(0,120).map(u=>`<tr><td><div class="cell-text expanded">${escHtml(u.fileName||'')}</div><div class="cell-date">${escHtml(u.relativePath||'')}</div></td><td class="cell-id">${escHtml(u.candidateNo||'—')}</td><td><select id="rebind_${u.id}" class="inline-select" style="min-width:220px"><option value="">${t('选择目标条目','Select target')}</option>${docOpts}</select><button class="btn btn-outline" style="padding:4px 8px;font-size:.72rem;margin-left:6px" onclick="docBindUnmatched('${u.id}',document.getElementById('rebind_${u.id}').value)">${t('一键重绑定','Rebind')}</button></td></tr>`).join(''):`<tr><td colspan="3" class="no-data">${t('暂无未匹配文件','No unmatched files')}</td></tr>`}</tbody></table></div></div>`;
  initColumnResize('docBoardTable');
}
function docSetDocStatus(docId,status){
  const pkg=getActiveDocPackage();if(!pkg)return;
  const item=(pkg.docs||[]).find(d=>d.id===docId);if(!item)return;
  item.status=normalizeStatus(status);
  item.updatedAt=nowIso();
  saveDocBoard();
  renderDocBoard();
}
function docOpenLatest(docId){
  const pkg=getActiveDocPackage();if(!pkg)return;
  const item=(pkg.docs||[]).find(d=>d.id===docId);if(!item)return;
  const latestRev=(item.revisions||[])[(item.revisions||[]).length-1]||null;
  if(latestRev){
    docPreviewRevision(item,latestRev.id).catch(()=>toast(t('打开文件失败','Open file failed'),'error'));
    return;
  }
  const linked=item.linkedFiles||[];
  const latestFile=linked[linked.length-1]||null;
  if(!latestFile){toast(t('该文件暂无索引文件','No indexed files yet'),'error');return}
  if(latestFile.fileRefId){
    docOpenByRef(latestFile.fileRefId).catch(()=>toast(t('打开文件失败','Open file failed'),'error'));
    return;
  }
  if(latestFile.backendRelPath){
    docOpenBackendFile(latestFile.packageName||pkg.name,latestFile.backendRelPath);
    return;
  }
  toast(t('该文件暂无可打开内容','No openable file content'),'error');
}
async function handleSdrImportInput(e){
  const file=e.target.files[0];
  if(!file){e.target.value='';return}
  let pkg=getActiveDocPackage();
  try{
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    let rows=[];
    const cols=[];
    wb.SheetNames.forEach(sn=>{
      const parsedSheet=docParseSheetAutoHeader(wb.Sheets[sn]);
      rows=rows.concat(parsedSheet.rows||[]);
      (parsedSheet.columns||[]).forEach(c=>{if(c&&!cols.includes(c))cols.push(c);});
    });
    if(!pkg){
      const byName=String(file.name||'').replace(/\.[^.]+$/,'').trim();
      pkg=docEnsurePackageByName(byName||'Default Package');
    }
    const parsed=docParseSdrRows(rows);
    const items=parsed.items||[];
    const nonEmptyCols=(cols.length?cols:(parsed.columns||[])).filter(c=>items.some(it=>String((it.fields||{})[c]||'').trim()));
    pkg.sdrColumns=[...new Set([...(pkg.sdrColumns||[]),...nonEmptyCols])];
    let added=0;
    items.forEach(it=>{
      const d=docUpsertItem(pkg,it);
      if(d)added++;
      if(d&&it.rev){
        const rv=String(it.rev||'').trim();
        if(rv&&!d.revisions.some(r=>String(r.rev||'')===rv))d.revisions.push({id:uid(),rev:rv,fileName:'',blobId:'',size:0,uploadedAt:nowIso(),comments:[]});
      }
    });
    pkg.updatedAt=nowIso();
    saveDocBoard();
    renderNav();
    renderDocBoard();
    toast(t(`SDR导入完成，更新 ${added} 条目录`,`SDR import done, updated ${added} rows`));
  }catch(err){
    toast(t('SDR导入失败','SDR import failed'),'error');
  }
  e.target.value='';
}
async function handleFolderImportInput(e){
  const files=[...(e.target.files||[])];
  if(!files.length){e.target.value='';return}
  const grouped={};
  files.forEach(file=>{
    const rel=String(file.webkitRelativePath||file.name||'');
    const seg=rel.split('/').filter(Boolean);
    if(!seg.length)return;
    const pkgName=seg[0];
    if(!grouped[pkgName])grouped[pkgName]=[];
    grouped[pkgName].push({fileObj:file,fileName:seg[seg.length-1]||file.name||'',relativePath:rel,size:file.size||0});
  });
  let indexed=0;
  for(const pkgName of Object.keys(grouped)){
    const pkg=docEnsurePackageByName(pkgName);
    if(!pkg)continue;
    indexed+=await docApplyIndexedFiles(pkg,grouped[pkgName],'picker');
  }
  saveDocBoard();
  renderSidebar();
  renderNav();
  renderDocBoard();
  toast(t(`已建立 ${indexed} 条文件索引`,`Built ${indexed} file index entries`));
  e.target.value='';
}
async function handlePdfBatchImportInput(e){
  const files=[...(e.target.files||[])];
  const pkg=getActiveDocPackage();
  if(!files.length||!pkg){e.target.value='';return}
  const wrapped=files.filter(f=>/\.pdf$/i.test(f.name)).map(f=>({fileObj:f,fileName:f.name,relativePath:f.name,size:f.size||0}));
  const done=await docApplyIndexedFiles(pkg,wrapped,'picker');
  pkg.updatedAt=nowIso();
  saveDocBoard();
  renderNav();
  renderDocBoard();
  toast(t(`已导入 ${done} 份PDF，并按版次归档`,`Imported ${done} PDFs with revision history`));
  e.target.value='';
}

async function handlePdfCommentImportInput(e){
  const files=[...(e.target.files||[])].filter(f=>/\.pdf$/i.test(f.name||''));
  if(!files.length){e.target.value='';return}
  const rows=[];
  for(const f of files){
    const comments=await docExtractPdfComments(f);
    const normalized=docNormalizePdfCommentEntries(f.name,comments);
    if(!normalized.length)rows.push({id:uid(),fileName:f.name,commentIndex:0,page:0,author:'',created:'',updated:'',annotationType:'',comment:t('未提取到批注文本','No comment extracted')});
    rows.push(...normalized);
  }
  docBoard.pdfComments=[...rows,...(docBoard.pdfComments||[])].slice(0,2000);
  docBoard.pdfSelected={};
  saveDocBoard();
  renderNav();
  renderCurrentView();
  toast(t(`已提取 ${rows.length} 条PDF意见`,`Extracted ${rows.length} PDF comments`));
  e.target.value='';
}
function pdfCommentSetFilter(v){
  docBoard.pdfFilter=v||'ALL';
  saveDocBoard();
  renderPdfCommentsBoard();
}
function pdfCommentToggleSelect(id,checked){
  docEnsureAuxCollections();
  if(checked)docBoard.pdfSelected[id]=1;
  else delete docBoard.pdfSelected[id];
  saveDocBoard();
}
function pdfCommentToggleSelectAll(checked,visibleRows){
  docEnsureAuxCollections();
  (visibleRows||[]).forEach(r=>{
    if(checked)docBoard.pdfSelected[r.id]=1;
    else delete docBoard.pdfSelected[r.id];
  });
  saveDocBoard();
  renderPdfCommentsBoard();
}
function pdfCommentToggleSelectAllFiltered(checked){
  docEnsureAuxCollections();
  const allRows=docBoard.pdfComments||[];
  const activeFilter=docBoard.pdfFilter||'ALL';
  const rows=activeFilter==='ALL'?allRows:allRows.filter(r=>String(r.fileName||'')===activeFilter);
  pdfCommentToggleSelectAll(checked,rows);
}
function pdfCommentExportExcel(){
  const rows=(docBoard.pdfComments||[]);
  const picked=rows.filter(r=>docBoard.pdfSelected&&docBoard.pdfSelected[r.id]);
  const source=picked.length?picked:rows;
  if(!source.length){toast(t('暂无可导出的PDF意见','No PDF comments to export'),'error');return}
  const exportRows=source.map(r=>({
    fileName:r.fileName||'',
    page:r.page||'',
    author:r.author||'',
    created:r.created||'',
    updated:r.updated||'',
    annotationType:r.annotationType||'',
    commentIndex:r.commentIndex||0,
    comment:r.comment||'',
  }));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(exportRows),'PDF_Comments');
  const pName=projects.find(p=>p.id===activeProjectId)?.name||'project';
  XLSX.writeFile(wb,`${pName}_pdf_comments_${fmtDate(new Date())}.xlsx`);
  toast(t(`PDF意见导出成功（${exportRows.length}条）`,`PDF comments exported (${exportRows.length})`));
}
function pdfCommentClear(){
  if(!confirm(t('确认清空PDF意见看板记录？','Clear PDF comments board records?')))return;
  docBoard.pdfComments=[];
  docBoard.pdfSelected={};
  docBoard.pdfFilter='ALL';
  saveDocBoard();
  renderNav();
  renderCurrentView();
}
function renderPdfCommentsBoard(){
  docEnsureAuxCollections();
  const allRows=docBoard.pdfComments||[];
  const fileOptions=[...new Set(allRows.map(r=>String(r.fileName||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const activeFilter=docBoard.pdfFilter||'ALL';
  const rows=activeFilter==='ALL'?allRows:allRows.filter(r=>String(r.fileName||'')===activeFilter);
  const selectedCount=rows.filter(r=>docBoard.pdfSelected&&docBoard.pdfSelected[r.id]).length;
  const v=document.getElementById('pdfcommentsView');
  v.innerHTML=`<div class="toolbar"><button class="btn btn-primary" onclick="document.getElementById('pdfCommentInput').click()">${IC.upload} ${t('导入PDF并提取意见','Import PDF & Extract Comments')}</button><select class="filter-select" onchange="pdfCommentSetFilter(this.value)"><option value="ALL"${activeFilter==='ALL'?' selected':''}>${t('全部文件','All Files')}</option>${fileOptions.map(f=>`<option value="${escHtml(f)}"${activeFilter===f?' selected':''}>${escHtml(f)}</option>`).join('')}</select><button class="btn btn-outline" onclick="pdfCommentExportExcel()">${IC.download} ${t('导出所选/全部','Export Selected/All')}</button><button class="btn btn-danger" onclick="pdfCommentClear()">${IC.trash} ${t('清空记录','Clear')}</button><span class="doc-meta-chip">${t('意见条目','Comment Rows')}: ${rows.length}</span><span class="doc-meta-chip">${t('已选','Selected')}: ${selectedCount}</span></div>
  <div class="table-wrap"><div class="table-scroll"><table id="pdfCommentTable"><thead><tr><th><input type="checkbox" ${rows.length&&selectedCount===rows.length?'checked':''} onchange="pdfCommentToggleSelectAllFiltered(this.checked)"></th><th>${t('文件名','File Name')}</th><th>${t('页码','Page')}</th><th>${t('注释人','Author')}</th><th>${t('时间','Time')}</th><th>${t('类型','Type')}</th><th>${t('序号','Index')}</th><th>${t('意见内容','Comment')}</th></tr></thead><tbody>
  ${rows.length?rows.map(r=>`<tr><td><input type="checkbox" ${docBoard.pdfSelected&&docBoard.pdfSelected[r.id]?'checked':''} onchange="pdfCommentToggleSelect('${r.id}',this.checked)"></td><td class="cell-id">${escHtml(r.fileName||'')}</td><td class="cell-date">${escHtml(String(r.page||''))}</td><td>${escHtml(r.author||'')}</td><td class="cell-date">${escHtml(r.updated||r.created||'')}</td><td>${escHtml(r.annotationType||'')}</td><td class="cell-date">${escHtml(String(r.commentIndex||0))}</td><td><div class="cell-text expanded">${escHtml(r.comment||'')}</div></td></tr>`).join(''):`<tr class="no-data-row"><td colspan="8" class="no-data">${IC.empty}<div>${t('暂无PDF意见数据','No PDF comment data')}</div></td></tr>`}
  </tbody></table></div><div class="table-footer"><span>${t('总计','Total')}: ${rows.length}</span></div></div>`;
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
        const sheetLower=String(name||'').toLowerCase();
        const sheetMeetingHint=/meeting|minutes|纪要|会议/.test(sheetLower);
        const sheetClarHint=/clarification|澄清|action/.test(sheetLower);
        data.forEach(row=>{
          const obj={id:uid()};const vals=Object.values(row);const keys=Object.keys(row);
          keys.forEach((k,idx)=>{const kl=k.toLowerCase();const v=vals[idx];
            if(kl.includes('priority')||kl.includes('优先级'))obj.priority=String(v);
            else if(kl.includes('discipline')||kl.includes('专业'))obj.discipline=String(v);
            else if(kl.includes('clarification')||kl.includes('澄清'))obj.clarification=String(v);
            else if(kl.includes('source')||kl.includes('来源'))obj.source=String(v);
            else if(kl.includes('reply')||kl.includes('回复'))obj.reply=String(v);
            else if(kl.includes('action by')||kl.includes('责任'))obj.actionBy=String(v);
            else if(kl.includes('status')||kl.includes('状态'))obj.status=normalizeStatus(v);
            else if(kl.includes('type')||kl.includes('类型'))obj.type=String(v);
            else if(kl.includes('subject')||kl.includes('clause')||kl.includes('议题'))obj.subject=String(v);
            else if(kl.includes('meeting date')||kl.includes('会议日期'))obj.meetingDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('planned')||kl.includes('计划'))obj.plannedDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('open date')||kl.includes('开始'))obj.openDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('due')||kl.includes('到期'))obj.currentDueDate=v instanceof Date?fmtDate(v):String(v);
            else if(kl.includes('no')||kl.includes('id')||kl.includes('编号')){obj.actionId=String(v);if(kl.includes('no'))obj.no=String(v)}
          });
          if(!obj.actionId)obj.actionId=obj.no||'';
          let meetingScore=0;
          let clarScore=0;
          if(obj.subject)meetingScore+=3;
          if(obj.plannedDate)meetingScore+=2;
          if(obj.no)meetingScore+=1;
          if(obj.priority)clarScore+=1;
          if(obj.type)clarScore+=2;
          if(obj.openDate||obj.currentDueDate)clarScore+=2;
          if(sheetMeetingHint)meetingScore+=2;
          if(sheetClarHint)clarScore+=1;
          if(meetingScore>=clarScore){
            obj.no=obj.no||obj.actionId||'';
            state.meetings.push(normalizeItem('meeting',obj));
            imported.mt++;
          }else{
            state.clarifications.push(normalizeItem('clarification',obj));
            imported.cl++;
          }
        });
      });
      refreshDuplicateSet();
      save();renderNav();renderCurrentView();
      toast(t(`导入成功: ${imported.cl}条澄清, ${imported.mt}条会议`,`Import success: ${imported.cl} clarifications, ${imported.mt} meetings`));
    }catch(err){toast(t('导入失败: ','Import failed: ')+err.message,'error')}
  };
  reader.readAsArrayBuffer(file);e.target.value='';
});
const pdfCommentInputEl=document.getElementById('pdfCommentInput');
if(pdfCommentInputEl)pdfCommentInputEl.addEventListener('change',function(e){handlePdfCommentImportInput(e)});
const sdrInputEl=document.getElementById('sdrFileInput');
if(sdrInputEl)sdrInputEl.addEventListener('change',function(e){handleSdrImportInput(e)});
document.getElementById('attachmentInput').addEventListener('change',async function(e){
  const file=e.target.files[0];
  if(file&&pendingAttachmentTarget)await attachToItem(pendingAttachmentTarget.sourceType,pendingAttachmentTarget.id,pendingAttachmentTarget.fieldKey,file);
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

function buildMainWorkbook(){
  const wb=XLSX.utils.book_new();
  if(state.clarifications.length){
    const data=state.clarifications.map(i=>({'编号 ID':i.actionId,'优先级 Priority':i.priority,'专业 Discipline':i.discipline,'类型 Type':i.type,'来源 Source':i.source,'澄清内容 Clarification':i.clarification,'回复 Reply':i.reply,'责任方 Action By':i.actionBy,'开始日期 Open Date':i.openDate,'当前到期 Due Date':i.currentDueDate,'完成日期 Completion':i.completionDate,'状态 Status':normalizeStatus(i.status),'附件数 Attachment Count':totalAttachments(i),'附件名 Attachment Names':attachmentNames(i)}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'技术澄清');
  }
  if(state.meetings.length){
    const data=state.meetings.map(i=>({'编号 No':i.no,'优先级 Priority':i.priority,'议题 Subject':i.subject,'专业 Discipline':i.discipline,'澄清 Clarification':i.clarification,'回复 Reply':i.reply,'责任方 Action By':i.actionBy,'会议日期 Meeting Date':i.meetingDate,'计划日期(Due) Due Date':i.plannedDate,'状态 Status':normalizeStatus(i.status),'附件数 Attachment Count':totalAttachments(i),'附件名 Attachment Names':attachmentNames(i)}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'会议纪要');
  }
  return wb;
}

function buildMainExportFileName(stamp){
  const pName=projects.find(p=>p.id===activeProjectId)?.name||'export';
  return `${pName}_${stamp||fmtDate(new Date())}.xlsx`;
}

function exportXlsx(customName){
  const wb=buildMainWorkbook();
  XLSX.writeFile(wb,customName||buildMainExportFileName());
  toast(t('Excel导出成功','Excel exported'));
}

const AUTO_BACKUP_CFG_KEY='et_auto_backup_cfg_v1';
const AUTO_BACKUP_DB_NAME='et_auto_backup_db';
const AUTO_BACKUP_STORE='handles';
const AUTO_BACKUP_HANDLE_KEY='main_excel_file';
const AUTO_BACKUP_INTERVAL_OPTIONS=[
  {labelZh:'5分钟',labelEn:'5 minutes',ms:5*60*1000},
  {labelZh:'10分钟',labelEn:'10 minutes',ms:10*60*1000},
  {labelZh:'30分钟',labelEn:'30 minutes',ms:30*60*1000},
  {labelZh:'2小时',labelEn:'2 hours',ms:2*60*60*1000}
];
const AUTO_BACKUP_DAILY_LIMIT_OPTIONS=[12,24,48];
let autoBackupCfg=loadAutoBackupCfg();
let autoBackupDbPromise=null;
let autoBackupFileHandle=null;
let autoBackupLastFingerprint='';
let autoBackupTimer=null;

function loadAutoBackupCfg(){
  try{
    const raw=JSON.parse(localStorage.getItem(AUTO_BACKUP_CFG_KEY)||'null');
    if(!raw||typeof raw!=='object')return{enabled:false,mode:'download',intervalMs:10*60*1000,lastBackupAt:'',maxRunsPerDay:24,runCount:0,runDate:''};
    const allowed=AUTO_BACKUP_INTERVAL_OPTIONS.map(i=>i.ms);
    const intervalMs=allowed.includes(Number(raw.intervalMs))?Number(raw.intervalMs):10*60*1000;
    const cap=Number(raw.maxRunsPerDay)||24;
    return{enabled:!!raw.enabled,mode:raw.mode==='file'?'file':'download',intervalMs,lastBackupAt:String(raw.lastBackupAt||''),maxRunsPerDay:AUTO_BACKUP_DAILY_LIMIT_OPTIONS.includes(cap)?cap:24,runCount:Math.max(0,Number(raw.runCount)||0),runDate:String(raw.runDate||'')};
  }catch(e){
    return{enabled:false,mode:'download',intervalMs:10*60*1000,lastBackupAt:'',maxRunsPerDay:24,runCount:0,runDate:''};
  }
}
function saveAutoBackupCfg(){localStorage.setItem(AUTO_BACKUP_CFG_KEY,JSON.stringify(autoBackupCfg));}
function todayKey(){return new Date().toISOString().slice(0,10)}
function normalizeAutoBackupCounter(){
  const k=todayKey();
  if(autoBackupCfg.runDate!==k){
    autoBackupCfg.runDate=k;
    autoBackupCfg.runCount=0;
    saveAutoBackupCfg();
  }
}
function markAutoBackupRun(){
  normalizeAutoBackupCounter();
  autoBackupCfg.runCount=(Number(autoBackupCfg.runCount)||0)+1;
  saveAutoBackupCfg();
}
function canRunScheduledBackup(){
  normalizeAutoBackupCounter();
  return (Number(autoBackupCfg.runCount)||0)<(Number(autoBackupCfg.maxRunsPerDay)||24);
}
function setAutoBackupMaxRuns(n){
  const val=Number(n)||24;
  autoBackupCfg.maxRunsPerDay=AUTO_BACKUP_DAILY_LIMIT_OPTIONS.includes(val)?val:24;
  saveAutoBackupCfg();
  openAutoBackupDialog();
}
function getAutoBackupIntervalLabel(){
  const m=AUTO_BACKUP_INTERVAL_OPTIONS.find(x=>x.ms===autoBackupCfg.intervalMs);
  if(!m)return t('10分钟','10 minutes');
  return t(m.labelZh,m.labelEn);
}
function startAutoBackupTimer(){
  if(autoBackupTimer){clearInterval(autoBackupTimer);autoBackupTimer=null;}
  if(!autoBackupCfg.enabled)return;
  autoBackupTimer=setInterval(()=>{
    if(!canRunScheduledBackup()){
      autoBackupCfg.enabled=false;
      saveAutoBackupCfg();
      startAutoBackupTimer();
      toast(t('已达到当日自动备份次数上限，已自动停止定时备份','Daily backup limit reached. Scheduled backup has been stopped'),'error');
      return;
    }
    runAutoBackup('interval',false).catch(()=>{});
  },autoBackupCfg.intervalMs);
}
function formatBackupStamp(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function autoBackupFingerprint(){
  const maxUpd=arr=>Array.isArray(arr)?arr.reduce((m,i)=>{const v=String((i&&i.updatedAt)||'');return v>m?v:m;},''):'';
  return JSON.stringify({
    project:activeProjectId,
    cl:state.clarifications.length,
    mt:state.meetings.length,
    tr:state.trash.length,
    clUpd:maxUpd(state.clarifications),
    mtUpd:maxUpd(state.meetings)
  });
}
function openAutoBackupDb(){
  if(autoBackupDbPromise)return autoBackupDbPromise;
  autoBackupDbPromise=new Promise((resolve,reject)=>{
    if(!window.indexedDB){resolve(null);return;}
    const req=indexedDB.open(AUTO_BACKUP_DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(AUTO_BACKUP_STORE))db.createObjectStore(AUTO_BACKUP_STORE,{keyPath:'id'})};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('open auto backup db failed'));
  });
  return autoBackupDbPromise;
}
async function saveAutoBackupHandle(handle){
  const db=await openAutoBackupDb();
  if(!db)return false;
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(AUTO_BACKUP_STORE,'readwrite');
    const req=tx.objectStore(AUTO_BACKUP_STORE).put({id:AUTO_BACKUP_HANDLE_KEY,handle,updatedAt:nowIso()});
    req.onsuccess=()=>resolve(true);
    req.onerror=()=>reject(req.error||new Error('save handle failed'));
  });
}
async function loadAutoBackupHandle(){
  const db=await openAutoBackupDb();
  if(!db)return null;
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(AUTO_BACKUP_STORE,'readonly');
    const req=tx.objectStore(AUTO_BACKUP_STORE).get(AUTO_BACKUP_HANDLE_KEY);
    req.onsuccess=()=>resolve(req.result?req.result.handle:null);
    req.onerror=()=>reject(req.error||new Error('load handle failed'));
  });
}
async function ensureFileHandlePermission(handle,requestWrite){
  if(!handle||typeof handle.queryPermission!=='function')return false;
  const opts={mode:requestWrite?'readwrite':'read'};
  try{
    let perm=await handle.queryPermission(opts);
    if(perm==='granted')return true;
    perm=await handle.requestPermission(opts);
    return perm==='granted';
  }catch(e){return false;}
}
function workbookToBlob(wb){
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  return new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function writeWorkbookToHandle(handle,wb){
  const granted=await ensureFileHandlePermission(handle,true);
  if(!granted)throw new Error('permission denied');
  const writable=await handle.createWritable();
  await writable.write(workbookToBlob(wb));
  await writable.close();
}
async function runAutoBackup(reason,allowDownloadFallback){
  if(!autoBackupCfg.enabled)return;
  if(reason==='interval'&&!canRunScheduledBackup())return;
  const fp=autoBackupFingerprint();
  const wb=buildMainWorkbook();
  if(autoBackupCfg.mode==='file'){
    if(!autoBackupFileHandle)autoBackupFileHandle=await loadAutoBackupHandle();
    if(autoBackupFileHandle){
      try{
        await writeWorkbookToHandle(autoBackupFileHandle,wb);
        autoBackupCfg.lastBackupAt=nowIso();
        autoBackupLastFingerprint=fp;
        if(reason==='interval')markAutoBackupRun();
        saveAutoBackupCfg();
        if(reason==='manual')toast(t('已写入自动备份文件','Backup file updated'));
        return;
      }catch(e){
        if(!allowDownloadFallback)return;
      }
    }
    if(!allowDownloadFallback)return;
  }
  if(autoBackupCfg.mode==='download'||allowDownloadFallback){
    XLSX.writeFile(wb,buildMainExportFileName(formatBackupStamp()));
    autoBackupCfg.lastBackupAt=nowIso();
    autoBackupLastFingerprint=fp;
    if(reason==='interval')markAutoBackupRun();
    saveAutoBackupCfg();
    if(reason==='manual'||reason==='interval')toast(t('备份已保存','Backup saved'));
  }
}
async function bindAutoBackupFile(){
  if(typeof window.showSaveFilePicker!=='function'){
    toast(t('当前环境不支持手动选择备份目录/文件，无法启用定时备份','Current environment cannot select backup destination manually; scheduled backup cannot be enabled'),'error');
    return;
  }
  const handle=await window.showSaveFilePicker({
    suggestedName:buildMainExportFileName('autosave'),
    types:[{description:'Excel Workbook',accept:{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']}}]
  });
  const granted=await ensureFileHandlePermission(handle,true);
  if(!granted){toast(t('未获得写入权限','Write permission denied'),'error');return;}
  await saveAutoBackupHandle(handle);
  autoBackupFileHandle=handle;
  autoBackupCfg.mode='file';
  saveAutoBackupCfg();
  toast(t('已绑定备份目标。启用定时后会按间隔覆盖写入该位置。','Backup destination bound. Scheduled tasks will overwrite this target.'),'info');
}
async function ensureBackupDestinationBeforeEnable(){
  if(!autoBackupFileHandle)autoBackupFileHandle=await loadAutoBackupHandle();
  if(autoBackupFileHandle)return true;
  const mustChoose=confirm(t('启用定时备份前，必须手动选择备份目录/文件位置。\n系统将按设定间隔持续写入该位置。\n点击“确定”立即选择。','Before enabling scheduled backup, you must manually choose backup destination.\nSystem will keep writing to this location by schedule.\nClick OK to choose now.'));
  if(!mustChoose)return false;
  await bindAutoBackupFile();
  if(!autoBackupFileHandle){
    toast(t('未完成备份地址选择，定时备份未开启','Backup destination not selected, schedule not enabled'),'error');
    return false;
  }
  return true;
}
async function openAutoBackupDialog(){
  const modal=document.getElementById('modal');
  const destinationText=autoBackupCfg.mode==='file'
    ? (autoBackupFileHandle?t('已绑定本地文件','Local file bound'):t('未绑定本地文件','Local file not bound'))
    : t('下载模式（每次生成新文件）','Download mode (new file each time)');
  const intervalBtns=AUTO_BACKUP_INTERVAL_OPTIONS.map(opt=>{
    const active=autoBackupCfg.enabled&&autoBackupCfg.intervalMs===opt.ms;
    return `<button class="btn ${active?'btn-primary':'btn-outline'}" style="min-width:110px;justify-content:center" onclick="setAutoBackupInterval(${opt.ms})">${t(opt.labelZh,opt.labelEn)}</button>`;
  }).join('');
  const enabledText=autoBackupCfg.enabled?t('已开启','Enabled'):t('已关闭','Disabled');
  const modeText=autoBackupCfg.mode==='file'?t('本地文件覆盖写入','Local file overwrite'):t('下载备份','Download backup');
  const lastText=autoBackupCfg.lastBackupAt?fmtDate(autoBackupCfg.lastBackupAt):t('暂无','N/A');
  const limitBtns=AUTO_BACKUP_DAILY_LIMIT_OPTIONS.map(n=>`<button class="btn ${Number(autoBackupCfg.maxRunsPerDay||24)===n?'btn-primary':'btn-outline'}" style="min-width:90px;justify-content:center" onclick="setAutoBackupMaxRuns(${n})">${t('每日上限','Daily Cap')} ${n}</button>`).join('');
  normalizeAutoBackupCounter();
  const runInfo=`${Number(autoBackupCfg.runCount)||0}/${Number(autoBackupCfg.maxRunsPerDay)||24}`;
  modal.innerHTML=`<div class="modal-content" style="max-width:780px"><div class="modal-header"><h2>${t('定时备份设置','Scheduled Backup')}</h2><button class="modal-close" onclick="closeModalPreview()">✕</button></div><div class="modal-body"><div class="storage-note">${t('风险提醒：定时备份会持续写入你手动选择的位置。建议选择专用备份目录，并设置每日写入上限。','Risk notice: scheduled backup keeps writing to your selected destination. Use a dedicated backup location and set a daily write cap.')}</div><div class="storage-grid" style="grid-template-columns:repeat(5,minmax(110px,1fr))"><div class="storage-stat"><div class="storage-k">${t('状态','Status')}</div><div class="storage-v">${enabledText}</div></div><div class="storage-stat"><div class="storage-k">${t('当前间隔','Interval')}</div><div class="storage-v">${getAutoBackupIntervalLabel()}</div></div><div class="storage-stat"><div class="storage-k">${t('备份方式','Mode')}</div><div class="storage-v" style="font-size:.82rem">${modeText}</div></div><div class="storage-stat"><div class="storage-k">${t('备份地址','Destination')}</div><div class="storage-v" style="font-size:.76rem">${destinationText}</div></div><div class="storage-stat"><div class="storage-k">${t('今日写入','Today Runs')}</div><div class="storage-v">${runInfo}</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${intervalBtns}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${limitBtns}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-outline" onclick="disableAutoBackup()">${t('关闭定时备份','Disable Schedule')}</button><button class="btn btn-outline" onclick="bindAutoBackupFileFromDialog()">${t('重新选择备份位置','Rebind Destination')}</button></div><div class="storage-note" style="margin-top:10px">${t('最近备份日期','Last Backup Date')}: ${lastText}</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModalPreview()">${t('关闭','Close')}</button></div></div>`;
  modal.classList.add('open');
}
async function setAutoBackupInterval(ms){
  const ok=await ensureBackupDestinationBeforeEnable();
  if(!ok)return;
  const confirmEnable=confirm(t('确认开启定时备份？系统将按间隔自动覆盖写入已选位置。\n如需停止，请在此面板关闭。','Enable scheduled backup now? System will overwrite the selected destination by interval.\nYou can disable it from this panel at any time.'));
  if(!confirmEnable)return;
  autoBackupCfg.enabled=true;
  autoBackupCfg.mode='file';
  autoBackupCfg.intervalMs=Number(ms)||10*60*1000;
  saveAutoBackupCfg();
  startAutoBackupTimer();
  await runAutoBackup('manual',false);
  toast(t(`已开启定时备份，间隔 ${getAutoBackupIntervalLabel()}`,`Scheduled backup enabled: ${getAutoBackupIntervalLabel()}`),'info');
  openAutoBackupDialog();
}
function disableAutoBackup(){
  autoBackupCfg.enabled=false;
  saveAutoBackupCfg();
  startAutoBackupTimer();
  toast(t('已关闭定时备份','Scheduled backup disabled'),'info');
  openAutoBackupDialog();
}
async function bindAutoBackupFileFromDialog(){
  try{await bindAutoBackupFile();}catch(e){toast(t('绑定自动备份文件失败','Bind backup file failed'),'error');}
  openAutoBackupDialog();
}
async function runManualBackupNow(){
  if(!autoBackupCfg.enabled){exportXlsx();return;}
  await runAutoBackup('manual',true);
}
async function prepareAutoBackupHandle(){
  if(autoBackupCfg.mode!=='file')return;
  try{autoBackupFileHandle=await loadAutoBackupHandle();}catch(e){autoBackupFileHandle=null;}
}
prepareAutoBackupHandle();
startAutoBackupTimer();

// ===== SAMPLE DATA =====
function importSampleData(){
  if(state.clarifications.length||state.meetings.length){if(!confirm('将覆盖现有数据，确认？'))return}
  state.clarifications=[
    {id:uid(),actionId:'1',priority:'High',discipline:'Electrical',type:'DCP',source:'Email',clarification:'Email to WISON 20240115: DCP feeder for staging and metering skid to be on same MCC as per latest SLD.',reply:'Email to BH 20240116: Wison can only provide 400VAC or 230VAC. Vendor shall provide step down transformer.',actionBy:'WISON',openDate:'2024-01-15',status:'CLOSED'},
    {id:uid(),actionId:'2',priority:'High',discipline:'Process',type:'General',source:'企业微信',clarification:'Email to WISON 20231220: Review questions from Systems Engineering team. Booster compressor requirement and seal gas system design confirmation.',reply:'WISON REPLY 20240123: Booster is required and confirmed. Seal gas - treated feed gas 64barg.',actionBy:'WISON',openDate:'2023-12-20',status:'CLOSED'},
    {id:uid(),actionId:'3',priority:'Medium',discipline:'Process',type:'PID',source:'会议',clarification:'P&ID review query: seal gas pressure and temperature at battery limit needed.',reply:'WISON REPLY 20240117: Process will provide seal gas P&T in battery limit. Update in next P&ID rev.',actionBy:'WISON',openDate:'2024-01-12',status:'CLOSED'},
    {id:uid(),actionId:'4',priority:'High',discipline:'Instrument',type:'Datasheet',source:'Email',clarification:'Gas detector type/location for MRC area. SIL rating for ESD valves.',reply:'BH to provide spec. SIL 2 confirmed for all ESD valves.',actionBy:'BH',openDate:'2024-02-15',currentDueDate:'2024-04-30',status:'CLOSED'},
    {id:uid(),actionId:'5',priority:'Medium',discipline:'Mechanical',type:'Spec',source:'企业微信',clarification:'Vibration monitoring: online vs portable. API 670 compliance level.',reply:'',actionBy:'BH',openDate:'2024-03-01',currentDueDate:'2024-06-15',status:'OPEN'},
    {id:uid(),actionId:'6',priority:'High',discipline:'Process',type:'General',source:'会议',clarification:'N2 purge case for MRC commissioning. Define purge volume and flow rate.',reply:'',actionBy:'WISON',openDate:'2024-06-24',currentDueDate:'2024-09-30',status:'OPEN'},
    {id:uid(),actionId:'7',priority:'Low',discipline:'Piping',type:'Drawing',source:'Email',clarification:'Piping GA review: nozzle orientation, pipe supports, anti-vibration design.',reply:'BH provided updated GA rev.B on 20240520.',actionBy:'BH',openDate:'2024-04-10',status:'CLOSED'},
    {id:uid(),actionId:'8',priority:'High',discipline:'Electrical',type:'Spec',source:'企业微信',clarification:'MCC interfaces with UCP. BH to send AC motor typicals first.',reply:'BH shared by emails. Wison reviewing.',actionBy:'BH',openDate:'2024-06-24',currentDueDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),actionId:'9',priority:'Medium',discipline:'HVAC',type:'General',source:'会议',clarification:'WHRU tags and limit switch positions for dampers. Exhaust duct volume and heat recovery data.',reply:'Wison reply 20240705: WHRU tag 25-PKG-003_WHR-001. Limit switch details provided.',actionBy:'WISON',openDate:'2024-06-24',currentDueDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),actionId:'10',priority:'High',discipline:'Process',type:'Datasheet',source:'Email',clarification:'Gas turbine performance datasheet: ambient temp correction and site derating.',reply:'',actionBy:'BH',openDate:'2024-07-15',currentDueDate:'2024-10-30',status:'IN_PROGRESS'},
  ];
  state.meetings=[
    {id:uid(),no:'1',priority:'High',subject:'Hazop meeting date',discipline:'Process',clarification:'Wison to share official email about Hazop date.',reply:'Confirmed 2Sep-6Sep 2024 for MRC package.',actionBy:'WISON',meetingDate:'2024-06-28',plannedDate:'2024-06-28',status:'CLOSED'},
    {id:uid(),no:'2',priority:'Medium',subject:'MCC interfaces',discipline:'Electrical',clarification:'MCC-UCP interfaces. BH to send AC motor typicals.',reply:'BH shared by emails.',actionBy:'BH',meetingDate:'2024-07-05',plannedDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),no:'3',priority:'Medium',subject:'WHRU tags',discipline:'HVAC',clarification:'WHRU tags and limit switch positions for dampers.',reply:'Wison reply 20240705: tag 25-PKG-003_WHR-001.',actionBy:'WISON',meetingDate:'2024-07-05',plannedDate:'2024-07-05',status:'CLOSED'},
    {id:uid(),no:'4',priority:'High',subject:'N2 purge commissioning',discipline:'Process',clarification:'N2 purge case for MRC commissioning shall be confirmed by Wison.',reply:'',actionBy:'WISON',meetingDate:'2024-06-24',plannedDate:'2024-09-30',status:'OPEN'},
    {id:uid(),no:'5',priority:'High',subject:'Exhaust duct volume',discipline:'Process',clarification:'Exhaust duct volume and heat recovery. BH confirm purge time.',reply:'WISON reply 20240722: refer to clarification item 85.',actionBy:'WISON',meetingDate:'2024-06-24',plannedDate:'2024-10-30',status:'OPEN'},
    {id:uid(),no:'Gen-1',priority:'Low',subject:'Seal gas system',discipline:'Process',clarification:'TA P15 No.32 seal gas external source. Booster evaluation.',reply:'Treated feed gas 64barg, 39°C. Settle out 29barg.',actionBy:'WISON',meetingDate:'2023-12-15',plannedDate:'2023-12-15',status:'CLOSED'},
    {id:uid(),no:'Gen-2',priority:'Medium',subject:'Backup time UPS',discipline:'Electrical',clarification:'TA p9 No.9 backup time from UPS system.',reply:'Min 180min for GT cool down. Emergency generator provides AC.',actionBy:'BH',meetingDate:'2023-12-15',plannedDate:'2023-12-15',status:'CLOSED'},
    {id:uid(),no:'Gen-4',priority:'Medium',subject:'Terminal box material',discipline:'Electrical',clarification:'TA p18 No.46 ex-n availability. 316L material confirmation.',reply:'Zone 2 confirmed. Ex-e in 316SS. Impact check pending.',actionBy:'BH',meetingDate:'2023-12-15',plannedDate:'2023-12-15',status:'CLOSED'},
  ];
  migrateData();
  refreshDuplicateSet();
  state.actions=[];save();renderNav();renderCurrentView();toast('示例数据已导入');
}

function renderOverview(){
  const totalProjects=(projects||[]).length;
  const openItems=getAllOpenItems();
  const overdueItems=openItems.filter(isOverdue);
  const highItems=openItems.filter(i=>String(i.priority||'').toUpperCase()==='HIGH');
  const hasBusinessData=(state.clarifications.length+state.meetings.length)>0;
  const projectPackages=(projects||[]).map(p=>{
    const board=getProjectDocBoardSnapshot(p.id);
    const pkgs=(board.packages||[]);
    return{name:p.name||'',count:pkgs.length,names:pkgs.map(x=>x.name||'').filter(Boolean)};
  });
  const ownerRisk=buildOwnerRisk().slice(0,8);
  const v=document.getElementById('overviewView');
  v.innerHTML=`
  <div class="kpi-row" style="margin-top:10px">
    <div class="kpi-card card-open"><div class="kpi-label">${t('待处理行动','Open Actions')}</div><div class="kpi-value">${openItems.length}</div><div class="kpi-sub">${t('澄清+会议聚合','Clarification + Meeting')}</div></div>
    <div class="kpi-card card-overdue"><div class="kpi-label">${t('逾期项','Overdue')}</div><div class="kpi-value">${overdueItems.length}</div><div class="kpi-sub">${t('优先处理','Prioritize')}</div></div>
    <div class="kpi-card card-high"><div class="kpi-label">${t('高优先级','High Priority')}</div><div class="kpi-value">${highItems.length}</div><div class="kpi-sub">${t('未关闭','Not Closed')}</div></div>
  </div>
  <div class="charts-row" style="align-items:stretch">
    <div class="chart-box" style="flex:1.6;min-width:380px;height:auto;min-height:0"><h3>${t('项目与设备包总览','Project-Package Overview')}</h3><div class="table-scroll" style="max-height:none"><table><thead><tr><th>${t('项目','Project')}</th><th>${t('设备包数量','Package Count')}</th><th>${t('设备包清单','Packages')}</th></tr></thead><tbody>${projectPackages.length?projectPackages.map(p=>`<tr><td>${escHtml(p.name||'-')}</td><td class="cell-date">${p.count}</td><td><div class="cell-text expanded">${escHtml(p.names.join(', ')||t('暂无设备包','No packages'))}</div></td></tr>`).join(''):`<tr><td colspan="3" class="no-data">${t('暂无项目','No projects')}</td></tr>`}</tbody></table></div></div>
    <div class="chart-box" style="flex:.9;min-width:260px;height:auto;min-height:0"><h3>${t('快捷入口','Quick Entry')}</h3><div style="display:grid;gap:8px;grid-template-columns:1fr"><button class="btn btn-primary" onclick="switchTab('action')">${t('进入行动项','Open Actions')}</button><button class="btn btn-outline" onclick="switchTab('clarification')">${t('新增技术澄清','New Clarification')}</button><button class="btn btn-outline" onclick="switchTab('meeting')">${t('新增会议纪要','New Meeting')}</button></div>${!hasBusinessData?`<div style="margin-top:10px;padding:10px;border:1px dashed var(--border-light);border-radius:8px;background:var(--bg-hover)"><div style="font-size:.74rem;color:var(--text-secondary);line-height:1.5">${t('当前项目暂无业务记录，可先加载示例或导入历史Excel。','No business records yet. Load sample or import historical Excel first.')}</div><div style="display:grid;gap:6px;grid-template-columns:1fr;margin-top:8px"><button class="btn btn-outline" onclick="importSampleData()">${t('加载示例数据','Load Sample')}</button><button class="btn btn-outline" onclick="document.getElementById('xlsxFileInput').click()">${t('导入Excel','Import Excel')}</button><button class="btn btn-outline" onclick="showQuickGuide()">${t('查看快速说明','Open Quick Guide')}</button></div></div>`:''}</div>
  </div>
  <div class="chart-box"><h3>${t('责任方风险 Top8','Owner Risk Top8')}</h3><div class="table-scroll" style="max-height:220px"><table><thead><tr><th>${t('责任方','Owner')}</th><th>${t('未关闭','Open')}</th><th>${t('逾期','Overdue')}</th><th>${t('高优先级','High')}</th><th>${t('风险分','Score')}</th></tr></thead><tbody>${ownerRisk.length?ownerRisk.map(r=>`<tr><td>${escHtml(r.owner)}</td><td>${r.open}</td><td>${r.overdue}</td><td>${r.high}</td><td class="cell-date">${r.score}</td></tr>`).join(''):`<tr><td colspan="5" class="no-data">${t('暂无风险数据','No risk data')}</td></tr>`}</tbody></table></div></div>
  `;
}

// ===== RENDER =====
function renderCurrentView(){
  if(state.currentTab==='overview')renderOverview();
  else if(state.currentTab==='dashboard')renderDashboard();
  else if(state.currentTab==='clarification')renderClarifications();
  else if(state.currentTab==='action')renderActions();
  else if(state.currentTab==='meeting')renderMeetings();
  else if(state.currentTab==='pdfcomments')renderPdfCommentsBoard();
  else if(state.currentTab==='recycle')renderRecycle();
  else{state.currentTab='overview';renderOverview();}
}
function renderAll(){renderSidebar();renderHeader();renderNav();renderCurrentView()}

// ===== INIT =====
bootstrapApp();
