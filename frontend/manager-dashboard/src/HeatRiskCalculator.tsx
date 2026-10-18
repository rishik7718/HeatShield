import {FormEvent, useState} from 'react'
import {AlertTriangle, Calculator, CheckCircle2, Info, ThermometerSun} from 'lucide-react'
import {calculateHeatRisk} from './api'
import type {HeatRiskInput, HeatRiskResult} from './types'

const initial:HeatRiskInput={dry_bulb_c:35,natural_wet_bulb_c:25,globe_temperature_c:40,environment:'outdoor_sun',workload:'moderate',acclimatized:false,clothing_adjustment_c:0}

export default function HeatRiskCalculator(){
  const [form,setForm]=useState<HeatRiskInput>(initial)
  const [result,setResult]=useState<HeatRiskResult|null>(null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const update=<K extends keyof HeatRiskInput>(key:K,value:HeatRiskInput[K])=>setForm(prev=>({...prev,[key]:value}))
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{setResult(await calculateHeatRisk(form))}catch(err){setError(err instanceof Error?err.message:'Unable to calculate risk. Check that the backend is running.');setResult(null)}finally{setBusy(false)}}
  return <div className="content heat-tool"><section className="heading"><div><label className="eyebrow">OCCUPATIONAL HEAT INTELLIGENCE</label><h1>WBGT <span>risk calculator</span></h1><p>Calculate WBGT from measured sensor components and compare it with a workload/acclimatization screening value.</p></div><span className="demo">SCREENING TOOL</span></section>
    <div className="warning"><Info size={16}/> Use measured natural wet-bulb and globe temperatures from a suitable instrument. Do not enter ordinary weather temperature as a substitute for these readings.</div>
    <div className="heat-tool-grid"><form className="panel heat-form" onSubmit={submit}><div className="panel-head"><div><label>ENVIRONMENTAL INPUTS</label><h2><ThermometerSun size={20}/> Measurement details</h2></div></div>
      <div className="form-grid">
        <label>Dry-bulb / air temp (°C)<input type="number" min="0" max="70" step="0.1" required value={form.dry_bulb_c} onChange={e=>update('dry_bulb_c',Number(e.target.value))}/></label>
        <label>Natural wet-bulb (°C)<input type="number" min="0" max="50" step="0.1" required value={form.natural_wet_bulb_c} onChange={e=>update('natural_wet_bulb_c',Number(e.target.value))}/></label>
        <label>Globe temperature (°C)<input type="number" min="0" max="90" step="0.1" required value={form.globe_temperature_c} onChange={e=>update('globe_temperature_c',Number(e.target.value))}/></label>
        <label>Clothing adjustment (°C)<input type="number" min="0" max="15" step="0.1" required value={form.clothing_adjustment_c} onChange={e=>update('clothing_adjustment_c',Number(e.target.value))}/><small>Use a documented CAF for the clothing/PPE ensemble; 0 is conventional work clothing.</small></label>
        <label>Exposure setting<select value={form.environment} onChange={e=>update('environment',e.target.value as HeatRiskInput['environment'])}><option value="outdoor_sun">Outdoor — direct sun</option><option value="indoor_or_shade">Indoor / shade — no direct sun</option></select></label>
        <label>Workload<select value={form.workload} onChange={e=>update('workload',e.target.value as HeatRiskInput['workload'])}><option value="light">Light</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option><option value="very_heavy">Very heavy</option></select></label>
      </div>
      <label className="check-field"><input type="checkbox" checked={form.acclimatized} onChange={e=>update('acclimatized',e.target.checked)}/><span><b>Worker is heat-acclimatized</b><small>Leave unchecked for unacclimatized workers or when status is unknown.</small></span></label>
      {error&&<div className="warning form-error"><AlertTriangle size={15}/>{error}</div>}
      <button className="primary calculate-button" type="submit" disabled={busy}><Calculator size={16}/>{busy?'Calculating…':'Calculate heat risk'}</button>
    </form>
    <article className="panel heat-result"><div className="panel-head"><div><label>SCREENING RESULT</label><h2>Assessment</h2></div>{result&&<span className={'risk '+result.risk_level.toLowerCase()}>{result.risk_level}</span>}</div>
      {!result?<div className="empty-result"><ThermometerSun size={38}/><b>Ready to assess</b><p>Submit the measured values to calculate WBGT, effective WBGT, and the selected reference limit.</p></div>:<>
        <div className="result-metrics"><div><small>Calculated WBGT</small><strong>{result.wbgt_c.toFixed(1)}°C</strong></div><div><small>Effective WBGT</small><strong>{result.effective_wbgt_c.toFixed(1)}°C</strong></div><div><small>Reference limit</small><strong>{result.reference_limit_c.toFixed(1)}°C</strong></div></div>
        <div className="result-status"><b>{result.status}</b><span>{result.difference_from_limit_c>=0?'+':''}{result.difference_from_limit_c.toFixed(1)}°C vs limit · {result.limit_type}</span></div>
        <h3>Recommended protective actions</h3><ul className="action-list">{result.actions.map((action,i)=><li key={i}><CheckCircle2 size={15}/><span>{action}</span></li>)}</ul>
        <details className="method-details"><summary>Methodology and limitations</summary><b>Calculation basis</b><ul>{result.methodology.map((x,i)=><li key={i}>{x}</li>)}</ul><b>Limitations</b><ul>{result.limitations.map((x,i)=><li key={i}>{x}</li>)}</ul></details>
      </>}
    </article></div>
    <p className="source-note">Reference basis: NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments (2016), with simplified workload limits reproduced by OSHA. The app's LOW/MODERATE/HIGH/EXTREME bands are screening bands created for this prototype, not official NIOSH categories. Site-specific work/rest schedules require qualified occupational-safety review.</p>
  </div>
}
