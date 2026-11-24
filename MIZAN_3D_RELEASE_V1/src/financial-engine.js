// Pure scenario arithmetic. MYR tariffs and all inputs are fictional assumptions.
// Calculated results retain precision; equivalent values suppress machine noise only.
// Generated defaults use readable input precision. Capital stays outside annual OPEX.
const difference=(a,b)=>{const delta=a-b;return Math.abs(delta)<=Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b))*8?0:delta;};
export const fields = {
  energy:[['quantity','Asset quantity','units',0,100000,true],['power','Average electrical input','kW / unit',0,10000],['hours','Baseline daily operation','hours / day',0,24],['days','Annual operating days','days / year',0,366,true],['tariff','Electricity tariff','MYR / kWh',0,1000],['alternativeHours','Alternative daily operation','hours / day',0,24],['alternativePower','Alternative electrical input','kW / unit',0,10000],['implementationCost','Implementation cost · year 0','MYR',0,1e12]],
  water:[['dailyUses','Daily uses','uses / day',0,1e7,true],['litres','Baseline water per use','litres / use',0,1e6],['days','Annual operating days','days / year',0,366,true],['tariff','Water tariff','MYR / m³',0,1000],['alternativeLitres','Alternative water per use','litres / use',0,1e6],['implementationCost','Implementation cost · year 0','MYR',0,1e12]],
  repair:[['repairCost','Immediate repair cost · year 0','MYR',0,1e12],['replacementCost','Replacement purchase + installation · year 0','MYR',0,1e12],['existingOperating','Existing annual operation · excludes maintenance','MYR / year',0,1e12],['replacementOperating','Replacement annual operation · excludes maintenance','MYR / year',0,1e12],['existingMaintenance','Existing annual maintenance','MYR / year',0,1e12],['replacementMaintenance','Replacement annual maintenance','MYR / year',0,1e12],['years','Analysis horizon','years',1,10,true],['discountRate','Annual discount rate · 0 for none','%',0,100]],
  admin:[['assetsReviewed','Assets reviewed','assets',0,100000,true],['manualMinutes','Manual review time per asset','minutes',0,1e6],['digitalMinutes','Digital review time per asset','minutes',0,1e6],['frequency','Review frequency','reviews / year',0,366,true],['hourlyCost','Estimated labour cost','MYR / hour',0,1e6],['initialHours','Initial data entry + implementation','hours · year 0',0,1e7]]
};
export function validateInputs(kind,input) {
  const values={},errors={};
  for(const [key,label,,min,max,integer] of fields[kind]||[]){const raw=input?.[key];const value=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;if(!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))errors[key]=`${label}: enter ${integer?'a whole number':'a number'} from ${min} to ${max}.`;else values[key]=value;}
  if(!fields[kind])errors.kind='Unknown simulator.';
  return {valid:Object.keys(errors).length===0,values,errors};
}
export function savings(baseline,alternative,implementationCost=0) {
  const annualSavings=difference(baseline,alternative);
  return {annualSavings,savingsPercent:baseline>0?annualSavings/baseline*100:null,paybackYears:annualSavings>0?implementationCost/annualSavings:null,firstYearNetSavings:annualSavings-implementationCost,alternativeFirstYearCost:alternative+implementationCost};
}
export function calculateEnergy(input){
  const v=validateInputs('energy',input);if(!v.valid)return v;const a=v.values;
  const baselineKwh=a.quantity*a.power*a.hours*a.days,alternativeKwh=a.quantity*a.alternativePower*a.alternativeHours*a.days;
  const baselineCost=baselineKwh*a.tariff,alternativeCost=alternativeKwh*a.tariff;
  return {...v,baselineKwh,alternativeKwh,baselineCost,alternativeCost,...savings(baselineCost,alternativeCost,a.implementationCost)};
}
export function calculateWater(input){
  const v=validateInputs('water',input);if(!v.valid)return v;const a=v.values;
  const baselineM3=a.dailyUses*a.litres*a.days/1000,alternativeM3=a.dailyUses*a.alternativeLitres*a.days/1000;
  const baselineCost=baselineM3*a.tariff,alternativeCost=alternativeM3*a.tariff;
  return {...v,baselineM3,alternativeM3,baselineCost,alternativeCost,...savings(baselineCost,alternativeCost,a.implementationCost)};
}
export function calculateRepair(input){
  const v=validateInputs('repair',input);if(!v.valid)return v;const a=v.values,r=a.discountRate/100;
  const existingAnnual=a.existingOperating+a.existingMaintenance,replacementAnnual=a.replacementOperating+a.replacementMaintenance;
  const annualOperatingDifference=difference(a.existingOperating,a.replacementOperating),annualSavings=difference(existingAnnual,replacementAnnual),incrementalInvestment=difference(a.replacementCost,a.repairCost);
  const series=[{year:0,repair:a.repairCost,replace:a.replacementCost,repairPV:a.repairCost,replacePV:a.replacementCost}];
  for(let year=1;year<=a.years;year++){const prev=series[year-1],discountFactor=(1+r)**year;series.push({year,repair:prev.repair+existingAnnual,replace:prev.replace+replacementAnnual,repairPV:prev.repairPV+existingAnnual/discountFactor,replacePV:prev.replacePV+replacementAnnual/discountFactor});}
  const last=series.at(-1),pvDifference=difference(last.repairPV,last.replacePV);
  return {...v,existingAnnual,replacementAnnual,annualOperatingDifference,annualSavings,incrementalInvestment,paybackYears:annualSavings>0?Math.max(0,incrementalInvestment)/annualSavings:null,repairLifecycle:last.repair,replacementLifecycle:last.replace,repairPV:last.repairPV,replacementPV:last.replacePV,undiscountedDifference:difference(last.repair,last.replace),pvDifference,lowerCost:pvDifference===0?'Equal financial cost':pvDifference>0?'Replacement has lower financial cost':'Repair has lower financial cost',series};
}
export function calculateAdmin(input){
  const v=validateInputs('admin',input);if(!v.valid)return v;const a=v.values;
  const manualHours=a.assetsReviewed*a.manualMinutes*a.frequency/60,digitalHours=a.assetsReviewed*a.digitalMinutes*a.frequency/60;
  const grossHoursSaved=manualHours-digitalHours,firstYearNetHours=grossHoursSaved-a.initialHours;
  return {...v,manualHours,digitalHours,grossHoursSaved,firstYearNetHours,annualProductivityValue:grossHoursSaved*a.hourlyCost,initialTimeValue:a.initialHours*a.hourlyCost,firstYearNetValue:firstYearNetHours*a.hourlyCost,firstYearDigitalHours:digitalHours+a.initialHours};
}
export const calculators={energy:calculateEnergy,water:calculateWater,repair:calculateRepair,admin:calculateAdmin};
const known=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function assetOperatingCosts(asset){
  const f=asset.finance;if(!f)return {electricity:null,water:null,maintenance:null,total:null};
  const e=f.electricity?calculateEnergy({...f.electricity,alternativePower:f.electricity.power,alternativeHours:f.electricity.hours,implementationCost:0}):null;
  const w=f.water?calculateWater({...f.water,alternativeLitres:f.water.litres,implementationCost:0}):null;
  const electricity=f.electricity===null?0:e?.valid?e.baselineCost:null,water=f.water===null?0:w?.valid?w.baselineCost:null,maintenance=known(f.annualMaintenance)?f.annualMaintenance:null;
  const total=[electricity,water,maintenance].every(known)?Math.round((electricity+water+maintenance)*100)/100:null;
  return {electricity,water,maintenance,total};
}
export function aggregateCosts(records){
  const summary={acquisition:0,electricity:0,water:0,maintenance:0,operating:0,unknownAssets:0,unknownAcquisition:0,categories:[],highest:[]},groups=new Map();
  for(const a of records){const c=assetOperatingCosts(a);if(known(a.acquisitionCost))summary.acquisition+=a.acquisitionCost;else summary.unknownAcquisition++;
    for(const key of ['electricity','water','maintenance'])if(known(c[key]))summary[key]+=c[key];
    const knownCost=[c.electricity,c.water,c.maintenance].filter(known).reduce((sum,value)=>sum+value,0);
    if(c.total===null)summary.unknownAssets++;summary.operating+=knownCost;
    const group=groups.get(a.category)||{name:a.category,cost:0,unknown:0,count:0};group.count++;if(c.total===null)group.unknown++;group.cost+=knownCost;groups.set(a.category,group);
    summary.highest.push({id:a.id,name:a.name,category:a.category,cost:c.total});
  }
  for(const key of ['acquisition','electricity','water','maintenance','operating'])summary[key]=Math.round(summary[key]*100)/100;
  summary.categories=[...groups.values()].sort((a,b)=>b.cost-a.cost);summary.highest=summary.highest.filter(a=>a.cost!==null).sort((a,b)=>b.cost-a.cost);
  return summary;
}
export function costThresholds(records){const costs=records.map(a=>assetOperatingCosts(a).total).filter(known).sort((a,b)=>a-b);return {low:costs.length?costs[Math.ceil(costs.length/3)-1]:0,medium:costs.length?costs[Math.ceil(costs.length*2/3)-1]:0};}
export function classifyCost(value,thresholds){return !known(value)?'unknown':value<=thresholds.low?'low':value<=thresholds.medium?'medium':'high';}
export const costPalette={low:0x639e92,medium:0xc1ab7e,high:0xb87b60,unknown:0x73818d};
export function scenarioDefaults(kind,asset,records){
  const c=assetOperatingCosts(asset),f=asset.finance;
  if(kind==='energy'){if(!f?.electricity)return null;return {...f.electricity,alternativePower:Number((f.electricity.power*.8).toFixed(6)),alternativeHours:f.electricity.hours,implementationCost:Math.round(asset.acquisitionCost*.2)};}
  if(kind==='water'){if(!['Water pumps','Water tanks','Ablution facilities'].includes(asset.category))return null;const water=f.water||records.find(a=>a.finance?.water)?.finance.water;if(!water)return null;return {...water,alternativeLitres:water.litres*.7,implementationCost:500};}
  if(kind==='repair')return {repairCost:Math.round(asset.acquisitionCost*.15),replacementCost:Math.round(asset.acquisitionCost*1.1),existingOperating:(c.electricity??0)+(c.water??0),replacementOperating:Math.round(((c.electricity??0)+(c.water??0))*.8*100)/100,existingMaintenance:c.maintenance??0,replacementMaintenance:Math.round((c.maintenance??0)*.7*100)/100,years:5,discountRate:5};
  if(kind==='admin')return {assetsReviewed:records.length,manualMinutes:30,digitalMinutes:10,frequency:4,hourlyCost:25,initialHours:32};
  return null;
}
export const scenarioLimitations={
  energy:'Fictional constant-input model. Electrical input is average consumed kW, not cooling capacity. No demand charges, standby losses, load variation, escalation, maintenance changes or tax. Fewer operating hours may impair service and require operational approval. Annual estimates are not measured savings. Implementation occurs at year zero; simple payback ignores discounting.',
  water:'Fictional constant-use model. 1,000 litres = 1 m³. Uses and operating days are unchanged between alternatives; tariff is flat and hypothetical. No leakage, minimum bill, sewer charges or demand variation. Reducing litres per use requires hygiene and service validation. This standalone scenario is not added to portfolio bills.',
  repair:'Financial comparison only, not an engineering or procurement recommendation. Upfront repair or purchase plus installation occurs at year zero; recurring operation and maintenance occur at each year end. Prior acquisition is a sunk cost and excluded. Both alternatives are assumed to remain serviceable for the full 1–10 year horizon. No repeat replacement cycles, residual value, inflation, taxes, escalation, downtime or reliability differences are modelled. Annual operation excludes maintenance to prevent double-counting. Simple incremental payback ignores discounting and is not capped at the analysis horizon.',
  admin:'Hypothetical review times require user testing. Initial data entry and implementation time is charged once in the first year. Productivity value is hours multiplied by an assumed labour rate, not a cash saving or a promise of staffing reduction. Training effects, software fees and recurring administration beyond the entered review times are excluded. Scope is the entered review population; the selected asset supplies spatial context only.'
};
