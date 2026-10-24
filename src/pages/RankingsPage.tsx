import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
type Item = {name:string;count:number};
type Summary = {total:number;sources:Item[];companies:Item[];technologies:Item[];last_checked_at:string|null};
export default function RankingsPage() {
 const [data,setData]=useState<Summary|null>(null); const [error,setError]=useState(false);
 useEffect(()=>{supabase.rpc("portal_market_summary").then(({data,error})=>{setData(data);setError(Boolean(error));});},[]);
 return <div className="container-max px-4 py-12"><h1 className="text-3xl font-bold">Distribuição das vagas do portal</h1><p className="my-6 text-slate-500">Contagens dos anúncios publicados e conferidos da nossa base. Não são avaliações de empregadores nem um ranking de todo o mercado.</p>{error?<p role="alert">Não foi possível carregar os dados.</p>:!data?<p>Carregando...</p>:<><p>{data.total.toLocaleString("pt-BR")} vagas na base pública. {data.last_checked_at && `Última conferência: ${new Date(data.last_checked_at).toLocaleString("pt-BR")}.`}</p><div className="mt-8 grid gap-6 md:grid-cols-3">{[{title:"Por fonte",items:data.sources},{title:"Empresas com mais anúncios na base",items:data.companies},{title:"Tecnologias mencionadas nos anúncios",items:data.technologies}].map(group=><section className="card p-6" key={group.title}><h2 className="mb-4 text-xl font-semibold">{group.title}</h2>{group.items.length?<ol className="space-y-3">{group.items.map(x=><li className="flex justify-between gap-3" key={x.name}><span>{x.name||"Fonte não informada"}</span><strong>{x.count.toLocaleString("pt-BR")}</strong></li>)}</ol>:<p>Sem dados suficientes.</p>}</section>)}</div></>}</div>;
}
