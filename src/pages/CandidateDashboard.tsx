import { useEffect, useState, useRef } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  Bell,
  User,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Check,
  Award,
  Flame,
  Zap,
  Trophy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { JobApplication, Favorite, JobAlert, CandidateProfile, Job } from "../lib/types";
import {
  formatSalary,
  timeAgo,
  seniorityLabel,
  modalityLabel,
  formatDate,
} from "../lib/format";
import { countries, getStatesByCountry, getCitiesByState } from "../lib/locations";
import { formatPhoneInput } from "../lib/phoneMask";

export default function CandidateDashboard() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen animate-fade-in">
      <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
        <CandidateLayout />
      </div>
    </div>
  );
}

function CandidateLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "applications", label: "Candidaturas", icon: Briefcase },
    { id: "favorites", label: "Favoritos", icon: Star },
    { id: "alerts", label: "Alertas", icon: Bell },
    { id: "profile", label: "Meu Perfil", icon: User },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-60 flex-shrink-0">
        <div className="card p-2 sticky top-20">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(`/candidato`);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
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
        {activeTab === "applications" && <ApplicationsTab />}
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ applications: 0, favorites: 0, alerts: 0, interviews: 0 });
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [gamification, setGamification] = useState<{ level: number; xp: number; badges: string[]; streak_days: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("job_alerts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "accepted"),
    ]).then(([apps, favs, alerts, interviews]) => {
      setStats({
        applications: apps.count || 0,
        favorites: favs.count || 0,
        alerts: alerts.count || 0,
        interviews: interviews.count || 0,
      });
    });

    supabase
      .from("job_applications")
      .select("*, job:jobs(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentApps((data as JobApplication[]) || []));

    // Calculate profile completion
    if (profile) {
      const fields = [
        profile.full_name, profile.location_city, profile.phone,
        profile.linkedin_url, profile.github_url, profile.portfolio_url,
      ];
      const filled = fields.filter((f) => f && f.trim()).length;
      setProfileCompletion(Math.round((filled / fields.length) * 100));
    }

    // Fetch or create gamification record
    supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setGamification(data as any);
        } else {
          // Auto-create with XP based on current activity
          const xp = stats.applications * 10 + profileCompletion * 5;
          const level = Math.floor(xp / 100) + 1;
          const badges: string[] = [];
          if (profileCompletion >= 80) badges.push("Perfil Completo");
          if (stats.applications >= 5) badges.push("Candidato Ativo");
          if (stats.interviews >= 1) badges.push("Primeira Entrevista");
          supabase
            .from("user_gamification")
            .insert({ user_id: user.id, xp, level, badges, streak_days: 1, last_activity: new Date().toISOString().split("T")[0] })
            .then(() => setGamification({ level, xp, badges, streak_days: 1 }));
        }
      });
  }, [user, profile]);

  const statCards = [
    { icon: User, label: "Perfil", value: `${profileCompletion}%`, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600" },
    { icon: Briefcase, label: "Candidaturas", value: stats.applications, color: "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" },
    { icon: CheckCircle2, label: "Entrevistas", value: stats.interviews, color: "bg-green-50 dark:bg-green-950/30 text-green-600" },
    { icon: Star, label: "Favoritos", value: stats.favorites, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Olá, {profile?.full_name || "Candidato"}!
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aqui está o resumo da sua atividade</p>
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

      {profileCompletion < 100 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Completude do perfil</h3>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{profileCompletion}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Complete seu perfil para aumentar suas chances de match</p>
        </div>
      )}

      {/* Gamification */}
      {gamification && (
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Seu progresso</h2>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-400">
              <Zap className="h-4 w-4" /> Nivel {gamification.level}
            </span>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">XP</span>
              <span className="font-semibold text-slate-900 dark:text-white">{gamification.xp} / {gamification.level * 100}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${Math.min((gamification.xp % 100), 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-center">
              <Flame className="mb-1 h-6 w-6 text-orange-500" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">{gamification.streak_days}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Dias seguidos</div>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-center">
              <Award className="mb-1 h-6 w-6 text-primary-500" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">{gamification.badges.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Medalhas</div>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-center">
              <Briefcase className="mb-1 h-6 w-6 text-blue-500" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.applications}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Candidaturas</div>
            </div>
          </div>

          {gamification.badges.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Medalhas conquistadas</h3>
              <div className="flex flex-wrap gap-2">
                {gamification.badges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white">
                    <Award className="h-3 w-3" /> {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Candidaturas recentes</h2>
        {recentApps.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Você ainda não se candidatou a nenhuma vaga</p>
            <Link to="/vagas" className="btn-primary mt-4">Buscar vagas</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                to={`/vagas/${app.job_id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900 dark:text-white">{app.job?.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(app.created_at)}</div>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ElementType }> = {
    pending: { color: "bg-amber-100 text-amber-700 dark:text-amber-400", icon: Clock },
    reviewing: { color: "bg-blue-100 text-blue-700 dark:text-blue-400", icon: AlertCircle },
    accepted: { color: "bg-green-100 text-green-700 dark:text-green-400", icon: CheckCircle2 },
    rejected: { color: "bg-red-100 text-red-700 dark:text-red-400", icon: XCircle },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`badge ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {status === "pending" ? "Pendente" : status === "reviewing" ? "Em análise" : status === "accepted" ? "Aceita" : "Recusada"}
    </span>
  );
}

function ApplicationsTab() {
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("job_applications")
      .select("*, job:jobs(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApps((data as JobApplication[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minhas Candidaturas</h1>
      {apps.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Briefcase className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma candidatura ainda</p>
          <Link to="/vagas" className="btn-primary mt-4">Buscar vagas</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={`/vagas/${app.job_id}`}
              className="card flex items-center justify-between p-4 hover:border-primary-300"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-white">{app.job?.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {app.job?.location_city || "Brasil"} · {formatDate(app.created_at)}
                </div>
                {app.cover_letter && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-1">{app.cover_letter}</p>
                )}
              </div>
              <StatusBadge status={app.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab() {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("*, job:jobs(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFavs((data as Favorite[]) || []);
        setLoading(false);
      });
  }, [user]);

  const removeFav = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) return;
    setFavs((prev) => prev.filter((f) => f.id !== id));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vagas Favoritas</h1>
      {favs.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Star className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma vaga salva ainda</p>
          <Link to="/vagas" className="btn-primary mt-4">Buscar vagas</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favs.map((fav) => (
            <div key={fav.id} className="card flex items-center justify-between p-4">
              <Link to={`/vagas/${fav.job_id}`} className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-white hover:text-primary-700">{fav.job?.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {fav.job?.location_city || "Brasil"} · {formatSalary(fav.job?.salary_min, fav.job?.salary_max, fav.job?.salary_period, fav.job?.salary_currency)}
                </div>
              </Link>
              <button onClick={() => removeFav(fav.id)} className="ml-3 text-slate-300 hover:text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsTab() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", keywords: "", locations: "", salary_min: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("job_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAlerts((data as JobAlert[]) || []);
        setLoading(false);
      });
  }, [user]);

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase
      .from("job_alerts")
      .insert({
        user_id: user.id,
        name: formData.name,
        keywords: formData.keywords.split(",").map((s) => s.trim()).filter(Boolean),
        locations: formData.locations.split(",").map((s) => s.trim()).filter(Boolean),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        is_active: true,
        frequency: "daily",
      })
      .select("*")
      .single();
    if (error) {
      alert(`Erro ao criar alerta: ${error.message}`);
      return;
    }
    if (data) {
      setAlerts((prev) => [data as JobAlert, ...prev]);
      setFormData({ name: "", keywords: "", locations: "", salary_min: "" });
      setShowForm(false);
    }
  };

  const toggleAlert = async (id: string, current: boolean) => {
    const { error } = await supabase.from("job_alerts").update({ is_active: !current }).eq("id", id);
    if (error) return;
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)));
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("job_alerts").delete().eq("id", id);
    if (error) return;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alertas de Vagas</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo alerta
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAlert} className="card space-y-3 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome do alerta</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Ex: Vagas React Remoto"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Palavras-chave (separadas por vírgula)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="input-field"
              placeholder="React, TypeScript, Frontend"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Localizações (separadas por vírgula)</label>
            <input
              type="text"
              value={formData.locations}
              onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
              className="input-field"
              placeholder="São Paulo, Remoto"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário mínimo</label>
            <input
              type="number"
              value={formData.salary_min}
              onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
              className="input-field"
              placeholder="5000"
            />
          </div>
          <button type="submit" className="btn-primary">Criar alerta</button>
        </form>
      )}

      {alerts.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Bell className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum alerta configurado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{alert.name}</h3>
                    <span className={`badge ${alert.is_active ? "bg-green-100 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      {alert.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {alert.keywords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {alert.keywords.map((k) => (
                        <span key={k} className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">{k}</span>
                      ))}
                    </div>
                  )}
                  {alert.locations?.length > 0 && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Localizações: {alert.locations.join(", ")}
                    </div>
                  )}
                  {alert.salary_min && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Salário mín: R$ {alert.salary_min.toLocaleString("pt-BR")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAlert(alert.id, alert.is_active)} className="text-slate-400 hover:text-primary-600">
                    <Bell className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} className="text-slate-300 hover:text-red-500">
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

function ProfileTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeParseMsg, setResumeParseMsg] = useState("");
  const [downloadingResume, setDownloadingResume] = useState(false);

  const handleResumeDownload = async () => {
    if (!form.resume_url) return;
    setDownloadingResume(true);
    try {
      const { data, error } = await supabase.storage.from("resumes").download(form.resume_url);
      if (error || !data) throw new Error("download");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = form.resume_url.split("/").pop() || "curriculo";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setResumeParseMsg("Não foi possível baixar o currículo. Tente novamente.");
    } finally { setDownloadingResume(false); }
  };
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    summary: "",
    location_country: "BR",
    location_state: "",
    location_city: "",
    phone: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    resume_url: "",
    desired_salary_min: "",
    desired_salary_max: "",
    availability: "",
    remote_preference: "",
  });

  // Normalize country: DB may store full name ("Brasil") or code ("BR"). Always work with code in the form.
  const countryNameToCode = (name: string): string => {
    if (!name) return "BR";
    const found = countries.find((c) => c.name === name || c.code === name);
    return found?.code || "BR";
  };
  const countryCodeToName = (code: string): string => {
    const found = countries.find((c) => c.code === code);
    return found?.name || code;
  };

  const availableStates = getStatesByCountry(form.location_country);
  const availableCities = getCitiesByState(form.location_country, form.location_state);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCandidateProfile(data as CandidateProfile | null);
        if (data) {
          setForm((prev) => ({
            ...prev,
            headline: data.headline || "",
            summary: data.summary || "",
            resume_url: data.resume_url || "",
            desired_salary_min: data.desired_salary_min?.toString() || "",
            desired_salary_max: data.desired_salary_max?.toString() || "",
            availability: data.availability || "",
            remote_preference: data.remote_preference || "",
          }));
        }
      });

    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        location_country: countryNameToCode(profile.location_country || "BR"),
        location_city: profile.location_city || "",
        location_state: profile.location_state || "",
        phone: profile.phone || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
      }));
    }
  }, [user, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError("");

    const { error: userError } = await supabase
      .from("users")
      .update({
        full_name: form.full_name,
        location_country: countryCodeToName(form.location_country) || null,
        location_city: form.location_city || null,
        location_state: form.location_state || null,
        phone: form.phone || null,
        linkedin_url: form.linkedin_url || null,
        github_url: form.github_url || null,
        portfolio_url: form.portfolio_url || null,
      })
      .eq("id", user.id);

    if (userError) {
      setSaveError("Erro ao salvar dados pessoais: " + userError.message);
      setSaving(false);
      return;
    }

    const profileData = {
      headline: form.headline || null,
      summary: form.summary || null,
      resume_url: form.resume_url || null,
      desired_salary_min: form.desired_salary_min ? parseInt(form.desired_salary_min) : null,
      desired_salary_max: form.desired_salary_max ? parseInt(form.desired_salary_max) : null,
      availability: form.availability || null,
      remote_preference: form.remote_preference || null,
    };

    if (candidateProfile) {
      const { error: cpError } = await supabase
        .from("candidate_profiles")
        .update(profileData)
        .eq("user_id", user.id);
      if (cpError) {
        setSaveError("Erro ao salvar perfil profissional: " + cpError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: cpError } = await supabase
        .from("candidate_profiles")
        .insert({ user_id: user.id, ...profileData });
      if (cpError) {
        setSaveError("Erro ao criar perfil profissional: " + cpError.message);
        setSaving(false);
        return;
      }
    }

    await refreshProfile();
    setSaving(false);
    setEditing(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setResumeParseMsg("Formato não suportado. Use PDF, DOC ou DOCX.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeParseMsg("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploadingResume(true);
    setResumeParseMsg("");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/resume-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (uploadError) {
      setResumeParseMsg("Erro ao enviar arquivo: " + uploadError.message);
      setUploadingResume(false);
      return;
    }

    setForm((prev) => ({ ...prev, resume_url: fileName }));
    setUploadingResume(false);
    setParsingResume(true);
    setResumeParseMsg("Lendo currículo...");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/parse-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ file_path: fileName, file_type: file.type }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setResumeParseMsg("Não foi possível ler o currículo: " + (errJson.error || res.status));
        setParsingResume(false);
        return;
      }

      const parsed = await res.json();
      // Only fill fields that are empty - never overwrite data the user already entered
      setForm((prev) => ({
        ...prev,
        full_name: prev.full_name ? prev.full_name : (parsed.full_name || ""),
        headline: prev.headline ? prev.headline : (parsed.headline || ""),
        summary: prev.summary ? prev.summary : (parsed.summary || ""),
        phone: prev.phone ? prev.phone : (parsed.phone || ""),
        location_city: prev.location_city ? prev.location_city : (parsed.location_city || ""),
        location_state: prev.location_state ? prev.location_state : (parsed.location_state || ""),
        location_country: prev.location_country ? prev.location_country : (countryNameToCode(parsed.location_country || "BR")),
        linkedin_url: prev.linkedin_url ? prev.linkedin_url : (parsed.linkedin_url || ""),
        github_url: prev.github_url ? prev.github_url : (parsed.github_url || ""),
        portfolio_url: prev.portfolio_url ? prev.portfolio_url : (parsed.portfolio_url || ""),
        desired_salary_min: prev.desired_salary_min ? prev.desired_salary_min : (parsed.desired_salary_min || ""),
        desired_salary_max: prev.desired_salary_max ? prev.desired_salary_max : (parsed.desired_salary_max || ""),
      }));
      const filledCount = Object.values(parsed).filter((v: unknown) => v && !(Array.isArray(v) && v.length === 0)).length;
      setResumeParseMsg(`Currículo lido! ${filledCount} campos pré-preenchidos. Revise e salve.`);
      setEditing(true);
    } catch (err) {
      setResumeParseMsg("Erro ao processar currículo: " + (err as Error).message);
    } finally {
      setParsingResume(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            Editar perfil
          </button>
        )}
      </div>

      {/* Resume Upload Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <FileText className="h-5 w-5 text-primary-700 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Currículo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Envie seu currículo. A leitura automática de PDF e DOCX ajuda a preencher seu perfil.</p>
          </div>
        </div>

        {form.resume_url ? (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800 flex-1">Currículo enviado: {form.resume_url.split("/").pop()}</span>
            <button type="button" onClick={handleResumeDownload} disabled={downloadingResume} className="btn-secondary">
              {downloadingResume ? "Baixando..." : "Baixar currículo"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-primary-700 dark:text-primary-400 hover:text-primary-800"
              >
                Trocar arquivo
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => editing && fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${editing ? "border-slate-300 hover:border-primary-400 hover:bg-primary-50 cursor-pointer" : "border-slate-200 dark:border-slate-800"}`}
          >
            {uploadingResume || parsingResume ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{uploadingResume ? "Enviando..." : "Lendo currículo..."}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {editing ? "Clique para enviar seu currículo" : "Nenhum currículo enviado"}
                </span>
                <span className="text-xs text-slate-400">PDF, DOC ou DOCX até 5MB</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleResumeUpload}
          className="hidden"
        />

        {resumeParseMsg && (
          <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${resumeParseMsg.includes("Erro") || resumeParseMsg.includes("não") ? "bg-red-50 dark:bg-red-950/30 text-red-800" : "bg-primary-50 dark:bg-primary-900/30 text-primary-800"}`}>
            <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{resumeParseMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="card space-y-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 dark:text-primary-400">
            {form.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{form.full_name || "Sem nome"}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome completo</label>
            <input
              type="text"
              disabled={!editing}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Headline / Título profissional</label>
            <input
              type="text"
              disabled={!editing}
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              placeholder="Ex: Desenvolvedor Frontend Sênior"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Resumo profissional</label>
          <textarea
            disabled={!editing}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={4}
            className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            placeholder="Conte um pouco sobre você..."
          />
        </div>

        {/* Country / State / City cascading dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">País</label>
            <select
              disabled={!editing}
              value={form.location_country}
              onChange={(e) => {
                const newCountry = e.target.value;
                setForm({ ...form, location_country: newCountry, location_state: "", location_city: "" });
              }}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
            <select
              disabled={!editing || availableStates.length === 0}
              value={form.location_state}
              onChange={(e) => setForm({ ...form, location_state: e.target.value, location_city: "" })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            >
              <option value="">{availableStates.length === 0 ? "Selecione o país" : "Selecione..."}</option>
              {availableStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
            {availableCities.length > 0 ? (
              <select
                disabled={!editing}
                value={form.location_city}
                onChange={(e) => setForm({ ...form, location_city: e.target.value })}
                className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              >
                <option value="">Selecione...</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled={!editing}
                value={form.location_city}
                onChange={(e) => setForm({ ...form, location_city: e.target.value })}
                className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
                placeholder="Digite a cidade"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
            <input
              type="tel"
              disabled={!editing}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value, form.location_country) })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              placeholder="+55 (00) 00000-0000"
            />
            <p className="mt-1 text-xs text-slate-400">
              DDI automático: {countries.find((c) => c.code === form.location_country)?.dialCode || "+55"}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Disponibilidade</label>
            <select
              disabled={!editing}
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            >
              <option value="">Selecione...</option>
              <option value="immediate">Imediata</option>
              <option value="15-days">15 dias</option>
              <option value="30-days">30 dias</option>
              <option value="60-days">60 dias</option>
              <option value="not-looking">Não estou buscando</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário desejado (mín)</label>
            <input
              type="number"
              disabled={!editing}
              value={form.desired_salary_min}
              onChange={(e) => setForm({ ...form, desired_salary_min: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário desejado (máx)</label>
            <input
              type="number"
              disabled={!editing}
              value={form.desired_salary_max}
              onChange={(e) => setForm({ ...form, desired_salary_max: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferência de modelo</label>
            <select
              disabled={!editing}
              value={form.remote_preference}
              onChange={(e) => setForm({ ...form, remote_preference: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
            >
              <option value="">Selecione...</option>
              <option value="remote">Remoto</option>
              <option value="hybrid">Híbrido</option>
              <option value="onsite">Presencial</option>
              <option value="any">Qualquer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn</label>
            <input
              type="url"
              disabled={!editing}
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">GitHub</label>
            <input
              type="url"
              disabled={!editing}
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Portfólio</label>
            <input
              type="url"
              disabled={!editing}
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-800"
              placeholder="https://..."
            />
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {editing && (
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
