import { Link } from "react-router-dom";
import { Play, ArrowRight, Briefcase, Search, User, Building2, TrendingUp } from "lucide-react";

export default function DemoPage() {
  const steps = [
    { icon: Search, title: "Buscar vagas", desc: "Pesquise entre mais de 5.000 vagas de tecnologia unificadas de vários portais." },
    { icon: User, title: "Criar perfil", desc: "Monte seu perfil de candidato com informações profissionais e preferências." },
    { icon: Briefcase, title: "Se candidatar", desc: "Candidate-se às vagas com um clique e acompanhe o status das candidaturas." },
    { icon: Building2, title: "Publicar vagas", desc: "Empresas podem publicar vagas diretamente e gerenciar candidatos." },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen animate-fade-in">
      <div className="container-max px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <img src="/Logo_Portal_sem_fundo.png" alt="Ati TechHub" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Demo do Ati TechHub</h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            Veja como funciona o portal completo de empregos em tecnologia
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="card flex gap-4 p-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary-700 to-primary-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Pronto para experimentar?</h2>
          <p className="mt-2 text-primary-100">Crie sua conta gratuita e comece agora mesmo</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/cadastro" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-6 py-3 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:bg-primary-900/30">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/vagas" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white dark:bg-slate-900/10">
              Explorar vagas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
