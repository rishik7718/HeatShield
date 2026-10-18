export type Risk='LOW'|'MODERATE'|'HIGH'|'EXTREME'
export interface Zone{id:string;name:string;location:string;wbgt_c:number;risk:Risk;work_minutes:number;rest_minutes:number;workers:number}
export interface Overview{site_name:string;site_status:string;active_workers:number;high_risk_zones:number;breaks_due:number;compliance_pct:number;estimated_wages:number;zones:Zone[];hourly_wbgt:{time:string;wbgt:number;threshold:number}[];compliance:{day:string;compliant:number;total:number}[];alerts:{id:string;level:string;title:string;detail:string;time:string}[]}

export type HeatEnvironment='outdoor_sun'|'indoor_or_shade'
export type Workload='light'|'moderate'|'heavy'|'very_heavy'
export interface HeatRiskInput{dry_bulb_c:number;natural_wet_bulb_c:number;globe_temperature_c:number;environment:HeatEnvironment;workload:Workload;acclimatized:boolean;clothing_adjustment_c:number}
export interface HeatRiskResult{wbgt_c:number;clothing_adjustment_c:number;effective_wbgt_c:number;workload:Workload;acclimatized:boolean;reference_limit_c:number;limit_type:string;difference_from_limit_c:number;risk_level:Risk;status:string;actions:string[];methodology:string[];limitations:string[]}
