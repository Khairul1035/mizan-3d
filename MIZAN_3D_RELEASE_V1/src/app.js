import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildMosque} from './model.js';
import {project,modeDefinitions} from './data.js';
import {createAssetModule} from './assets.js';
import {createCostModule} from './costs.js';

const $=s=>document.querySelector(s),viewport=$('#viewport');
try { init(); } catch(error) { if($('#loading'))$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent=`The 3D preview could not start: ${error.message}. Use a WebGL 2 capable browser with hardware acceleration enabled.`;console.error(error); }
function init(){
  const scene=new T.Scene();scene.background=new T.Color(0x10191c);scene.fog=new T.FogExp2(0x10191c,.008);scene.environmentIntensity=.65;
  const camera=new T.PerspectiveCamera(36,1,.1,250);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;viewport.append(renderer.domElement);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=3;controls.maxDistance=95;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,4,0);
  const model=buildMosque();scene.add(model.root);
  const ground=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0x080e11,roughness:1,envMapIntensity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-2.35;ground.receiveShadow=true;scene.add(ground);
  const ambient=new T.HemisphereLight(0xc8d6dd,0x292d26,.65);scene.add(ambient);
  function area(color,intensity,x,y,z){const light=new T.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);return light;}
  const key=area(0xffefd3,2.5, -15,28,18);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-24,right:24,top:25,bottom:-22,near:1,far:90});key.shadow.bias=-.00015;key.shadow.normalBias=.018;key.shadow.radius=2;
  const fill=area(0x9ac3d3,.65,20,15,-12);const rim=area(0xffdeaa,1.1,-10,10,-20);
  const hallLight=new T.PointLight(0xffd495,38,24,2);hallLight.position.set(0,4.8,0);scene.add(hallLight);
  const aisleLights=[-5,5].map(x=>{const l=new T.PointLight(0xffdcac,12,12,2);l.position.set(x,4.2,2);scene.add(l);return l;});
  const state={mode:'Architecture',explode:0,targetExplode:0,cutaway:false,isolation:'all',labels:false,lighting:'studio',quality:'balanced'};
  let cameraMove=null;
  const presets={exterior:{position:[34,25,36],target:[0,4,0]},exploded:{position:[42,32,44],target:[0,7,0]},interior:{position:[1,3.5,5.8],target:[0,3,-5.8]},top:{position:[0,48,.1],target:[0,0,0]}};
  function cameraPreset(name,instant=false){const p=presets[name];document.body.classList.remove('asset-focused');document.body.classList.toggle('interior-view',name==='interior');cameraMove={from:camera.position.clone(),to:new T.Vector3(...p.position),fromTarget:controls.target.clone(),toTarget:new T.Vector3(...p.target),start:performance.now(),duration:instant?0:1100};document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===name));if(name==='interior')setCutaway(true);}
  controls.addEventListener('start',()=>{cameraMove=null;document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));});
  function setExplosion(value){state.targetExplode=Math.max(0,Math.min(1,Number(value)));if($('#explode-slider'))$('#explode-slider').value=state.targetExplode*100;}
  function restoreTransforms(){for(const c of model.components){c.group.position.copy(c.original.position);c.group.quaternion.copy(c.original.quaternion);c.group.scale.copy(c.original.scale);}}
  function setCutaway(enabled){state.cutaway=enabled;for(const c of model.components.filter(c=>['roof','envelope','ablution'].includes(c.id)))c.group.traverse(o=>{if(!o.isMesh||(c.id==='ablution'&&o.userData.assetId))return;if(enabled){if(!o.userData.cutawayMaterial){o.userData.cutawayMaterial=o.userData.originalMaterial.clone();Object.assign(o.userData.cutawayMaterial,{transparent:true,opacity:c.id==='envelope'?.2:.12,depthWrite:false});}o.material=o.userData.cutawayMaterial;o.castShadow=false;}else{o.material=o.userData.originalMaterial;o.castShadow=true;}});if($('#cutaway'))$('#cutaway').checked=enabled;}
  function isolate(id){state.isolation=id;model.components.forEach(c=>{c.group.visible=id==='all'||id===c.id;});const c=model.components.find(c=>c.id===id);if($('#component-note'))$('#component-note').textContent=c?c.description:'Eight coordinated component groups. Choose one for focused inspection.';}
  function lighting(name){state.lighting=name;const night=name==='night';key.intensity=night?.16:name==='daylight'?3.2:2.5;fill.intensity=night?.18:.65;rim.intensity=night?.4:1.1;ambient.intensity=night?.12:.65;hallLight.intensity=night?95:38;aisleLights.forEach(l=>l.intensity=night?28:12);scene.environmentIntensity=night?.22:.65;scene.background.set(night?0x080f18:0x10191c);renderer.toneMappingExposure=night?1.05:.9;document.querySelectorAll('[data-light]').forEach(b=>b.classList.toggle('active',b.dataset.light===name));}
  function quality(value){state.quality=value;renderer.setPixelRatio(value==='high'?Math.min(devicePixelRatio,2):value==='low'?1:Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=value!=='low';resize();}
  function architecturePanel(){return `<p class="eyebrow">01 / SPATIAL EXPLORER</p><h2>Built to be understood.</h2><p>Separate the layers. Discover the systems that make the space work.</p><div class="actions"><button id="explode" class="primary">↗ Explode</button><button id="assemble">↙ Reassemble</button></div><label class="section-title" for="explode-slider"><span>LAYER SEPARATION</span><span id="explode-value">${Math.round(state.explode*100)}%</span></label><input id="explode-slider" aria-label="Layer separation" type="range" min="0" max="100" step="1" value="${state.targetExplode*100}"><label class="check"><input id="cutaway" type="checkbox" ${state.cutaway?'checked':''}> Transparent cutaway</label><label class="check"><input id="technical-labels" type="checkbox" ${state.labels?'checked':''}> Component labels</label><label class="section-title" for="isolate">COMPONENT INSPECTION</label><select id="isolate"><option value="all">Complete building</option>${model.components.map(c=>`<option value="${c.id}" ${state.isolation===c.id?'selected':''}>${c.name}</option>`).join('')}</select><p id="component-note">Eight coordinated component groups. Choose one for focused inspection.</p><div class="section-title">LIGHTING ENVIRONMENT</div><div class="lighting">${['studio','daylight','night'].map(n=>`<button data-light="${n}" class="${state.lighting===n?'active':''}">${n[0].toUpperCase()+n.slice(1)}</button>`).join('')}</div><label class="section-title" for="quality">RENDER QUALITY</label><select id="quality"><option value="balanced">Balanced · shadows</option><option value="high">High · native resolution</option><option value="low">Low · no shadows</option></select><hr><div class="metadata"><span>Model system</span><strong>Procedural / local</strong><span>Coordinated layers</span><strong>08</strong><span>Data status</span><strong>Fictional concept</strong></div>`;}
  function showMode(mode){
    if(state.mode==='Costs'&&mode!=='Costs'){assetModule.releaseHighlight();costModule.setActive(false);}
    $('#panel').scrollTop=0;
    state.mode=mode;document.body.classList.toggle('assets-view',mode==='Assets');document.body.classList.toggle('costs-view',mode==='Costs');
    document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode);});
    if(mode==='Assets'){assetModule.mount($('#panel'));resize();return;}
    if(mode==='Costs'){costModule.setActive(true);costModule.mount($('#panel'));resize();return;}
    if(mode!=='Architecture'){
      const def=modeDefinitions[mode];$('#panel').innerHTML=`<p class="eyebrow">INTELLIGENCE / ${mode.toUpperCase()}</p><h2>${def.title}</h2><span class="badge">PLANNED · NOT IMPLEMENTED</span><p>${def.description}</p><hr><div class="planned">Phase 2 refines architecture and connects fictional asset records. This module is reserved for a later phase.</div><p>${def.planned.map(t=>'• '+t).join('<br>')}</p><hr><p>No live records, computed savings or allocation results are available here.</p><button id="back-architecture">Return to architecture</button>`;
      $('#back-architecture').onclick=()=>showMode('Architecture');resize();return;
    }
    $('#panel').innerHTML=architecturePanel();
    $('#explode').onclick=()=>{setExplosion(1);cameraPreset('exploded');};
    $('#assemble').onclick=()=>{setExplosion(0);cameraPreset('exterior');};
    $('#explode-slider').oninput=e=>setExplosion(e.target.value/100);
    $('#cutaway').onchange=e=>setCutaway(e.target.checked);
    $('#technical-labels').onchange=e=>{state.labels=e.target.checked;};
    $('#isolate').onchange=e=>isolate(e.target.value);
    $('#quality').value=state.quality;$('#quality').onchange=e=>quality(e.target.value);
    document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>lighting(b.dataset.light));
    isolate(state.isolation);resize();
  }
  function focusAsset(asset,object){
    model.root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
    const radius=Math.max(size.length()*.5,.45);
    const distance=Math.max(3.6,radius/Math.sin(T.MathUtils.degToRad(camera.getEffectiveFOV()*.5))*1.35);
    const direction=asset.componentId==='interior'?new T.Vector3(.22,.18,1):asset.componentId==='ablution'?new T.Vector3(-1,.24,.4):new T.Vector3(1,.6,1);
    const destination=center.clone().addScaledVector(direction.normalize(),distance);
    document.body.classList.add('asset-focused');document.body.classList.remove('interior-view');
    cameraMove={from:camera.position.clone(),to:destination,fromTarget:controls.target.clone(),toTarget:center,start:performance.now(),duration:1000};
    document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));
  }
  const assetModule=createAssetModule({model,scene,camera,renderer,onFocus:focusAsset,
    onReveal:asset=>{isolate('all');setCutaway(['interior','ablution'].includes(asset.componentId));},
    getHighlightEnabled:()=>state.mode!=='Costs',
    onMode:()=>{if(state.mode==='Costs')costModule.onAssetSelected(assetModule.state.selectedId);else if(state.mode!=='Assets')showMode('Assets');}
  });
  const costModule=createCostModule({model,assetModule});
  const labelElements=model.components.map(c=>{const el=document.createElement('span');el.className='model-label';el.textContent=c.name;$('#labels').append(el);return {c,el};});
  const anchors={foundation:[0,-1,8],floor:[7,1,10],interior:[0,4,2],envelope:[-7,5,6],roof:[0,11,0],minarets:[-10.6,13,9],ablution:[-11,4,0],services:[11,3,-4]};
  function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const mobile=w<700;const left=mobile?16:w<1100?210:310;const right=mobile?16:state.mode==='Costs'?380:state.mode==='Assets'?348:w<1100?255:300;const safeWidth=Math.max(w*.35,w-left-right);camera.zoom=mobile?Math.max(.34,Math.min(.6,w/h*.82)):Math.min(1,safeWidth/(h*1.1));const centerX=mobile?w/2:(left+w-right)/2;const centerY=mobile?h*.41:h*.49;camera.setViewOffset(w,h,w/2-centerX,h/2-centerY,w,h);camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(viewport);resize();
  function reset(){assetModule.clear();setExplosion(0);setCutaway(false);isolate('all');state.labels=false;lighting('studio');showMode('Architecture');cameraPreset('exterior');}
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>showMode(b.dataset.mode));document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>cameraPreset(b.dataset.camera));$('#reset').onclick=reset;
  $('#help').onclick=()=>{const dialog=$('#help-dialog');dialog.showModal();dialog.scrollTop=0;};$('#about-button').onclick=()=>{const dialog=$('#help-dialog');dialog.showModal();$('#about-section').scrollIntoView({block:'start'});};$('#close-help').onclick=()=>$('#help-dialog').close();$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{ $('#scene-state').textContent='FULLSCREEN UNAVAILABLE'; }};
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||$('#help-dialog').open)return;if(e.key.toLowerCase()==='r')reset();if(e.key.toLowerCase()==='e')setExplosion(state.targetExplode>.5?0:1);});
  let last=performance.now();
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
    state.explode=T.MathUtils.damp(state.explode,state.targetExplode,5,dt);
    if(Math.abs(state.explode-state.targetExplode)<.0002)state.explode=state.targetExplode;
    for(const c of model.components)c.group.position.copy(c.original.position).addScaledVector(c.offset,state.explode);
    if(state.explode===0&&state.targetExplode===0)restoreTransforms();
    if(cameraMove){const t=cameraMove.duration===0?1:Math.min((now-cameraMove.start)/cameraMove.duration,1);const eased=t*t*(3-2*t);camera.position.lerpVectors(cameraMove.from,cameraMove.to,eased);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.toTarget,eased);if(t===1)cameraMove=null;}
    controls.update();costModule.updateMap();assetModule.update();renderer.render(scene,camera);
    if($('#explode-value'))$('#explode-value').textContent=`${Math.round(state.explode*100)}%`;
    $('#scene-state').textContent=state.explode===0?'ASSEMBLED':state.explode===1?'EXPLODED':`SEPARATING · ${Math.round(state.explode*100)}%`;
    labelElements.forEach(({c,el})=>{el.hidden=!state.labels||!c.group.visible;if(el.hidden)return;const p=new T.Vector3(...anchors[c.id]).add(c.group.position).project(camera);el.style.left=`${(p.x*.5+.5)*viewport.clientWidth}px`;el.style.top=`${(-p.y*.5+.5)*viewport.clientHeight}px`;el.hidden=p.z>1||p.z< -1;});
    requestAnimationFrame(frame);
  }
  showMode('Architecture');cameraPreset('exterior',true);$('#loading').remove();requestAnimationFrame(frame);
  const view=new URLSearchParams(location.search).get('view');
  if(view==='exploded'){setExplosion(1);cameraPreset('exploded',true);}
  if(view==='interior')cameraPreset('interior',true);
  if(view==='cutaway')setCutaway(true);
  if(view==='night')lighting('night');
  if(view==='costs')showMode('Costs');
  // Local diagnostic API for the real scene and fictional asset register.
  window.mizan={state,model,camera,controls,renderer,scene,project,assetModule,costModule,setExplosion,setCutaway,isolate,cameraPreset,showMode,reset,restoreTransforms,ready:true};
  const runTestsButton=$('#run-tests');if(runTestsButton)runTestsButton.onclick=async()=>{const {runChecks}=await import('../tests/browser-checks.js');$('#test-results').textContent='Running…';const results=await runChecks(window.mizan);$('#test-results').textContent=results.map(r=>`${r.pass?'PASS':'FAIL'} ${r.name}`).join('\n');};
  if(runTestsButton&&new URLSearchParams(location.search).has('test'))import('../tests/browser-checks.js').then(async({runChecks})=>{const results=await runChecks(window.mizan);const output=document.createElement('pre');output.id='automated-results';output.textContent=JSON.stringify(results);document.body.append(output);document.title=results.every(r=>r.pass)?'MIZAN TEST PASS':'MIZAN TEST FAIL';});
}
