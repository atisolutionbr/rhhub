import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  Database,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Save,
  Plus,
  ExternalLink,
  RefreshCw,
  Cpu,
  DollarSign,
  Wifi,
  Server,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Job, UserProfile, Company, JobSource, ScrapingLog, SubscriptionPlan } from "../lib/types";
import { formatSalary, timeAgo, formatDate, seniorityLabel, modalityLabel } from "../lib/format";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { profile } = useAuth();

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "jobs", label: "Vagas", icon: Briefcase },
    { id: "users", label: "Usuários", icon: Users },
    { id: "companies", label: "Empresas", icon: Building2 },
    { id: "sources", label: "Fontes de Dados", icon: Database },
    { id: "logs", label: "Logs de Sincronização", icon: Activity },
    { id: "plans", label: "Planos", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-950 animate-fade-in">
      <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-60 flex-shrink-0">
            <div className="sticky top-20 rounded-xl border border-slate-800 bg-slate-900 p-2">
              <div className="mb-3 px-3 py-2">
                <div className="text-sm font-semibold text-white">{profile?.full_name || "Admin"}</div>
                <div className="text-xs text-primary-400">Administrador</div>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary-600/20 text-primary-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "jobs" && <JobsTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "companies" && <CompaniesTab />}
            {activeTab === "sources" && <SourcesTab />}
            {activeTab === "logs" && <LogsTab />}
            {activeTab === "plans" && <PlansTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({
    jobs: 0,
    users: 0,
    companies: 0,
    sources: 0,
    applications: 0,
    published: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("job_sources").select("id", { count: "exact", head: true }),
      supabase.from("job_applications").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]).then(([j, u, c, s, a, p]) => {
      setStats({
        jobs: j.count || 0,
        users: u.count || 0,
        companies: c.count || 0,
        sources: s.count || 0,
        applications: a.count || 0,
        published: p.count || 0,
      });
    });

    supabase
      .from("jobs")
      .select("*, company:companies(name)")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setRecentJobs((data as Job[]) || []));
  }, []);

  const [sources, setSources] = useState<JobSource[]>([]);

  useEffect(() => {
    supabase.from("job_sources").select("*").order("name").then(({ data }) => {
      setSources((data as JobSource[]) || []);
    });
  }, []);

  const crawlerStatus = sources.map((s) => ({
    name: s.name,
    status: s.is_active ? "online" : "offline",
    lastRun: s.last_synced_at ? timeAgo(s.last_synced_at) : "Nunca",
    jobsFound: s.jobs_found_total || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-slate-400">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: Briefcase, label: "Total de Vagas", value: stats.jobs, color: "text-blue-400" },
          { icon: CheckCircle2, label: "Publicadas", value: stats.published, color: "text-green-400" },
          { icon: Users, label: "Usuários", value: stats.users, color: "text-cyan-400" },
          { icon: Building2, label: "Empresas", value: stats.companies, color: "text-amber-400" },
          { icon: Database, label: "Fontes", value: stats.sources, color: "text-purple-400" },
          { icon: TrendingUp, label: "Candidaturas", value: stats.applications, color: "text-emerald-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <Icon className={`mb-2 h-6 w-6 ${stat.color}`} />
              <div className="text-2xl font-bold text-white">{stat.value.toLocaleString("pt-BR")}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Crawler Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">Painel de Crawling</h2>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Sistema ativo
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crawlerStatus.map((crawler) => (
            <div key={crawler.name} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">Crawler {crawler.name}</span>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  crawler.status === "online" ? "text-green-400" : "text-slate-500 dark:text-slate-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    crawler.status === "online" ? "animate-pulse bg-green-400" : "bg-slate-600"
                  }`} />
                  {crawler.status === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Ultima atualizacao: {crawler.lastRun}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Vagas encontradas: {crawler.jobsFound.toLocaleString("pt-BR")}
              </div>
            </div>
          ))}
          {crawlerStatus.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-slate-500 dark:text-slate-400">Nenhuma fonte configurada</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Vagas recentes</h2>
        <div className="space-y-2">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">{job.title}</div>
                <div className="text-xs text-slate-400">
                  {job.company?.name || "—"} · {job.external_source || "Interno"} · {timeAgo(job.created_at)}
                </div>
              </div>
              <span className={`badge ${job.status === "published" ? "bg-green-900/50 text-green-400" : "bg-slate-800 text-slate-400"}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*, company:companies(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setJobs((data as Job[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Excluir esta vaga?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Vagas</h1>

      <div className="flex gap-2">
        {["all", "published", "pending", "draft"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === f ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {f === "all" ? "Todas" : f === "published" ? "Publicadas" : f === "pending" ? "Pendentes" : "Rascunhos"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((job) => (
          <div key={job.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">{job.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {job.company?.name || "—"} · {seniorityLabel(job.seniority)} · {modalityLabel(job.modality)} · {timeAgo(job.created_at)}
                </div>
                {job.external_source && (
                  <div className="mt-1 text-xs text-slate-400">Fonte: {job.external_source}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={job.status}
                  onChange={(e) => updateStatus(job.id, e.target.value)}
                  className="input-field text-sm w-32"
                >
                  <option value="draft">Rascunho</option>
                  <option value="pending">Pendente</option>
                  <option value="published">Publicada</option>
                  <option value="closed">Fechada</option>
                </select>
                <button onClick={() => deleteJob(job.id)} className="text-slate-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers((data as UserProfile[]) || []);
        setLoading(false);
      });
  }, []);

  const updateType = async (id: string, userType: string) => {
    const { error } = await supabase.from("users").update({ user_type: userType }).eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, user_type: userType as any } : u)));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuários</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Verificado</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Alterar tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      u.user_type === "admin" ? "bg-primary-100 text-primary-700 dark:text-primary-400" :
                      u.user_type === "company" ? "bg-accent-100 text-accent-700 dark:text-accent-400" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {u.user_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.location_city || "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_verified ? <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" /> : <Clock className="h-4 w-4 text-slate-300" />}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.user_type}
                      onChange={(e) => updateType(u.id, e.target.value)}
                      className="input-field text-sm w-28"
                    >
                      <option value="candidate">Candidato</option>
                      <option value="company">Empresa</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("companies").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCompanies((data as Company[]) || []);
      setLoading(false);
    });
  }, []);

  const toggleVerify = async (id: string, current: boolean) => {
    const { error } = await supabase.from("companies").update({ is_verified: !current, verified_at: !current ? new Date().toISOString() : null }).eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, is_verified: !current } : c)));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Empresas</h1>
      <div className="space-y-3">
        {companies.map((c) => (
          <div key={c.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-400">
                {c.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {c.industry || "Tecnologia"} · {c.size || "—"} · {c.location_city || "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {c.is_verified ? (
                <span className="badge bg-green-100 text-green-700 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Verificada</span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700 dark:text-amber-400"><Clock className="h-3 w-3" /> Pendente</span>
              )}
              <button onClick={() => toggleVerify(c.id, c.is_verified)} className="btn-secondary text-sm">
                {c.is_verified ? "Desverificar" : "Verificar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesTab() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", source_type: "rss" });

  useEffect(() => {
    supabase.from("job_sources").select("*").order("name").then(({ data }) => {
      setSources((data as JobSource[]) || []);
      setLoading(false);
    });
  }, []);

  const createSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from("job_sources").insert({
      name: form.name,
      url: form.url || null,
      source_type: form.source_type,
      is_active: true,
    }).select("*").single();
    if (error) { alert(`Erro: ${error.message}`); return; }
    if (data) {
      setSources((prev) => [...prev, data as JobSource]);
      setForm({ name: "", url: "", source_type: "rss" });
      setShowForm(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("job_sources").update({ is_active: !current }).eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  };

  const deleteSource = async (id: string) => {
    if (!confirm("Excluir esta fonte?")) return;
    const { error } = await supabase.from("job_sources").delete().eq("id", id);
    if (error) { alert(`Erro: ${error.message}`); return; }
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fontes de Dados</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova fonte
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSource} className="card space-y-3 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">URL</label>
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
              <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="input-field">
                <option value="rss">RSS</option>
                <option value="api">API</option>
                <option value="scraping">Scraping</option>
                <option value="csv">CSV</option>
                <option value="webhook">Webhook</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Adicionar fonte</button>
        </form>
      )}

      <div className="space-y-3">
        {sources.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                  <span className={`badge ${s.is_active ? "bg-green-100 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                    {s.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Tipo: {s.source_type} · Vagas encontradas: {s.jobs_found_total} · Importadas: {s.jobs_imported_total}
                </div>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    {s.url} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(s.id, s.is_active)} className="text-slate-400 hover:text-primary-600 dark:text-primary-400">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button onClick={() => deleteSource(s.id)} className="text-slate-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("scraping_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setLogs((data as ScrapingLog[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Logs de Sincronização</h1>
      {logs.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Activity className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum log de sincronização ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    log.status === "success" ? "bg-green-100 text-green-700 dark:text-green-400" :
                    log.status === "error" ? "bg-red-100 text-red-700 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:text-amber-400"
                  }`}>
                    {log.status === "success" ? <CheckCircle2 className="h-3 w-3" /> :
                     log.status === "error" ? <AlertCircle className="h-3 w-3" /> :
                     <Clock className="h-3 w-3" />}
                    {log.status}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">{log.source_name}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(log.created_at)}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Encontradas: {log.jobs_found} · Importadas: {log.jobs_imported} · Atualizadas: {log.jobs_updated}
              </div>
              {log.error_message && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">{log.error_message}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").order("sort_order").then(({ data }) => {
      setPlans((data as SubscriptionPlan[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planos de Assinatura</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              {plan.is_free && <span className="badge bg-green-100 text-green-700 dark:text-green-400">Grátis</span>}
            </div>
            <div className="mt-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
              R$ {(plan.price_cents / 100).toFixed(2).replace(".", ",")}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mês</span>
            </div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {plan.max_applications_per_day} candidaturas/dia
            </div>
            <ul className="mt-3 space-y-1">
              {plan.features?.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-primary-600 dark:text-primary-400" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <span className={`badge ${plan.is_active ? "bg-green-100 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                {plan.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
