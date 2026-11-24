// Fixed fictional snapshot: reproducible demonstration figures, never measured savings.
import {assetOperatingCosts} from './financial-engine.js';
export const referenceDate = '2026-11-23';
function electricityAssumption(category){
  const profiles={'Air conditioning':[1,1.8,10,300,.5],Chandeliers:[1,.08,8,300,.5],'Electrical lighting':[8,.015,10,365,.5],'Water pumps':[1,.4,4,300,.5],CCTV:[1,.01,24,365,.5],'Audio systems':[2,.06,4,300,.5]};
  const p=profiles[category];return p?{quantity:p[0],power:p[1],hours:p[2],days:p[3],tariff:p[4]}:null;
}
const record = (id,name,category,componentId,location,cost,maintenance,life,next,status,extra={}) => ({
  id,name,category,componentId,location,acquisitionCost:cost,acquisitionDate:'2025-03-15',
  usefulLifeYears:life,warrantyStatus:'Active to 14 Mar 2027',
  maintenanceHistory:[{date:'2026-05-14',work:'Routine inspection and cleaning',cost:180,result:'Serviceable — fictional inspection'}],
  nextMaintenanceDate:next,
  finance:{electricity:id==='MZN-CH-001'?{quantity:1,power:.3,hours:8,days:300,tariff:.5}:electricityAssumption(category),water:category==='Ablution facilities'?{dailyUses:100,litres:5,days:300,tariff:2}:null,annualMaintenance:maintenance,waterAllocatedTo:['Water pumps','Water tanks'].includes(category)?'MZN-AB-001':null},
  get annualOperatingCost(){return assetOperatingCosts(this).total;},
  responsibleRole:'Facilities officer',inspectionStatus:status,
  fictional:true,...extra
});
export const assets = [
  record('MZN-AC-001','East condenser · unit 01','Air conditioning','services','East service court / north bay',7200,700,10,'2026-11-10','Service due'),
  record('MZN-AC-002','East condenser · unit 02','Air conditioning','services','East service court / central bay',7200,700,10,'2027-01-15','Inspected'),
  record('MZN-AC-003','East condenser · unit 03','Air conditioning','services','East service court / south bay',7200,700,10,'2026-12-15','Scheduled'),
  record('MZN-CH-001','Prayer hall ring chandelier','Chandeliers','interior','Prayer hall / central suspension',14500,620,18,'2026-11-20','Inspection due',{responsibleRole:'Electrical supervisor'}),
  record('MZN-CH-002','West pendant chandelier','Chandeliers','interior','Prayer hall / west aisle',3600,194,18,'2027-02-10','Inspected'),
  record('MZN-CH-003','East pendant chandelier','Chandeliers','interior','Prayer hall / east aisle',3600,194,18,'2027-02-10','Inspected'),
  record('MZN-LT-001','Entrance and arcade uplights','Electrical lighting','interior','Perimeter / eight recessed fixtures',2800,241,8,'2026-12-05','Inspected',{responsibleRole:'Electrical supervisor'}),
  record('MZN-WP-001','Domestic water booster pump','Water pumps','services','East service court / water plant',4200,400,10,'2026-11-01','Attention required',{warrantyStatus:'Expired 14 Mar 2026',maintenanceHistory:[{date:'2026-04-09',work:'Seal replacement',cost:320,result:'Restored to service'},{date:'2026-10-20',work:'Vibration inspection',cost:150,result:'Follow-up inspection requested'}]}),
  record('MZN-WT-001','Domestic water storage tank','Water tanks','services','East service court / tank platform',6800,220,20,'2027-03-01','Inspected'),
  record('MZN-AB-001','Ablution wash-station bank','Ablution facilities','ablution','West pavilion / five wash stations',9500,820,15,'2026-11-23','Inspection due',{responsibleRole:'Building maintenance officer'}),
  record('MZN-CC-001','Entrance CCTV camera','CCTV','envelope','Entrance portico / east corner',1600,51.2,7,'2027-01-05','Inspected',{responsibleRole:'Security systems officer'}),
  record('MZN-AU-001','Prayer hall speaker pair','Audio systems','interior','Prayer hall / qibla wall',2400,108,10,'2026-12-20','Scheduled',{responsibleRole:'Audio systems custodian'}),
  record('MZN-ED-001','East distribution board','Electrical distribution','services','East wall / service access',5600,240,20,'2026-10-30','Inspection due',{responsibleRole:'Electrical supervisor',warrantyStatus:'Expired 14 Mar 2026'}),
  record('MZN-RF-001','Central ribbed dome covering','Roofing','roof','Main prayer hall / central dome',125000,1800,35,'2027-04-15','Inspected',{warrantyStatus:'Active to 14 Mar 2035',responsibleRole:'Building maintenance officer'}),
  record('MZN-DO-001','East entrance timber doors','Doors','envelope','Main entrance / east portal',12500,180,25,'2026-12-01','Inspected',{responsibleRole:'Building maintenance officer'}),
  record('MZN-FC-001','East geometric screen and glazing','Architectural facade','envelope','East facade / south screen bay',18500,340,30,'2027-02-01','Inspected',{responsibleRole:'Building maintenance officer'})
];
export const categories = [...new Set(assets.map(a=>a.category))].sort();
export const money = value => new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR',maximumFractionDigits:0}).format(value);
export const isMaintenanceDue = (asset,asOf=referenceDate) => asset.nextMaintenanceDate <= asOf;
export function filterAssets(records,query='',category='all') {
  const needle=query.trim().toLocaleLowerCase();
  return records.filter(a=>(category==='all'||a.category===category)&&[a.id,a.name,a.category,a.location,a.responsibleRole].join(' ').toLocaleLowerCase().includes(needle));
}
export function summarizeAssets(records,asOf=referenceDate) {
  return records.reduce((s,a)=>({count:s.count+1,acquisitionCost:s.acquisitionCost+Math.round(a.acquisitionCost*100)/100,annualOperatingCost:s.annualOperatingCost+Math.round(a.annualOperatingCost*100)/100,maintenanceDue:s.maintenanceDue+Number(isMaintenanceDue(a,asOf))}),{count:0,acquisitionCost:0,annualOperatingCost:0,maintenanceDue:0});
}
export const csvColumns = [
  ['Asset ID','id'],['Asset name','name'],['Category','category'],['Component','componentId'],['Physical location','location'],
  ['Acquisition cost (MYR)','acquisitionCost'],['Acquisition date','acquisitionDate'],['Estimated useful life (years)','usefulLifeYears'],
  ['Warranty status','warrantyStatus'],['Maintenance history','maintenanceHistory'],['Next maintenance date','nextMaintenanceDate'],
  ['Estimated annual operating cost (MYR)','annualOperatingCost'],['Responsible role','responsibleRole'],['Inspection status','inspectionStatus'],['Fictional demonstration','fictional'],['Snapshot date','snapshotDate']
];
export function createAssetCsv(records) {
  const escape = value => {
    let text=String(value??'');
    // Quoted cells plus neutralisation of spreadsheet formula prefixes.
    if (/^[\s]*[=+@-]/.test(text)) text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  return '\uFEFF'+[csvColumns.map(c=>escape(c[0])).join(','),...records.map(a=>csvColumns.map(([,key])=>escape(key==='snapshotDate'?referenceDate:key==='maintenanceHistory'?a.maintenanceHistory.map(h=>`${h.date}: ${h.work}; MYR ${h.cost}; ${h.result}`).join(' | '):a[key])).join(','))].join('\r\n')+'\r\n';
}
