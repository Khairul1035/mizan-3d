import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

export function buildMosque() {
  const root = new T.Group(); root.name='Al-Mizan Mosque';
  const components=[];const assetObjects=new Map();
  function asset(parent,id){const group=new T.Group();group.name=id;group.userData.assetId=id;parent.add(group);return group;}
  // Procedural stone grain: deterministic and local, no downloaded imagery.
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#ddd5c2';ctx.fillRect(0,0,512,512);
  let seed=79;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<160;i++){ctx.beginPath();ctx.strokeStyle=`rgba(100,87,65,${.025+random()*.12})`;ctx.lineWidth=.3+random()*1.1;const y=random()*512;ctx.moveTo(0,y);ctx.bezierCurveTo(160,y+random()*70,290,y-35,512,y+60);ctx.stroke();}
  const marbleTex=new T.CanvasTexture(canvas);marbleTex.colorSpace=T.SRGBColorSpace;marbleTex.wrapS=marbleTex.wrapT=T.RepeatWrapping;marbleTex.repeat.set(2,2);
  const mat={
    stone:new T.MeshStandardMaterial({color:0xd3cab4,map:marbleTex,roughness:.43,metalness:.02}),
    trim:new T.MeshStandardMaterial({color:0xd4c8ae,map:marbleTex,roughness:.4}),
    gold:new T.MeshStandardMaterial({color:0xc1ab7b,metalness:.8,roughness:.33}),
    bronze:new T.MeshStandardMaterial({color:0x63523a,metalness:.75,roughness:.4}),
    dome:new T.MeshPhysicalMaterial({color:0xa88d68,metalness:.76,roughness:.38,clearcoat:.16}),
    glass:new T.MeshPhysicalMaterial({color:0x5b8583,metalness:.12,roughness:.12,transparent:true,opacity:.27,depthWrite:false,side:T.DoubleSide,clearcoat:1}),
    timber:new T.MeshStandardMaterial({color:0x42362a,roughness:.52}),
    dark:new T.MeshStandardMaterial({color:0x243637,roughness:.8}),
    carpet:new T.MeshStandardMaterial({color:0x193c37,roughness:1}),
    water:new T.MeshPhysicalMaterial({color:0x789fa0,metalness:.35,roughness:.15,transparent:true,opacity:.75}),
    light:new T.MeshStandardMaterial({color:0xe5c996,emissive:0xffd391,emissiveIntensity:.7}),
    concrete:new T.MeshStandardMaterial({color:0x737a75,roughness:.9}),
    pipe:new T.MeshStandardMaterial({color:0x78948d,metalness:.65,roughness:.4})
  };
  mat.equipment=new T.MeshStandardMaterial({color:0x9fa9a4,metalness:.35,roughness:.53});
  function part(id,name,offset,description){const group=new T.Group();group.name=name;root.add(group);components.push({id,name,group,offset:new T.Vector3(...offset),description,original:{position:group.position.clone(),quaternion:group.quaternion.clone(),scale:group.scale.clone()}});return group;}
  const foundation=part('foundation','Foundation & structure',[0,-3,0],'Layered raft foundation, footing pads and representative reinforcement.');
  const floor=part('floor','Marble platform',[0,0,0],'Terraced ivory stone podium and inlaid courtyard paving.');
  const interior=part('interior','Prayer hall & furnishings',[0,1,0],'Prayer carpets, mihrab, minbar and suspended bronze chandeliers.');
  const shell=part('envelope','Arcades & facade',[0,3,0],'Open horseshoe-inspired arcades, stone columns and geometric screens.');
  const roof=part('roof','Roof & five domes',[0,8,0],'Ribbed central dome and four satellite domes on a coffered roof plate.');
  const minarets=part('minarets','Four minarets',[4,2,4],'Four tapered towers, lantern galleries, balconies and crescent finials.');
  const ablution=part('ablution','Ablution pavilion',[-7,1,0],'Representative wash stations, taps, drainage and a screened pavilion.');
  const services=part('services','Mechanical & electrical',[7,2,-3],'Representative condensers, water storage, pumps, conduits and distribution.');
  const geoCache=new Map();
  function mesh(g,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,w,h,d,x,y,z,m=mat.stone){const key=`b${w},${h},${d}`;if(!geoCache.has(key))geoCache.set(key,new T.BoxGeometry(w,h,d));return mesh(g,geoCache.get(key),m,x,y,z);}
  function cyl(g,rt,rb,h,x,y,z,m=mat.stone,n=32){return mesh(g,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);}
  function torus(g,r,t,x,y,z,m=mat.gold){const o=mesh(g,new T.TorusGeometry(r,t,8,64),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
  function line(g,points,m=mat.gold,r=.025,linear=false){let curve;if(linear){curve=new T.CurvePath();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(new T.Vector3(...points[i-1]),new T.Vector3(...points[i])));}else curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,Math.max(8,points.length*4),r,5,false),m);}
  function column(g,x,z,h=4.7,y=1.15){cyl(g,.24,.3,h,x,y+h/2,z);box(g,.8,.22,.8,x,y+.11,z,mat.trim);cyl(g,.4,.31,.28,x,y+h-.1,z,mat.trim);cyl(g,.31,.31,.12,x,y+.4,z,mat.gold);cyl(g,.28,.28,.09,x,y+h-.5,z,mat.gold);box(g,.78,.18,.78,x,y+h+.1,z,mat.trim);for(const [r,dy] of [[.34,.26],[.39,.1],[.43,-.03]])torus(g,r,.035,x,y+h+dy,z,mat.bronze);cyl(g,.43,.25,.3,x,y+h-.27,z,mat.trim);box(g,.95,.09,.95,x,y+h+.22,z,mat.trim);}
  function arch(g,x,y,z,width=3.3,height=4.5,depth=.44,rotation=0){
    const r=width/2,th=.24, spring=height-r;
    const shape=new T.Shape();shape.moveTo(-r-th,0);shape.lineTo(-r-th,spring);shape.absarc(0,spring,r+th,Math.PI,0,true);shape.lineTo(r+th,0);shape.lineTo(r,0);shape.lineTo(r,spring);shape.absarc(0,spring,r,0,Math.PI,false);shape.lineTo(-r,0);shape.closePath();
    const o=mesh(g,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1,curveSegments:24}),mat.trim,x,y,z);o.rotation.y=rotation;
    const pts=[];for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;pts.push([Math.cos(a)*(r+.12),spring+Math.sin(a)*(r+.12),-.045]);}const trim=new T.Group();trim.position.set(x,y,z);trim.rotation.y=rotation;g.add(trim);line(trim,pts,mat.gold,.025);line(trim,pts.map(p=>[p[0]*1.045,p[1]+.065,p[2]-.025]),mat.bronze,.018);for(let i=1;i<12;i++){const a=i*Math.PI/12;line(trim,[[Math.cos(a)*r,spring+Math.sin(a)*r,-.05],[Math.cos(a)*(r+th),spring+Math.sin(a)*(r+th),-.05]],mat.bronze,.009,true);}
  }
  function screen(g,x,y,z,w,h,rotation=0,glazed=false){const group=new T.Group();group.position.set(x,y,z);group.rotation.y=rotation;g.add(group);for(const side of [-1,1]){box(group,w+.12,.08,.12,0,side*h/2,0,mat.bronze);box(group,.08,h,.12,side*w/2,0,0,mat.bronze);}if(glazed)box(group,w,h,.025,0,0,.06,mat.glass);for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const cx=i*w/5,cy=j*h/5;const points=[];for(let k=0;k<=16;k++){const a=k*Math.PI/8;const radius=(k%2===0?.48:.23)*Math.min(w/5,h/5);points.push([cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,0]);}line(group,points,mat.gold,.015,true);if(i<2)line(group,[[cx+w/5*.48,cy,0],[cx+w/5*.52,cy,0]],mat.bronze,.012,true);if(j<2)line(group,[[cx,cy+h/5*.48,0],[cx,cy+h/5*.52,0]],mat.bronze,.012,true);}}
  function dome(g,x,y,z,r,h){
    cyl(g,r*.99,r*1.04,.3,x,y,z,mat.trim,64);cyl(g,r*.95,r*.95,.55,x,y+.35,z,mat.stone,64);torus(g,r*.96,.06,x,y+.6,z);
    const profile=[];for(let i=0;i<=40;i++){const a=i*Math.PI/2/40;profile.push(new T.Vector2(r*Math.cos(a),.62+h*Math.sin(a)));}
    mesh(g,new T.LatheGeometry(profile,80),mat.dome,x,y,z);
    for(let k=0;k<32;k++){const angle=k*Math.PI*2/32;const pts=[];for(let i=0;i<=24;i++){const a=i*Math.PI/2/24;pts.push([x+(r+.025)*Math.cos(a)*Math.cos(angle),y+.62+h*Math.sin(a),z+(r+.025)*Math.cos(a)*Math.sin(angle)]);}line(g,pts,mat.gold,.025);}
    cyl(g,.045,.075,.72,x,y+h+.9,z,mat.gold);cyl(g,0,.16,.3,x,y+h+.95,z,mat.gold);const moon=mesh(g,new T.TorusGeometry(.18,.035,8,24,Math.PI*1.6),mat.gold,x,y+h+1.4,z);moon.rotation.z=-.8;
  }
  // Raft and footings; a separate, inspectable layer below the podium.
  box(foundation,26,.55,24,0,-.45,0,mat.concrete);box(foundation,25,.25,23,0,-.85,0,mat.dark);
  for(const x of [-10,-5,0,5,10])for(const z of [-9,0,9]){box(foundation,1.7,.6,1.7,x,-1,z,mat.concrete);cyl(foundation,.19,.19,1.1,x,-1.7,z,mat.concrete);}
  for(let x=-11;x<=11;x+=2)box(foundation,.035,.035,21,x,-.14,0,mat.bronze);
  for(let z=-10;z<=10;z+=2)box(foundation,23,.035,.035,0,-.12,z,mat.bronze);
  box(floor,29,.25,27,0,.02,0,mat.dark);box(floor,27,.35,25,0,.3,0);box(floor,25,.35,23,0,.65,0);box(floor,23,.3,21,0,.95,0);
  // Fine paving inlays and entrance steps.
  for(let x=-12;x<=12;x+=2)box(floor,.025,.012,23,x,.833,0,mat.bronze);
  for(let z=-11;z<=11;z+=2)box(floor,25,.012,.025,0,.835,z,mat.bronze);
  for(let i=0;i<4;i++)box(floor,8+i*.5,.16,1.8,0,.18+i*.16,12.1-i*.42);
  for(let i=0;i<4;i++)box(floor,8+i*.5,.025,.06,0,.27+i*.16,12.95-i*.42,mat.bronze);
  // Main hall (16 x 14), flanked by open arcades.
  for(const z of [-7,7]){box(shell,18,.65,.6,0,5.7,z);box(shell,18.5,.16,.88,0,6.1,z,mat.trim);for(const x of [-8,-4,0,4,8])column(shell,x,z);for(const x of [-6,-2,2,6])arch(shell,x,1.2,z-.2,3.3,4.3,.4);}
  for(const x of [-8,8]){box(shell,.6,.65,14,x,5.7,0);box(shell,.88,.16,14.5,x,6.1,0,mat.trim);for(const z of [-3.5,0,3.5])column(shell,x,z);for(const z of [-5.25,-1.75,1.75,5.25])arch(shell,x-.2,1.2,z,2.85,4.3,.4,Math.PI/2);}
  // Screened side bays leave the entrance fully open.
  const facadeAsset=asset(shell,'MZN-FC-001');
  for(const x of [-8,8])for(const z of [-5.25,1.75,5.25])screen(x===8&&z===5.25?facadeAsset:shell,x,3.25,z,2.7,3.4,Math.PI/2,true);
  for(const x of [-6,6])screen(shell,x,3.25,-7,3,3.4,0,true);
  // Recessed plinth courses, cornice shadow lines and restrained stone dentils.
  for(const z of [-7,7])for(const [y,w,h,d] of [[5.38,18.3,.09,.72],[5.9,18.6,.08,.87],[6.03,18.8,.08,.94]])box(shell,w,h,d,0,y,z,y===5.38?mat.bronze:mat.trim);
  for(const x of [-8,8]){box(shell,.75,.12,14.2,x,5.38,0,mat.bronze);for(let z=-6.7;z<7;z+=.55)box(shell,.82,.12,.22,x,5.95,z,mat.trim);}
  for(const z of [-7,7])for(let x=-8.5;x<9;x+=.55)box(shell,.22,.12,.82,x,5.95,z,mat.trim);
  // Colonnaded entrance portico.
  for(const x of [-4,0,4])column(shell,x,9,3.6);for(const x of [-2,2])arch(shell,x,1.2,8.8,3.3,3.5,.4);
  const doors=asset(shell,'MZN-DO-001');
  for(const side of [-1,1]){
    const leaf=new T.Group();leaf.position.set(2+side*1.4,1.2,7.05);leaf.rotation.y=side*.55;doors.add(leaf);
    box(leaf,1.35,3.0,.12,-side*.675,1.5,0,mat.timber);
    for(const y of [.8,2.1]){box(leaf,1.08,1.1,.06,-side*.675,y,.085,mat.bronze);box(leaf,.94,.96,.04,-side*.675,y,.13,mat.timber);}
    line(leaf,[[-side*1.15,1.1,.17],[-side*1.15,1.6,.17]],mat.gold,.035,true);
    for(let i=0;i<6;i++)box(leaf,.012,2.7,.015,-side*(.2+i*.2),1.5,.075,mat.gold);
  }
  screen(doors,2,4.45,7.05,2.7,.52,0,true);
  box(roof,9,.32,2.8,0,4.95,8.2);box(roof,18.5,.35,14.7,0,6.35,0);box(roof,19,.15,15.2,0,6.59,0,mat.trim);
  for(const z of [-7.4,7.4]){box(roof,18.6,.12,.13,0,6.85,z,mat.gold);box(roof,18.6,.35,.2,0,6.95,z);}
  for(const x of [-9.2,9.2]){box(roof,.13,.12,14.8,x,6.85,0,mat.gold);box(roof,.2,.35,14.8,x,6.95,0);}
  cyl(roof,4.1,4.4,1.0,0,7.15,0,mat.stone,64);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;const window=box(roof,.27,.55,.06,Math.sin(a)*4.13,7.2,Math.cos(a)*4.13,mat.dark);window.rotation.y=a;}
  dome(asset(roof,'MZN-RF-001'),0,7.65,0,4.25,3.25);
  for(const x of [-6,6])for(const z of [-4.7,4.7])dome(roof,x,6.8,z,1.65,1.45);
  // Tapered minarets with fluted shafts, balconies and open lantern arcades.
  for(const x of [-10.6,10.6])for(const z of [-9,9]){
    box(minarets,1.7,.35,1.7,x,1.2,z);cyl(minarets,.78,.95,1.6,x,2.1,z,mat.stone,8);
    cyl(minarets,.47,.64,7.8,x,6.6,z,mat.stone,16);
    for(let k=0;k<12;k++){const a=k*Math.PI/6;cyl(minarets,.028,.035,7.2,x+Math.cos(a)*.51,6.6,z+Math.sin(a)*.51,mat.trim,6);}
    for(const y of [3,9.5,11.7]){cyl(minarets,.85,.7,.25,x,y,z,mat.trim,32);torus(minarets,.83,.045,x,y+.15,z);}
    cyl(minarets,.83,.5,.35,x,9.2,z,mat.trim,24);torus(minarets,.62,.05,x,9.0,z,mat.bronze);
    for(let k=0;k<12;k++){const a=k*Math.PI/6;const a2=a+Math.PI/12;line(minarets,[[x+Math.cos(a)*.79,9.6,z+Math.sin(a)*.79],[x+Math.cos(a2)*.79,9.88,z+Math.sin(a2)*.79],[x+Math.cos(a+Math.PI/6)*.79,9.6,z+Math.sin(a+Math.PI/6)*.79]],mat.bronze,.02,true);}
    for(let k=0;k<12;k++){const a=k*Math.PI/6;cyl(minarets,.025,.025,.6,x+Math.cos(a)*.79,9.88,z+Math.sin(a)*.79,mat.gold,6);}
    torus(minarets,.8,.035,x,10.17,z);cyl(minarets,.37,.45,1.6,x,10.6,z,mat.dark,12);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;cyl(minarets,.065,.065,1.5,x+Math.cos(a)*.48,10.8,z+Math.sin(a)*.48,mat.stone,8);}
    dome(minarets,x,11.8,z,.65,1.15);
  }
  // Prayer carpet rows with woven-looking gold inlay and individual prayer marks.
  const carpetCanvas=document.createElement('canvas');carpetCanvas.width=256;carpetCanvas.height=256;const cc=carpetCanvas.getContext('2d');cc.fillStyle='#344c43';cc.fillRect(0,0,256,256);for(let i=0;i<2500;i++){cc.fillStyle=i%2?'#2d453e':'#3d554b';cc.fillRect(random()*256,random()*256,1,3);}cc.strokeStyle='#85714d';cc.lineWidth=2;cc.strokeRect(9,9,238,238);cc.strokeRect(14,14,228,228);const carpetTex=new T.CanvasTexture(carpetCanvas);carpetTex.colorSpace=T.SRGBColorSpace;carpetTex.wrapS=carpetTex.wrapT=T.RepeatWrapping;carpetTex.repeat.set(8,8);mat.carpet.map=carpetTex;mat.carpet.color.set(0x657960);
  box(interior,14,.035,11.7,0,1.12,0,mat.carpet);
  for(let z=-5;z<=5;z+=1.35){box(interior,13.6,.015,.035,0,1.15,z,mat.gold);for(let x=-6;x<=6;x+=1.2){const mark=mesh(interior,new T.TorusGeometry(.3,.012,4,16,Math.PI),mat.trim,x,1.16,z-.45);mark.rotation.x=-Math.PI/2;}}
  for(const x of [-6.75,6.75])box(interior,.08,.02,11.5,x,1.16,0,mat.gold);
  for(let z=-5;z<=5;z+=1.35)for(let x=-6;x<=6;x+=1.2){line(interior,[[x-.3,1.16,z-.45],[x-.3,1.16,z+.25],[x+.3,1.16,z+.25],[x+.3,1.16,z-.45]],mat.gold,.008,true);}
  // Qibla niche and stepped minbar, behind the prayer rows.
  box(interior,4.2,4.7,.35,0,3.5,-6.75,mat.stone);arch(interior,0,1.2,-6.48,2.8,4.2,.12);box(interior,2.65,2.5,.08,0,2.5,-6.5,mat.dark);
  screen(interior,0,3.35,-6.4,1.8,2.6);
  for(const x of [-1.95,1.95]){box(interior,.12,4.35,.12,x,3.4,-6.48,mat.gold);column(interior,x,-6.3,3.75,1.2);}
  for(let i=0;i<6;i++)box(interior,1,.18*(i+1),.45,2.8,1.2+.09*(i+1),-4.2-i*.42,mat.bronze);
  box(interior,1.15,1.4,.12,2.8,2.8,-6.4,mat.gold);
  for(const x of [2.24,3.36])line(interior,[[x,1.8,-4.15],[x,3,-6.3]],mat.bronze,.045,true);
  function chandelier(parent,x,z,r){line(parent,[[x,6.3,z],[x,4.3,z]],mat.bronze,.025);torus(parent,r,.045,x,4.2,z);torus(parent,r*.6,.03,x,3.9,z);for(let k=0;k<12;k++){const a=k*Math.PI/6;line(parent,[[x,4.8,z],[x+Math.cos(a)*r,4.2,z+Math.sin(a)*r]],mat.gold,.018);cyl(parent,.06,.09,.22,x+Math.cos(a)*r,4.3,z+Math.sin(a)*r,mat.light,8);cyl(parent,.09,.09,.32,x+Math.cos(a)*r,4.34,z+Math.sin(a)*r,mat.glass,12);cyl(parent,.1,.1,.04,x+Math.cos(a)*r,4.52,z+Math.sin(a)*r,mat.bronze,12);}}
  chandelier(asset(interior,'MZN-CH-001'),0,0,1.7);chandelier(asset(interior,'MZN-CH-002'),-5,2,.65);chandelier(asset(interior,'MZN-CH-003'),5,2,.65);
  const audio=asset(interior,'MZN-AU-001');for(const x of [-5,5]){box(audio,.5,.85,.35,x,4.4,-6.65,mat.dark);for(let k=0;k<7;k++)box(audio,.42,.018,.02,x,4.08+k*.1,-6.46,mat.bronze);}
  // Ablution pavilion, beyond the west arcade.
  box(ablution,3.4,.3,7,-11,1,0);box(ablution,.3,2.2,6.8,-12.5,2.2,0,mat.stone);box(ablution,3.8,.25,7.4,-11,4.3,0,mat.trim);
  for(const z of [-3,3])column(ablution,-9.6,z,3.0);
  const wash=asset(ablution,'MZN-AB-001');
  box(wash,.8,.5,5.9,-11.7,1.5,0,mat.trim);box(wash,.5,.05,5.6,-11.7,1.77,0,mat.water);
  for(let z=-2.4;z<3;z+=1.2){cyl(wash,.21,.25,.3,-10.6,1.3,z,mat.trim);torus(wash,.19,.025,-10.6,1.46,z,mat.bronze);line(wash,[[-12.2,1.8,z],[-12.2,2.35,z],[-11.85,2.35,z],[-11.85,2.15,z]],mat.gold,.045);box(wash,.08,.04,.22,-12.1,2.4,z,mat.bronze);}
  for(let z=-3;z<3.5;z+=.5)box(ablution,.04,1.5,.02,-12.33,2.4,z,mat.gold);
  box(ablution,.12,.025,6,-11.1,1.17,0,mat.dark);
  // Mechanical compound: fan housings, pipe network and water plant.
  box(services,3.5,.2,7,11,1,0,mat.concrete);
  for(const [i,z] of [-2.2,-.2,1.8].entries()){const ac=asset(services,`MZN-AC-00${i+1}`);box(ac,1.2,1.3,1.5,10.7,1.75,z,mat.equipment);const fan=mesh(ac,new T.TorusGeometry(.42,.035,8,24),mat.bronze,11.32,1.75,z);fan.rotation.y=Math.PI/2;for(let k=0;k<7;k++)box(ac,.03,.04,1.1,11.33,1.3+k*.13,z,mat.dark);line(services,[[10.5,1.3,z],[9.3,1.3,z],[9.3,4.5,z],[8.2,4.5,z]],mat.pipe,.055);for(let k=0;k<4;k++){const blade=box(ac,.025,.07,.65,11.34,1.75,z,mat.bronze);blade.rotation.x=k*Math.PI/4;}}
  const tank=asset(services,'MZN-WT-001');cyl(tank,.85,.85,2.4,11.1,2.35,-5,mat.equipment);torus(tank,.86,.04,11.1,3.5,-5,mat.bronze);cyl(tank,.4,.4,.15,11.1,3.62,-5,mat.bronze);for(const y of [1.4,2.1,2.8])torus(tank,.86,.025,11.1,y,-5,mat.bronze);
  const pump=asset(services,'MZN-WP-001');box(pump,.95,.12,.8,9.8,1.18,-5,mat.bronze);const motor=cyl(pump,.22,.22,.8,9.8,1.55,-5,mat.pipe);motor.rotation.x=Math.PI/2;for(let i=0;i<7;i++){const fin=cyl(pump,.24,.24,.025,9.8,1.55,-5.3+i*.1,mat.bronze);fin.rotation.x=Math.PI/2;}cyl(pump,.2,.2,.3,9.8,1.8,-4.5,mat.pipe);box(pump,.3,.18,.2,9.8,1.87,-5,mat.dark);
  line(services,[[11.1,1.25,-5],[10,1.25,-5],[10,1.25,-7],[0,1.25,-7]],mat.pipe,.09);
  const board=asset(services,'MZN-ED-001');box(board,.25,1.4,.8,8.5,2,-4,mat.dark);box(board,.04,1.23,.65,8.64,2,-4,mat.bronze);box(board,.04,.25,.35,8.67,2.28,-4,mat.glass);for(const z of [-4.15,-4,-3.85])box(board,.025,.1,.06,8.68,1.85,z,mat.trim);for(const z of [-4.3,-4,-3.7])line(services,[[8.5,2.6,z],[8.5,5.5,z],[4,5.5,z]],mat.bronze,.025);
  const cctv=asset(shell,'MZN-CC-001');line(cctv,[[4.05,4.5,8.5],[4.5,4.5,8.5],[4.5,4.2,8.5]],mat.bronze,.05,true);const housing=box(cctv,.24,.22,.55,4.5,4.15,8.68,mat.trim);housing.rotation.x=-.2;cyl(cctv,.09,.09,.04,4.5,4.12,8.97,mat.dark,16).rotation.x=Math.PI/2;
  // Recessed perimeter lights.
  const uplights=asset(interior,'MZN-LT-001');for(const x of [-7,-3,3,7])for(const z of [-8.5,8.5]){box(uplights,.4,.04,.4,x,1.13,z,mat.bronze);box(uplights,.29,.05,.29,x,1.15,z,mat.light);}
  // Batch static geometry by material inside each independently movable layer.
  // This preserves inspection groups while avoiding thousands of draw calls.
  root.updateMatrixWorld(true);
  let proceduralMeshCount=0;
  const sourceGeometries=new Set();
  for(const component of components){
    const batches=new Map();
    component.group.traverse(o=>{if(!o.isMesh)return;proceduralMeshCount++;sourceGeometries.add(o.geometry);let owner=o;while(owner!==component.group&&!owner.userData.assetId)owner=owner.parent;const assetId=owner.userData.assetId||null;const key=`${assetId||'architecture'}:${o.material.uuid}`;const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);if(!batches.has(key))batches.set(key,{material:o.material,assetId,geometries:[]});batches.get(key).geometries.push(geometry);});
    component.group.clear();
    for(const {material,assetId,geometries} of batches.values()){let parent=component.group;if(assetId){if(!assetObjects.has(assetId)){const group=asset(component.group,assetId);group.userData.componentId=component.id;assetObjects.set(assetId,group);}parent=assetObjects.get(assetId);}const merged=mergeGeometries(geometries,false);if(!merged)throw new Error('Geometry batch failed');merged.computeBoundingSphere();const o=mesh(parent,merged,material);o.userData.componentId=component.id;o.userData.assetId=assetId;o.userData.originalMaterial=material;geometries.forEach(g=>g.dispose());}
  }
  sourceGeometries.forEach(g=>g.dispose());root.userData.proceduralMeshCount=proceduralMeshCount;
  return {root,components,materials:mat,assetObjects};
}
