import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Edit,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Job, JobApplication, Company } from "../lib/types";
import {
  formatSalary,
  timeAgo,
  seniorityLabel,
  modalityLabel,
  employmentLabel,
  formatDate,
} from "../lib/format";

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadError(null);
      const { data: compData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setCompany(compData as Company | null);

      if (compData) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", compData.id)
          .order("created_at", { ascending: false });
        setJobs((jobsData as Job[]) || []);

        const { data: appsData } = await supabase
          .from("job_applications")
          .select("*, job:jobs(*)")
          .in("job_id", (jobsData as Job[])?.map((j) => j.id) || [])
          .order("created_at", { ascending: false });
        const { data: applicants, error: applicantError } = await supabase.rpc("company_applicants");
        if (applicantError) setLoadError("Não foi possível carregar os dados dos candidatos. Atualize a página para tentar novamente.");
        const byApplication = new Map((applicants || []).map((row: any) => [row.application_id, row]));
        setApplications(((appsData as JobApplication[]) || []).map(app => ({
          ...app, applicant: byApplication.get(app.id) as JobApplication["applicant"],
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "jobs", label: "Minhas Vagas", icon: Briefcase },
    { id: "applications", label: "Candidatos", icon: Users },
    { id: "company", label: "Perfil da Empresa", icon: Building2 },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen animate-fade-in">
      <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-60 flex-shrink-0">
            <div className="card p-2 sticky top-20">
              <div className="mb-3 px-3 py-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{company?.name || profile?.full_name || "Empresa"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{company?.industry || "Tecnologia"}</div>
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
                          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800"
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
            {loadError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
            {activeTab === "overview" && <OverviewTab jobs={jobs} applications={applications} company={company} />}
            {activeTab === "jobs" && <JobsTab jobs={jobs} company={company} setJobs={setJobs} />}
            {activeTab === "applications" && <ApplicationsTab applications={applications} setApplications={setApplications} />}
            {activeTab === "company" && <CompanyTab company={company} setCompany={setCompany} user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ jobs, applications, company }: { jobs: Job[]; applications: JobApplication[]; company: Company | null }) {
  const publishedJobs = jobs.filter((j) => j.status === "published");
  const pendingApps = applications.filter((a) => a.status === "pending");
  const acceptedApps = applications.filter((a) => a.status === "hired");
  const totalViews = jobs.reduce((sum, j) => sum + (j.view_count || 0), 0);
  const conversionRate = totalViews > 0 ? ((applications.length / totalViews) * 100).toFixed(1) : "0";

  // Calculate avg time to hire (days between first app and accepted)
  const acceptedWithDates = acceptedApps.filter((a) => a.created_at);
  const avgTimeToHire = acceptedWithDates.length > 0
    ? Math.round(acceptedWithDates.reduce((sum, a) => {
        const days = Math.floor((Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / acceptedWithDates.length)
    : 0;

  const statuses = [
    { statuses: ["pending"], name: "Pendentes", color: "bg-blue-500" },
    { statuses: ["reviewed", "shortlisted", "interview", "offer"], name: "Em processo seletivo", color: "bg-amber-500" },
    { statuses: ["hired"], name: "Contratados", color: "bg-emerald-500" },
    { statuses: ["rejected", "withdrawn"], name: "Encerradas", color: "bg-purple-500" },
  ];
  const sources = statuses.map(item => ({ ...item,
    pct: applications.length ? Math.round(100 * applications.filter(app => item.statuses.includes(app.status)).length / applications.length) : 0,
  }));
  const viewedJobs = [...jobs].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6);
  const maxViews = Math.max(1, ...viewedJobs.map(job => job.view_count || 0));

  const statCards = [
    { icon: Briefcase, label: "Vagas Ativas", value: publishedJobs.length, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
    { icon: Users, label: "Candidatos", value: applications.length, color: "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" },
    { icon: Clock, label: "Idade média das candidaturas contratadas (dias)", value: avgTimeToHire, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600" },
    { icon: TrendingUp, label: "Conversão", value: `${conversionRate}%`, color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company?.name || "Empresa"}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Painel de controle da empresa</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Views chart */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Visualizações</h2>
          {viewedJobs.length ? <div className="space-y-3">
            {viewedJobs.map(job => <div key={job.id}>
              <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{job.title}</span><span>{job.view_count || 0}</span></div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-2 rounded-full bg-primary-500" style={{ width: `${100 * (job.view_count || 0) / maxViews}%` }} /></div>
            </div>)}
          </div> : <p className="text-sm text-slate-500">Publique uma vaga para acompanhar as visualizações.</p>}
          <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Total: {totalViews} visualizações</div>
        </div>

        {/* Candidate sources */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Status das candidaturas</h2>
          <div className="space-y-3">
            {sources.map((src) => (
              <div key={src.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{src.name}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{src.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-2 rounded-full ${src.color}`} style={{ width: `${src.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Vagas recentes</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Você ainda não publicou nenhuma vaga</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                to={`/vagas/${job.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900 dark:text-white">{job.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {seniorityLabel(job.seniority)} · {modalityLabel(job.modality)} · {timeAgo(job.created_at)}
                  </div>
                </div>
                <span className={`badge ${job.status === "published" ? "bg-green-100 text-green-700 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:text-amber-400"}`}>
                  {job.status === "published" ? "Publicada" : job.status === "draft" ? "Rascunho" : job.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobsTab({ jobs, company, setJobs }: { jobs: Job[]; company: Company | null; setJobs: React.Dispatch<React.SetStateAction<Job[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    salary_min: "",
    salary_max: "",
    location_city: "",
    modality: "remote",
    seniority: "mid",
    employment_type: "clt",
    technologies: "",
  });

  const startEdit = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      location_city: job.location_city || "",
      modality: job.modality || "remote",
      seniority: job.seniority || "mid",
      employment_type: job.employment_type || "clt",
      technologies: job.technologies?.join(", ") || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const jobData = {
      company_id: company.id,
      title: form.title,
      slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: form.description || "Sem descrição",
      requirements: form.requirements || null,
      benefits: form.benefits || null,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      salary_currency: "BRL",
      salary_period: "monthly",
      location_city: form.location_city || null,
      modality: form.modality,
      seniority: form.seniority === "intern" ? "junior" : form.seniority,
      employment_type: form.employment_type,
      is_internal: true,
      technologies: form.technologies.split(",").map((s) => s.trim()).filter(Boolean),
      status: "published",
      published_at: new Date().toISOString(),
    };

    setSubmitting(true);
    setFeedback(null);

    if (editingJob) {
      const { data, error } = await supabase.from("jobs").update(jobData).eq("id", editingJob.id).select("*").single();
      if (error) {
        setFeedback({ type: "error", message: `Erro ao atualizar vaga: ${error.message}` });
      } else if (data) {
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? data as Job : j)));
        setFeedback({ type: "success", message: "Vaga atualizada com sucesso!" });
        setShowForm(false);
        setEditingJob(null);
        setForm({ title: "", description: "", requirements: "", benefits: "", salary_min: "", salary_max: "", location_city: "", modality: "remote", seniority: "mid", employment_type: "clt", technologies: "" });
      }
    } else {
      const { data, error } = await supabase.from("jobs").insert(jobData).select("*").single();
      if (error) {
        setFeedback({ type: "error", message: `Erro ao publicar vaga: ${error.message}` });
      } else if (data) {
        setJobs((prev) => [data as Job, ...prev]);
        setFeedback({ type: "success", message: "Vaga publicada com sucesso!" });
        setShowForm(false);
        setForm({ title: "", description: "", requirements: "", benefits: "", salary_min: "", salary_max: "", location_city: "", modality: "remote", seniority: "mid", employment_type: "clt", technologies: "" });
      }
    }

    setSubmitting(false);
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta vaga?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      setFeedback({ type: "error", message: `Erro ao excluir vaga: ${error.message}` });
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setFeedback({ type: "success", message: "Vaga excluída com sucesso." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minhas Vagas</h1>
        <button
          onClick={() => {
            setEditingJob(null);
            setFeedback(null);
            setForm({ title: "", description: "", requirements: "", benefits: "", salary_min: "", salary_max: "", location_city: "", modality: "remote", seniority: "mid", employment_type: "clt", technologies: "" });
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Nova vaga
        </button>
      </div>

      {feedback && (
        <div className={`rounded-lg p-4 text-sm ${
          feedback.type === "success"
            ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900"
            : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900"
        }`}>
          {feedback.message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título da vaga</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Ex: Desenvolvedor Frontend React" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Modalidade</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })} className="input-field">
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Senioridade</label>
              <select value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value })} className="input-field">
                <option value="junior">Júnior</option>
                <option value="mid">Pleno</option>
                <option value="senior">Sênior</option>
                <option value="lead">Tech Lead</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de contratação</label>
              <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="input-field">
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
                <option value="freelance">Freelancer</option>
                <option value="internship">Estágio</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário mínimo</label>
              <input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} className="input-field" placeholder="5000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário máximo</label>
              <input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} className="input-field" placeholder="8000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
              <input type="text" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="input-field" placeholder="São Paulo" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tecnologias (separadas por vírgula)</label>
            <input type="text" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} className="input-field" placeholder="React, TypeScript, Node.js" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Requisitos</label>
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={4} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Benefícios</label>
            <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={3} className="input-field" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary"><Save className="h-4 w-4" /> {submitting ? "Salvando..." : editingJob ? "Atualizar" : "Publicar"} vaga</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {jobs.length === 0 && !showForm ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Briefcase className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma vaga publicada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link to={`/vagas/${job.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-primary-700 dark:text-primary-400">
                    {job.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{seniorityLabel(job.seniority)}</span>
                    <span>·</span>
                    <span>{modalityLabel(job.modality)}</span>
                    <span>·</span>
                    <span>{employmentLabel(job.employment_type)}</span>
                    <span>·</span>
                    <span>{formatSalary(job.salary_min, job.salary_max, job.salary_period)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {job.application_count || 0} candidaturas · {job.view_count || 0} visualizações · {timeAgo(job.created_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${job.status === "published" ? "bg-green-100 text-green-700 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:text-amber-400"}`}>
                    {job.status === "published" ? "Publicada" : "Rascunho"}
                  </span>
                  <button onClick={() => startEdit(job)} className="text-slate-400 hover:text-primary-600 dark:text-primary-400">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteJob(job.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsTab({ applications, setApplications }: { applications: JobApplication[]; setApplications: React.Dispatch<React.SetStateAction<JobApplication[]>> }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadResume = async (app: JobApplication) => {
    if (!app.applicant?.resume_url) return;
    setDownloading(app.id);
    setFeedback(null);
    try {
      const { data, error } = await supabase.storage.from("resumes").download(app.applicant.resume_url);
      if (error || !data) throw new Error("download");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = app.applicant.resume_url.split("/").pop() || "curriculo";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setFeedback("Não foi possível baixar o currículo. O arquivo pode estar indisponível."); }
    finally { setDownloading(null); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
    if (error) {
      setFeedback(`Erro ao atualizar status: ${error.message}`);
      return;
    }
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidatos</h1>
      {feedback && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
          {feedback}
        </div>
      )}
      {applications.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma candidatura recebida ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white">{app.job?.title}</div>
                  <div className="mt-2 font-medium text-slate-900 dark:text-white">{app.applicant?.full_name || "Candidato"}</div>
                  {app.applicant?.headline && <p className="text-sm text-slate-500">{app.applicant.headline}</p>}
                  {app.applicant?.email && <a className="block text-sm text-primary-600" href={`mailto:${app.applicant.email}`}>{app.applicant.email}</a>}
                  {app.applicant?.phone && <p className="text-sm text-slate-500">{app.applicant.phone}</p>}
                  {app.applicant?.resume_url && <button type="button" className="btn-secondary mt-2 text-sm" disabled={downloading === app.id} onClick={() => downloadResume(app)}>
                    {downloading === app.id ? "Baixando..." : "Baixar currículo"}
                  </button>}
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Candidatura recebida em {formatDate(app.created_at)}
                  </div>
                  {app.cover_letter && (
                    <p className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-600 dark:text-slate-400">
                      {app.cover_letter}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="pending">Pendente</option>
                    <option value="reviewed">Em análise</option>
                    <option value="shortlisted">Pré-selecionado</option>
                    <option value="interview">Entrevista</option>
                    <option value="offer">Proposta</option>
                    <option value="hired">Contratado</option>
                    <option value="rejected">Recusada</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyTab({ company, setCompany, user }: { company: Company | null; setCompany: React.Dispatch<React.SetStateAction<Company | null>>; user: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    website_url: "",
    size: "",
    industry: "",
    location_city: "",
    location_state: "",
    linkedin_url: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        description: company.description || "",
        website_url: company.website_url || "",
        size: company.size || "",
        industry: company.industry || "",
        location_city: company.location_city || "",
        location_state: company.location_state || "",
        linkedin_url: company.linkedin_url || "",
      });
    }
  }, [company]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    if (company) {
      const { data, error } = await supabase
        .from("companies")
        .update({
          name: form.name,
          description: form.description || null,
          website_url: form.website_url || null,
          size: form.size || null,
          industry: form.industry || null,
          location_city: form.location_city || null,
          location_state: form.location_state || null,
          linkedin_url: form.linkedin_url || null,
        })
        .eq("id", company.id)
        .select("*")
        .single();
      if (error) {
        alert(`Erro ao atualizar empresa: ${error.message}`);
        setSaving(false);
        return;
      }
      if (data) setCompany(data as Company);
    } else {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          name: form.name,
          slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          description: form.description || null,
          website_url: form.website_url || null,
          size: form.size || null,
          industry: form.industry || null,
          location_city: form.location_city || null,
          location_state: form.location_state || null,
          linkedin_url: form.linkedin_url || null,
        })
        .select("*")
        .single();
      if (error) {
        alert(`Erro ao criar empresa: ${error.message}`);
        setSaving(false);
        return;
      }
      if (data) setCompany(data as Company);
    }

    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil da Empresa</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            <Edit className="h-4 w-4" /> Editar
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="card space-y-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-2xl font-bold text-primary-700 dark:text-primary-400">
            {form.name?.charAt(0) || "?"}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{form.name || "Sem nome"}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{form.industry || "Tecnologia"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da empresa</label>
            <input type="text" required disabled={!editing} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Indústria</label>
            <input type="text" disabled={!editing} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" placeholder="Tecnologia" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
          <textarea disabled={!editing} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field disabled:bg-slate-50 dark:bg-slate-950" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
            <input type="url" disabled={!editing} value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn</label>
            <input type="url" disabled={!editing} value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tamanho</label>
            <select disabled={!editing} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950">
              <option value="">Selecione...</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="500+">500+</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
            <input type="text" disabled={!editing} value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
            <input type="text" disabled={!editing} value={form.location_state} onChange={(e) => setForm({ ...form, location_state: e.target.value })} className="input-field disabled:bg-slate-50 dark:bg-slate-950" />
          </div>
        </div>

        {editing && (
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
          </div>
        )}
      </form>
    </div>
  );
}
