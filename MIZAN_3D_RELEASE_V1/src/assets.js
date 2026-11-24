import * as T from 'three';
import {assets,categories,referenceDate,money,isMaintenanceDue,filterAssets,summarizeAssets,createAssetCsv} from './asset-data.js';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createAssetModule({model,scene,camera,renderer,onFocus,onReveal,onMode,getHighlightEnabled=()=>true}) {
  const state={query:'',category:'all',selectedId:null,lastExport:null};
  const byId=new Map(assets.map(a=>[a.id,a]));
  for(const a of assets)if(!model.assetObjects.has(a.id))throw new Error(`Missing model object for ${a.id}`);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  const outline=new T.Box3Helper(new T.Box3(),0xd8bb7f);outline.visible=false;outline.material.depthTest=false;outline.material.transparent=true;outline.material.opacity=.7;outline.renderOrder=10;scene.add(outline);
  let panel=null,highlighted=[];
  const filtered=()=>filterAssets(assets,state.query,state.category);
  function clearHighlight(){for(const o of highlighted){if(o.material===o.userData.selectionMaterial)o.material=o.userData.selectionBase;o.userData.selectionMaterial?.dispose();delete o.userData.selectionMaterial;delete o.userData.selectionBase;}highlighted=[];outline.visible=false;}
  function update(){
    if(!state.selectedId)return;
    const highlightEnabled=getHighlightEnabled();
    if(!highlightEnabled&&highlighted.length)clearHighlight();
    const group=model.assetObjects.get(state.selectedId);
    let visible=true;for(let ancestor=group;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)visible=false;
    outline.visible=visible;if(visible)outline.box.setFromObject(group).expandByScalar(.09);
    if(!highlightEnabled)return;
    group.traverse(o=>{if(!o.isMesh)return;if(o.material!==o.userData.selectionMaterial){o.userData.selectionMaterial?.dispose();o.userData.selectionBase=o.material;const material=o.material.clone();material.emissive.set(0x927044);material.emissiveIntensity=.45;o.userData.selectionMaterial=material;o.material=material;if(!highlighted.includes(o))highlighted.push(o);}});
  }
  function select(id,{focus=true}={}){
    const asset=byId.get(id);if(!asset)return false;
    clearHighlight();state.selectedId=id;onReveal(asset);onMode();update();
    renderResults();renderRecord();
    if(panel?.querySelector('#asset-record'))panel.scrollTo({top:panel.querySelector('#asset-record').offsetTop-16,behavior:'smooth'});
    if(focus)onFocus(asset,model.assetObjects.get(id));
    return true;
  }
  function clear(){clearHighlight();state.selectedId=null;renderResults();renderRecord();}
  function mount(element){
    panel=element;
    panel.innerHTML=`<p class="eyebrow">02 / ASSET INTELLIGENCE</p><h2>Assets, in context.</h2><span class="badge">FICTIONAL DEMONSTRATION</span><p class="asset-intro">Select the model or a register entry. Every record is linked to a physical object.</p><div class="asset-summary" id="asset-summary"></div><p class="snapshot">Register snapshot · 23 Nov 2026<br>Annual costs are illustrative estimates.</p><label class="section-title" for="asset-search">FIND AN ASSET</label><input id="asset-search" type="search" autocomplete="off" placeholder="Name, ID, location or role" value="${escapeHtml(state.query)}"><label class="sr-only" for="asset-category">Filter asset category</label><select id="asset-category"><option value="all">All categories</option>${categories.map(c=>`<option value="${escapeHtml(c)}" ${c===state.category?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select><div class="register-toolbar"><span id="asset-result-count" role="status"></span><button id="asset-export">Export shown · CSV</button></div><div id="asset-list" class="asset-list" aria-label="Asset register"></div><section id="asset-record" class="asset-record" aria-label="Selected asset record" aria-live="polite"></section><p id="export-status" class="snapshot" role="status"></p>`;
    const search=panel.querySelector('#asset-search');search.oninput=()=>{state.query=search.value;renderResults();};
    panel.querySelector('#asset-category').onchange=e=>{state.category=e.target.value;renderResults();};
    panel.querySelector('#asset-export').onclick=download;
    renderResults();renderRecord();panel.scrollTop=0;
  }
  function renderResults(){
    if(!panel?.isConnected||!panel.querySelector('#asset-list'))return;
    const summary=summarizeAssets(assets);panel.querySelector('#asset-summary').innerHTML=`<div><strong>${summary.count}</strong><span>Registered assets</span></div><div><strong>${money(summary.acquisitionCost)}</strong><span>Acquisition value</span></div><div><strong>${money(summary.annualOperatingCost)}</strong><span>Est. annual operation</span></div><div><strong>${summary.maintenanceDue}</strong><span>Maintenance due*</span></div>`;
    const records=filtered();panel.querySelector('#asset-result-count').textContent=`${records.length} of ${assets.length} shown`;
    panel.querySelector('#asset-export').disabled=records.length===0;
    panel.querySelector('#asset-list').innerHTML=records.length?records.map(a=>`<button class="asset-row ${a.id===state.selectedId?'selected':''}" data-asset-id="${a.id}" aria-pressed="${a.id===state.selectedId}"><span class="asset-row-title">${escapeHtml(a.name)} <span aria-hidden="true">↗</span></span><small>${a.id} · ${escapeHtml(a.category)}</small>${isMaintenanceDue(a)?'<span class="due-tag">Maintenance due</span>':''}</button>`).join(''):'<p class="empty-state">No matching assets. Try another search or category.</p>';
    panel.querySelectorAll('[data-asset-id]').forEach(button=>button.onclick=()=>select(button.dataset.assetId));
  }
  function renderRecord(){
    const element=panel?.querySelector('#asset-record');if(!element)return;
    const a=byId.get(state.selectedId);
    if(!a){element.innerHTML='<p class="selection-hint">Click a visible asset to inspect its record, or choose one above to focus the camera.</p><p class="snapshot">*Due when next maintenance date is on or before the fictional snapshot date.</p>';return;}
    const fields=[['Asset ID',a.id],['Category',a.category],['Physical location',a.location],['Acquisition cost',money(a.acquisitionCost)],['Acquisition date',a.acquisitionDate],['Estimated useful life',`${a.usefulLifeYears} years`],['Warranty',a.warrantyStatus],['Next maintenance',a.nextMaintenanceDate+(isMaintenanceDue(a)?' · DUE':'')],['Est. annual operating cost',`${money(a.annualOperatingCost)} / year`],['Responsible role',a.responsibleRole],['Inspection status',a.inspectionStatus]];
    element.innerHTML=`<button class="back-register" id="back-register">← Back to register</button><div class="record-title"><p class="eyebrow">SELECTED / ${a.id}</p><button id="clear-asset" aria-label="Clear selected asset">×</button></div><h3>${escapeHtml(a.name)}</h3><p class="record-note">Fictional record · estimates for demonstration only.</p><button id="focus-asset" class="focus-asset">↗ Focus physical asset</button><dl>${fields.map(([label,value])=>`<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><h4>Maintenance history</h4><ol class="maintenance-history">${a.maintenanceHistory.map(h=>`<li><time>${h.date}</time><strong>${escapeHtml(h.work)} · ${money(h.cost)}</strong><span>${escapeHtml(h.result)}</span></li>`).join('')}</ol><p class="snapshot">Snapshot ${referenceDate}. No live institution or measured operating costs.</p>`;
    element.querySelector('#back-register').onclick=()=>panel.scrollTo({top:0,behavior:'smooth'});element.querySelector('#clear-asset').onclick=clear;element.querySelector('#focus-asset').onclick=()=>select(a.id);
  }
  function download(){
    const records=filtered(),csv=createAssetCsv(records),filename='mizan-fictional-assets-2026-11-23.csv';
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    state.lastExport={filename,csv,count:records.length};
    if(panel?.querySelector('#export-status'))panel.querySelector('#export-status').textContent=`Exported ${records.length} fictional demonstration records.`;
    return state.lastExport;
  }
  function pick(clientX,clientY){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    camera.updateMatrixWorld();model.root.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);
    const targets=[];model.root.traverseVisible(o=>{if(o.isMesh&&!(o.material.transparent&&o.material.opacity<.25))targets.push(o);});
    const hit=raycaster.intersectObjects(targets,false)[0];return hit?.object.userData.assetId||null;
  }
  let down=null;
  renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0)down={x:e.clientX,y:e.clientY,id:e.pointerId};});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(moved>6||e.button!==0)return;const id=pick(e.clientX,e.clientY);if(id)select(id,{focus:false});});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  return {state,mount,select,clear,releaseHighlight:clearHighlight,update,pick,filtered,download,assets,referenceDate,summary:()=>summarizeAssets(assets),createCsv:()=>createAssetCsv(filtered()),outline};
}
