import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function CompaniesPage() {
 const [companies,setCompanies]=useState<{name:string;count:number}[]|null>(null); const [error,setError]=useState(false);
 useEffect(()=>{supabase.rpc("portal_market_summary").then(({data,error})=>{setCompanies(data?.companies||[]);setError(Boolean(error));});},[]);
 return <div className="container-max px-4 py-12"><h1 className="text-3xl font-bold">Empresas mencionadas nos anúncios</h1><p className="my-6 text-slate-500">As 20 empresas com mais vagas nas fontes conferidas da nossa base. A presença nesta lista não representa parceria, recomendação ou cadastro feito pela empresa no portal.</p>{error?<p role="alert">Não foi possível carregar as empresas.</p>:!companies?<p>Carregando...</p>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map(c=><section className="card p-5" key={c.name}><h2 className="text-lg font-semibold">{c.name}</h2><p className="mt-2 text-slate-500">{c.count} anúncios na base pública</p></section>)}</div>}<section className="card mt-10 p-6"><h2 className="text-xl font-semibold">Quer divulgar uma vaga da sua empresa?</h2><p className="my-4 text-slate-500">Crie seu cadastro, complete o perfil e envie sua vaga para revisão administrativa.</p><Link className="btn-primary" to="/cadastro">Cadastrar empresa</Link></section></div>;
}
