import { Link } from "react-router-dom";
export default function CareersPage() {
 return <div className="container-max px-4 py-12"><h1 className="text-3xl font-bold">Carreiras em tecnologia</h1><p className="my-6 text-slate-500">Explore oportunidades com origem identificada e prepare seu perfil profissional.</p><div className="grid gap-6 md:grid-cols-3">{[
 {title:"Encontrar oportunidades",text:"Consulte a fonte, as restrições de localização e a data de conferência de cada vaga.",to:"/vagas",action:"Buscar vagas"},
 {title:"Organizar seu perfil",text:"Cadastre suas informações e envie seu currículo em PDF ou DOCX.",to:"/candidato",action:"Meu perfil"},
 {title:"Consultar remuneração",text:"Valores divulgados pelos anunciantes, preservando moeda e período originais.",to:"/salarios",action:"Salários publicados"}
 ].map(x=><section className="card p-6" key={x.title}><h2 className="text-xl font-semibold">{x.title}</h2><p className="my-4 text-slate-500">{x.text}</p><Link className="btn-primary" to={x.to}>{x.action}</Link></section>)}</div><p className="mt-8 text-sm text-slate-500">Não há processo seletivo interno do Ati TechHub anunciado nesta página. As oportunidades disponíveis estão na busca de vagas.</p></div>;
}
