import { Link } from "react-router-dom";
import {
  Briefcase,
  TrendingUp,
  Users,
  Heart,
  Zap,
  Target,
  Globe,
  Coffee,
  GraduationCap,
  Award,
  ArrowRight,
  MapPin,
  Check,
} from "lucide-react";

const values = [
  { icon: Target, title: "Foco no resultado", desc: "Entregamos valor real para candidatos e empresas todos os dias." },
  { icon: Heart, title: "Pessoas primeiro", desc: "Cada decisão passa pelo impacto na vida das pessoas que usam nossa plataforma." },
  { icon: Zap, title: "Velocidade com qualidade", desc: "Iteramos rápido, mas nunca sacrificamos a experiência do usuario." },
  { icon: Globe, title: "Impacto nacional", desc: "Conectamos talentos em todos os cantos do Brasil com as melhores empresas." },
];

const benefits = [
  { icon: Coffee, title: "Cafe e snacks", desc: "Cafezinho fresco o dia todo e frutas para manter a energia." },
  { icon: GraduationCap, title: "Desenvolvimento continuo", desc: "Workshops, cursos e mentorias pagos pela empresa." },
  { icon: Briefcase, title: "Home office flexivel", desc: "Trabalhe de onde estiver. Presencial apenas em reuniões-chave." },
  { icon: Award, title: "Premiacao por performance", desc: "Bonus trimestral para os melhores resultados do time." },
  { icon: Heart, title: "Saude mental", desc: "Sessoes com psicologo e dias de pausa quando precisar." },
  { icon: TrendingUp, title: "Plano de carreira", desc: "Caminho claro de crescimento com avaliação a cada 6 meses." },
];

const openPositions = [
  { title: "Desenvolvedor Frontend React", área: "Tecnologia", type: "Pleno", location: "Remoto" },
  { title: "Desenvolvedor Backend Node.js", área: "Tecnologia", type: "Senior", location: "Remoto" },
  { title: "Analista de Marketing Digital", área: "Marketing", type: "Junior", location: "Vitoria, ES" },
  { title: "Product Designer", área: "Produto", type: "Pleno", location: "Hibrido - Vitoria, ES" },
  { title: "Analista de Dados", área: "Dados", type: "Pleno", location: "Remoto" },
  { title: "Customer Success Manager", área: "Atendimento", type: "Senior", location: "Remoto" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 py-24">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(37,99,235,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.2) 0%, transparent 50%)"
        }} />
        <div className="container-max relative px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block rounded-full bg-primary-600/20 px-4 py-1.5 text-sm font-medium text-primary-400">
            Junte-se ao time Ati
          </span>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl">
            Transforme o mercado de trabalho brasileiro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Trabalhe com tecnologia de ponta para conectar milhares de candidatos as melhores vagas de tecnologia do país.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#vagas" className="btn-primary">
              Ver vagas abertas <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#cultura" className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800">
              Nossa cultura
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { icon: Users, value: "25+", label: "Colaboradores" },
              { icon: Briefcase, value: "10k+", label: "Vagas publicadas" },
              { icon: Globe, value: "27", label: "Estados atendidos" },
              { icon: TrendingUp, value: "3x", label: "Crescimento anual" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="mx-auto mb-2 h-8 w-8 text-primary-600 dark:text-primary-400" />
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="cultura" className="py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nossos valores</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">O que guia nossas decisoes todos os dias</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="card p-6 text-center transition-transform hover:-translate-y-1">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                    <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white dark:bg-slate-900 py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Benefícios e vantagens</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Cuidamos do nosso time para que eles possam dar o melhor de si</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="vagas" className="py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Vagas abertas</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Encontre seu proximo desafio no time Ati</p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {openPositions.map((pos) => (
              <div
                key={pos.title}
                className="card flex items-center justify-between p-5 transition-all hover:border-primary-300 hover:shadow-md"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{pos.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {pos.área}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3" /> {pos.type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {pos.location}
                    </span>
                  </div>
                </div>
                <Link to="/cadastro" className="btn-primary flex-shrink-0">
                  Candidatar <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Não encontrou sua vaga?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Envie seu currículo e te avisaremos quando surgir uma oportunidade que combine com seu perfil.
          </p>
          <Link to="/cadastro" className="btn-primary mt-8">
            Criar perfil e enviar currículo <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Check className="h-4 w-4 text-green-400" />
            Resposta em até 5 dias uteis
          </div>
        </div>
      </section>
    </div>
  );
}
