import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatSalary } from "../lib/format";
import type { Job } from "../lib/types";
export default function SalariesPage() {
 const [jobs,setJobs]=useState<Job[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(false);
 useEffect(()=>{supabase.from("live_jobs").select("*, company:companies(name)").eq("status","published").eq("data_verified",true).or("salary_min.not.is.null,salary_max.not.is.null,salary_text.not.is.null").order("published_at",{ascending:false}).limit(50).then(({data,error})=>{setJobs(data||[]);setError(Boolean(error));setLoading(false);});},[]);
 return <div className="container-max px-4 py-12"><h1 className="text-3xl font-bold">Salários divulgados nas vagas</h1><p className="my-6 text-slate-500">As 50 oportunidades mais recentes com remuneração informada pela fonte. Não são estimativas ou médias de mercado. Compare moeda, período e condições antes de se candidatar.</p>{loading?<p>Carregando...</p>:error?<p role="alert">Não foi possível consultar as remunerações.</p>:!jobs.length?<p className="card p-6">Ainda não há remuneração publicada pelas fontes consultadas. Valores não informados não serão estimados.</p>:<div className="grid gap-4 md:grid-cols-2">{jobs.map(j=><Link className="card p-6" to={`/vagas/${j.id}`} key={j.id}><h2 className="text-lg font-semibold">{j.title}</h2><p className="my-2 text-slate-500">{j.company?.name} · {j.external_source}</p><strong className="text-primary-600">{j.salary_text||formatSalary(j.salary_min,j.salary_max,j.salary_period,j.salary_currency)}</strong></Link>)}</div>}</div>;
}
