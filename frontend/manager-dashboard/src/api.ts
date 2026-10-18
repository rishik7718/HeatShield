import type {HeatRiskInput, HeatRiskResult, Overview} from './types'
const base=import.meta.env.VITE_API_BASE_URL??'http://127.0.0.1:8000'
export async function fetchOverview():Promise<Overview>{const r=await fetch(`${base}/api/v1/overview`);if(!r.ok)throw new Error(`API ${r.status}`);return r.json() as Promise<Overview>}
export async function calculateHeatRisk(input:HeatRiskInput):Promise<HeatRiskResult>{const r=await fetch(`${base}/api/v1/heat-risk`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});if(!r.ok){const body=await r.json().catch(()=>null);throw new Error(body?.detail?.[0]?.msg??`API ${r.status}`)}return r.json() as Promise<HeatRiskResult>}
