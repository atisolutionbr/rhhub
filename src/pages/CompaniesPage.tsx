import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  Users,
  Target,
  Zap,
  Award,
  BarChart3,
  ArrowRight,
  Phone,
  Star,
  Briefcase,
  Shield,
  Rocket,
} from "lucide-react";

export default function CompaniesPage() {
  const benefits = [
    { icon: TrendingUp, title: "Maior alcance de candidatos de TI", desc: "Acesse o maior banco de talentos de tecnologia do Brasil. Seu anúncio chega a milhares de profissionais qualificados." },
    { icon: Zap, title: "Publicação em segundos", desc: "Cadastre sua vaga em menos de 2 minutos e receba candidatos imediatamente." },
    { icon: Target, title: "Matching por IA", desc: "Nossa inteligência artificial encontra os candidatos mais compatíveis com sua vaga automaticamente." },
    { icon: BarChart3, title: "Dashboard completo", desc: "Acompanhe métricas, conversões, origem dos candidatos e tempo médio de contratação em tempo real." },
    { icon: Shield, title: "Empresas verificadas", desc: "Selo de verificação que aumenta a confiança dos candidatos e melhora a taxa de candidatura." },
    { icon: Award, title: "Destaque patrocinado", desc: "Coloque sua vaga em destaque na página inicial e na busca, recebendo até 5x mais visualizações." },
  ];

  const stats = [
    { value: "500+", label: "Empresas cadastradas" },
    { value: "50k+", label: "Candidatos ativos" },
    { value: "92%", label: "Taxa de match" },
    { value: "3x", label: "Mais rápido que concorrentes" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950" />
        <div className="relative container-max px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
              <Building2 className="h-4 w-4" />
              Para empresas
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              A melhor plataforma de vagas de{" "}
              <span className="shimmer-text">TI do Brasil</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Encontre os melhores profissionais de tecnologia em um só lugar.
              Publique vagas, receba candidatos qualificados e contrate mais rápido
              com inteligência artificial.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://wa.me/552735350168?text=Ol%C3%A1!%20Quero%20cadastrar%20minha%20empresa%20e%20publicar%20vagas%20no%20Ati%20TechHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98]"
              >
                <Phone className="h-5 w-5" />
                Falar no WhatsApp
              </a>
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                Criar conta grátis <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Atendimento: (27) 3535-0168
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-max px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-slate-50 dark:bg-slate-950">
        <div className="container-max">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Por que escolher o Ati TechHub?
            </h2>
            <p className="mt-3 text-lg text-slate-500 dark:text-slate-400">
              A plataforma mais completa para recrutar profissionais de tecnologia
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="card p-6 hover:border-primary-300">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-white dark:bg-slate-900">
        <div className="container-max">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Como funciona</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Comece em 3 passos simples</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: 1, icon: Building2, title: "Cadastre sua empresa", desc: "Crie sua conta gratuitamente e complete o perfil da empresa com logo, descrição e cultura." },
              { step: 2, icon: Briefcase, title: "Publique suas vagas", desc: "Anuncie vagas de tecnologia com todos os detalhes: salário, tecnologias, modalidade e benefícios." },
              { step: 3, icon: Rocket, title: "Receba candidatos", desc: "A IA faz o matching automaticamente e você recebe apenas candidatos compatíveis com a vaga." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="mb-2 text-sm font-bold text-primary-600 dark:text-primary-400">Passo {item.step}</div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-950 section-padding">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative container-max text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Pronto para contratar os melhores?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Junte-se a centenas de empresas que já encontraram seus talentos no Ati TechHub.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/552735350168?text=Ol%C3%A1!%20Quero%20cadastrar%20minha%20empresa%20e%20publicar%20vagas%20no%20Ati%20TechHub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              Falar no WhatsApp
            </a>
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              Criar conta grátis
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Atendimento: (27) 3535-0168
          </p>
        </div>
      </section>
    </div>
  );
}
