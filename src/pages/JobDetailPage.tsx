import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Building2,
  ExternalLink,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
  User,
  FileText,
  Send,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Job, CandidateProfile } from "../lib/types";
import {
  formatSalary,
  timeAgo,
  seniorityLabel,
  modalityLabel,
  employmentLabel,
  formatDate,
} from "../lib/format";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showExternalApply, setShowExternalApply] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("jobs")
        .select("*, company:companies(*), category:categories(*)")
        .eq("id", id)
        .maybeSingle();
      setJob(data as Job);
      setLoading(false);

      if (data && user) {
        const { data: fav } = await supabase
          .from("favorites")
          .select("id")
          .eq("job_id", id!)
          .eq("user_id", user.id)
          .maybeSingle();
        setIsFavorite(!!fav);

        const { data: app } = await supabase
          .from("job_applications")
          .select("id")
          .eq("job_id", id!)
          .eq("user_id", user.id)
          .maybeSingle();
        setApplied(!!app);

        // Fetch candidate profile for external applications
        const { data: cp } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setCandidateProfile(cp as CandidateProfile | null);
      }
    };
    fetchJob();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/vagas/${id}` } });
      return;
    }
    if (profile?.user_type !== "candidate") {
      setError("Apenas candidatos podem se candidatar a vagas");
      return;
    }
    setApplying(true);
    setError(null);
    const { error: appError } = await supabase.from("job_applications").insert({
      job_id: id,
      user_id: user.id,
      cover_letter: coverLetter || null,
      status: "pending",
      source: "internal",
    });
    setApplying(false);
    if (appError) {
      setError(appError.message);
    } else {
      setApplied(true);
      setShowApplyForm(false);
    }
  };

  const handleExternalApply = async () => {
    if (!user || !job) return;

    setApplying(true);
    const { error: appError } = await supabase.from("job_applications").insert({
      job_id: job.id,
      user_id: user.id,
      cover_letter: coverLetter || null,
      status: "pending",
      source: "external",
    });

    if (appError) {
      setError(`Erro ao registrar candidatura: ${appError.message}`);
      setApplying(false);
      return;
    }

    setApplying(false);
    setApplied(true);
    setShowExternalApply(false);

    window.open(job.external_url || "#", "_blank", "noopener,noreferrer");
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/vagas/${id}` } });
      return;
    }
    if (isFavorite) {
      const { error } = await supabase.from("favorites").delete().eq("job_id", id!).eq("user_id", user.id);
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ job_id: id, user_id: user.id });
      if (!error) setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Vaga não encontrada</h2>
        <Link to="/vagas" className="btn-primary mt-4">Ver todas as vagas</Link>
      </div>
    );
  }

  const isExternal = !job.is_internal && job.external_url;

  // Build profile summary for external application
  const profileSummary = [
    { label: "Nome", value: profile?.full_name || "" },
    { label: "Email", value: user?.email || "" },
    { label: "Telefone", value: profile?.phone || "" },
    { label: "Título", value: candidateProfile?.headline || "" },
    { label: "Cidade", value: [profile?.location_city, profile?.location_state].filter(Boolean).join(", ") || "" },
    { label: "LinkedIn", value: profile?.linkedin_url || "" },
    { label: "GitHub", value: profile?.github_url || "" },
    { label: "Portfólio", value: profile?.portfolio_url || "" },
    { label: "Currículo", value: candidateProfile?.resume_url ? "Enviado" : "Não enviado" },
  ].filter((s) => s.value);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen animate-fade-in">
      <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/vagas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Voltar para vagas
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {job.company?.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
                  <div className="mt-1 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <Link to="/empresas" className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                      {job.company?.name || "Empresa"}
                    </Link>
                    {job.company?.is_verified && (
                      <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location_city || "Brasil"}
                      {job.location_state ? `, ${job.location_state}` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {seniorityLabel(job.seniority)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">{modalityLabel(job.modality)}</span>
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{employmentLabel(job.employment_type)}</span>
                {job.is_urgent && <span className="badge bg-red-100 text-red-700">Urgente</span>}
                {job.is_featured && <span className="badge bg-amber-100 text-amber-700">Destaque</span>}
                {job.external_source && (
                  <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Fonte: {job.external_source}</span>
                )}
              </div>

              {job.technologies && job.technologies.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Tecnologias</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.technologies.map((t) => (
                      <span key={t} className="badge bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {job.description && (
              <div className="card p-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Descrição da vaga</h2>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {job.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="card p-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Requisitos</h2>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="card p-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Benefícios</h2>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {job.benefits}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Salary & Apply */}
            <div className="card p-6 sticky top-20">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <DollarSign className="h-4 w-4" />
                  Salário
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                </div>
              </div>

              <div className="mb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Modalidade</span>
                  <span className="font-medium text-slate-900 dark:text-white">{modalityLabel(job.modality)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tipo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{employmentLabel(job.employment_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Senioridade</span>
                  <span className="font-medium text-slate-900 dark:text-white">{seniorityLabel(job.seniority)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Publicada</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatDate(job.created_at)}</span>
                </div>
              </div>

              {error && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {applied ? (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Candidatura enviada!
                </div>
              ) : isExternal ? (
                <div className="space-y-3">
                  {showExternalApply ? (
                    <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        Seus dados que serão usados
                      </div>
                      <div className="space-y-1.5">
                        {profileSummary.map((s) => (
                          <div key={s.label} className="flex justify-between gap-2 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">{s.label}:</span>
                            <span className="text-right font-medium text-slate-800">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      {profileSummary.length < 3 && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span>Seu perfil está incompleto. Preencha mais dados para aumentar suas chances.</span>
                        </div>
                      )}
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Mensagem para o recrutador (opcional)"
                        rows={3}
                        className="input-field text-sm"
                      />
                      <button
                        onClick={handleExternalApply}
                        disabled={applying}
                        className="btn-primary w-full"
                      >
                        {applying ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                          <><Send className="h-4 w-4" /> Confirmar e ir para o site</>
                        )}
                      </button>
                      <button
                        onClick={() => setShowExternalApply(false)}
                        className="btn-secondary w-full"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!user) {
                          navigate("/login", { state: { from: `/vagas/${id}` } });
                        } else {
                          setShowExternalApply(true);
                        }
                      }}
                      className="btn-primary w-full"
                    >
                      Candidatar no site original <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : showApplyForm ? (
                <form onSubmit={handleApply} className="space-y-3">
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Carta de apresentação (opcional)"
                    rows={4}
                    className="input-field"
                  />
                  <button type="submit" disabled={applying} className="btn-primary w-full">
                    {applying ? "Enviando..." : "Confirmar candidatura"}
                  </button>
                  <button type="button" onClick={() => setShowApplyForm(false)} className="btn-secondary w-full">
                    Cancelar
                  </button>
                </form>
              ) : (
                <button onClick={() => user ? setShowApplyForm(true) : navigate("/login", { state: { from: `/vagas/${id}` } })} className="btn-primary w-full">
                  Candidatar-se
                </button>
              )}

              <button
                onClick={toggleFavorite}
                className={`btn-secondary mt-3 w-full ${isFavorite ? "border-primary-300 text-primary-700 dark:text-primary-400" : ""}`}
              >
                <Star className={`h-4 w-4 ${isFavorite ? "fill-primary-500 text-primary-500" : ""}`} />
                {isFavorite ? "Salvo nos favoritos" : "Salvar vaga"}
              </button>
            </div>

            {/* Company Info */}
            {job.company && (
              <div className="card p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Sobre a empresa</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-400">
                    {job.company.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{job.company.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {job.company.industry || "Tecnologia"}
                      {job.company.size ? ` · ${job.company.size}` : ""}
                    </div>
                  </div>
                </div>
                {job.company.description && (
                  <p className="mt-3 text-sm text-slate-600 line-clamp-3 dark:text-slate-400">{job.company.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
