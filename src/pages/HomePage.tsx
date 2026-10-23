import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  Code2,
  Brain,
  Shield,
  Sparkles,
  Star,
  Award,
  Cpu,
  DollarSign,
  BookOpen,
  Rocket,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Job, Category, Company } from "../lib/types";
import { formatSalary, timeAgo, seniorityLabel, modalityLabel } from "../lib/format";

const codeSnippets = [
  "const dev = await hire();",
  "npm install career",
  "git push origin main",
  "docker run -d success",
  "if (job.match > 90) apply();",
  "SELECT * FROM vagas WHERE tech=true",
  "async function findJob() {}",
  "const salary = await negotiate();",
  "export default Developer;",
  "import { Job } from 'ati-hub';",
  "while (searching) keepGoing();",
  "return match(candidate, job);",
  "const skills = ['React', 'Node'];",
  "await interview.schedule();",
  "class TechCareer extends Life {}",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [newJobsToday, setNewJobsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const particles = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      duration: `${3 + Math.random() * 5}s`,
      delay: `${Math.random() * 5}s`,
    })), []);

  const codeLines = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      left: `${5 + (i * 8)}%`,
      delay: `${i * 0.8}s`,
      duration: `${8 + Math.random() * 6}s`,
      text: codeSnippets[i % codeSnippets.length],
    })), []);

  const animatedLines = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      top: `${15 + i * 14}%`,
      width: `${40 + Math.random() * 40}%`,
      left: `${Math.random() * 30}%`,
      delay: `${i * 0.5}s`,
    })), []);

  useEffect(() => {
    const fetchData = async () => {
      const [jobsRes, catRes, compRes, compCountRes, countRes, candidatesRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("*, company:companies(*)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("categories").select("*").order("sort_order"),
        supabase
          .from("companies")
          .select("*")
          .order("is_verified", { ascending: false })
          .limit(8),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("user_type", "candidate"),
      ]);

      setFeaturedJobs((jobsRes.data as Job[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setTopCompanies((compRes.data as Company[]) || []);
      setTotalJobs(countRes.count || 0);
      setTotalCandidates(candidatesRes.count || 0);
      setTotalCompanies(compCountRes.count || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gte("created_at", today.toISOString());
      setNewJobsToday(todayCount || 0);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (searchLocation) params.set("loc", searchLocation);
    navigate(`/vagas?${params.toString()}`);
  };

  const categoryIcons: Record<string, React.ElementType> = {
    Desenvolvimento: Code2,
    Frontend: Code2,
    Backend: Code2,
    Mobile: Code2,
    "Full Stack": Code2,
    "Data Science": Brain,
    DevOps: Zap,
    "QA & Testing": CheckCircle2,
    Product: Target,
    Design: Sparkles,
    Leadership: Users,
    Security: Shield,
  };

  const stats = [
    { icon: Briefcase, label: "Vagas Ativas", value: totalJobs.toLocaleString("pt-BR"), color: "text-blue-400" },
    { icon: Building2, label: "Empresas", value: totalCompanies.toLocaleString("pt-BR"), color: "text-cyan-400" },
    { icon: Users, label: "Candidatos", value: totalCandidates.toLocaleString("pt-BR"), color: "text-emerald-400" },
    { icon: TrendingUp, label: "Novas hoje", value: newJobsToday.toLocaleString("pt-BR"), color: "text-amber-400" },
  ];

  const atiFeatures = [
    { icon: Cpu, name: "Ati Match", desc: "IA faz matching entre vaga e candidato", color: "from-blue-500 to-cyan-500" },
    { icon: FileText, name: "Ati Resume", desc: "IA cria currículo perfeito", color: "from-emerald-500 to-teal-500" },
    { icon: Brain, name: "Ati Interview", desc: "Simulador de entrevista com IA", color: "from-purple-500 to-pink-500" },
    { icon: DollarSign, name: "Ati Salary", desc: "Descobre o salário ideal", color: "from-amber-500 to-orange-500" },
    { icon: Rocket, name: "Ati Mentor", desc: "IA responde dúvidas de carreira", color: "from-rose-500 to-red-500" },
    { icon: BookOpen, name: "Ati Academy", desc: "Cursos e certificados", color: "from-indigo-500 to-blue-500" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Dark with particles */}
      <section className="relative overflow-hidden bg-slate-950 min-h-[90vh] flex items-center">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p, i) => (
            <div
              key={i}
              className="particle bg-blue-400"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animation: `particleFloat ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Code rain */}
        <div className="absolute inset-0 overflow-hidden">
          {codeLines.map((line, i) => (
            <div
              key={i}
              className="code-stream"
              style={{
                left: line.left,
                animationDelay: line.delay,
                animationDuration: line.duration,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Animated lines */}
        <div className="absolute inset-0 overflow-hidden">
          {animatedLines.map((line, i) => (
            <div
              key={i}
              className="animated-line"
              style={{
                top: line.top,
                width: line.width,
                left: line.left,
                animationDelay: line.delay,
              }}
            />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />

        {/* Content */}
        <div className="relative container-max px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
              <Sparkles className="h-4 w-4" />
              {newJobsToday > 0 ? `${newJobsToday} novas vagas hoje` : "Vagas atualizadas diariamente"}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Encontre todas as vagas de{" "}
              <span className="shimmer-text">tecnologia</span>
              <br />
              em um único lugar
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
              Mais de {totalJobs.toLocaleString("pt-BR")} vagas, atualizadas diariamente por inteligência artificial.
              {" "}{newJobsToday > 0 && `${newJobsToday} novas vagas nos últimos dias. Candidate-se agora.`}
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-2 rounded-lg px-3">
                <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cargo, tecnologia ou palavra-chave"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border-l border-slate-700 px-3 sm:border-l-0">
                <MapPin className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Localização"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primary flex-shrink-0">
                Buscar Vagas
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <span>Populares:</span>
              {["React", "Python", "Node.js", "DevOps", "Remoto"].map((tag) => (
                <Link
                  key={tag}
                  to={`/vagas?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Real-time stats */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="dark-card stat-count flex flex-col items-center gap-2 p-5 text-center"
                >
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ATI Features */}
      <section className="bg-slate-950 section-padding">
        <div className="container-max">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Recursos <span className="text-primary-400">Ati</span>
            </h2>
            <p className="mt-2 text-slate-400">Ferramentas inteligentes para acelerar sua carreira</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {atiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="dark-card group flex items-start gap-4 p-5 hover:scale-[1.02] transition-transform"
                >
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-slate-50 dark:bg-slate-950">
        <div className="container-max">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Explore por categoria</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Encontre vagas na sua área de interesse</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.name] || Code2;
              return (
                <Link
                  key={cat.id}
                  to={`/vagas?cat=${cat.slug}`}
                  className="card group flex flex-col items-center gap-3 p-6 text-center hover:border-primary-300"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100 dark:bg-primary-900/30 dark:group-hover:bg-primary-900/50">
                    <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="bg-slate-100 section-padding dark:bg-slate-900">
        <div className="container-max">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Vagas em destaque</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">As melhores oportunidades de agora</p>
            </div>
            <Link
              to="/vagas"
              className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 sm:flex"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/vagas/${job.id}`}
                  className="card group flex flex-col p-5 hover:border-primary-300"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {job.company?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                          {job.company?.name || "Empresa"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {job.location_city || "Brasil"}
                        </div>
                      </div>
                    </div>
                    {job.company?.is_verified && (
                      <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                    {job.title}
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {seniorityLabel(job.seniority)}
                    </span>
                    <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {modalityLabel(job.modality)}
                    </span>
                    {job.technologies?.slice(0, 2).map((tech) => (
                      <span key={tech} className="badge bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/vagas" className="btn-primary">
              Ver todas as vagas
            </Link>
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="section-padding bg-slate-50 dark:bg-slate-950">
        <div className="container-max">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Empresas que confiam no portal</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">As melhores empresas de tecnologia</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {topCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/empresas`}
                className="card group flex items-center gap-3 p-4 hover:border-primary-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-lg font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {company.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                    {company.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {company.industry || "Tecnologia"}
                  </div>
                </div>
                {company.is_verified && (
                  <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-950 section-padding">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative container-max text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Pronto para dar o próximo passo na sua carreira?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Crie sua conta gratuita e comece a se candidatar às melhores vagas
            de tecnologia hoje mesmo.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Criar conta gratuita <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
