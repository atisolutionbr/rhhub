import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Filter,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Cpu,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Job, Category, Technology } from "../lib/types";
import {
  formatSalary,
  timeAgo,
  seniorityLabel,
  modalityLabel,
  employmentLabel,
} from "../lib/format";
import { countries, statesByCountry, citiesByState } from "../lib/locations";

const PAGE_SIZE = 12;

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const q = searchParams.get("q") || "";
  const loc = searchParams.get("loc") || "";
  const cat = searchParams.get("cat") || "";
  const modality = searchParams.get("modality") || "";
  const seniority = searchParams.get("seniority") || "";
  const tech = searchParams.get("tech") || "";

  const [searchInput, setSearchInput] = useState(q);
  const [locationInput, setLocationInput] = useState(loc);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [locCountry, setLocCountry] = useState("BR");
  const [locState, setLocState] = useState("");
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const allLocations: string[] = (() => {
    const result: string[] = [];
    for (const country of countries) {
      const states = statesByCountry[country.code] || [];
      for (const state of states) {
        const cities = citiesByState[`${country.code}-${state.code}`] || [];
        for (const city of cities) {
          result.push(`${city}, ${state.code}`);
        }
      }
    }
    return result.sort();
  })();

  const filteredLocations = locationInput
    ? allLocations.filter((l) => l.toLowerCase().includes(locationInput.toLowerCase())).slice(0, 12)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setShowLocDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
    supabase
      .from("technologies")
      .select("*")
      .eq("is_popular", true)
      .order("name")
      .then(({ data }) => setTechnologies((data as Technology[]) || []));
  }, []);

  useEffect(() => {
    setSearchInput(q);
    setLocationInput(loc);
  }, [q, loc]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("job_id").eq("user_id", user.id);
    if (data) setFavorites(new Set(data.map((f) => f.job_id)));
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (jobId: string) => {
    if (!user) return;
    if (favorites.has(jobId)) {
      const { error } = await supabase.from("favorites").delete().eq("job_id", jobId).eq("user_id", user.id);
      if (error) return;
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } else {
      const { error } = await supabase.from("favorites").insert({ job_id: jobId, user_id: user.id });
      if (error) return;
      setFavorites((prev) => new Set(prev).add(jobId));
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      let query = supabase
        .from("jobs")
        .select("*, company:companies(*)", { count: "exact" })
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (q) query = query.ilike("title", `%${q}%`);
      if (loc) {
        const [cityPart] = loc.split(",");
        query = query.or(`location_city.ilike.%${cityPart.trim()}%,location_state.ilike.%${cityPart.trim()}%`);
      }
      if (cat) query = query.eq("category.slug", cat);
      if (modality) query = query.eq("modality", modality);
      if (seniority) query = query.eq("seniority", seniority);
      if (tech) query = query.contains("technologies", [tech]);

      // Filter to only IT/tech jobs
      const techFilter = [
        "desenvolvedor", "developer", "engenheiro", "engineer", "programador",
        "frontend", "backend", "fullstack", "full stack", "full-stack",
        "devops", "sre", "data scientist", "data engineer", "data analyst",
        "cientista de dados", "machine learning", "mobile", "android", "ios",
        "tech lead", "arquiteto", "architect", "qa", "quality assurance",
        "security", "segurança", "cloud", "aws", "azure",
        "python", "java", "javascript", "typescript", "react", "node",
        "go", "rust", "ruby", "php", "c#", ".net", "kotlin", "swift",
        "scrum master", "product owner", "product manager",
        "ux", "ui", "designer", "analista de sistemas", "analista de ti",
        "suporte técnico", "sysadmin", "dba", "sql", "infraestrutura",
      ].map((kw) => `title.ilike.%${kw}%`).join(",");
      query = query.or(techFilter);

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count } = await query;
      setJobs((data as Job[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchJobs();
  }, [q, loc, cat, modality, seniority, tech, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", searchInput);
    updateParam("loc", locationInput);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput("");
    setLocationInput("");
    setPage(1);
  };

  const hasFilters = q || loc || cat || modality || seniority || tech;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen animate-fade-in">
      {/* Search Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            {total.toLocaleString("pt-BR")} vagas de tecnologia
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-400">
              <Cpu className="h-4 w-4" />
              Apenas TI
            </span>
          </h1>
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cargo, tecnologia..."
                className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div className="relative flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3" ref={locationDropdownRef}>
              <MapPin className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value);
                  setShowLocDropdown(true);
                }}
                onFocus={() => setShowLocDropdown(true)}
                placeholder="Localização"
                className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
              />
              {showLocDropdown && filteredLocations.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
                  {filteredLocations.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setLocationInput(l);
                        setShowLocDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                    >
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary">Buscar</button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary lg:hidden"
            >
              <Filter className="h-4 w-4" /> Filtros
            </button>
          </form>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {q && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {q}
                  <button onClick={() => updateParam("q", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {loc && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {loc}
                  <button onClick={() => updateParam("loc", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {cat && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {categories.find((c) => c.slug === cat)?.name || cat}
                  <button onClick={() => updateParam("cat", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {modality && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {modalityLabel(modality)}
                  <button onClick={() => updateParam("modality", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {seniority && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {seniorityLabel(seniority)}
                  <button onClick={() => updateParam("seniority", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {tech && (
                <span className="badge bg-primary-100 text-primary-700 dark:text-primary-400">
                  {tech}
                  <button onClick={() => updateParam("tech", "")}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-max px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-64 flex-shrink-0`}>
            <div className="sticky top-20 space-y-4">
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Modalidade</h3>
                <div className="space-y-2">
                  {["remote", "hybrid", "onsite"].map((m) => (
                    <button
                      key={m}
                      onClick={() => updateParam("modality", modality === m ? "" : m)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-sm text-left transition-colors ${
                        modality === m ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {modalityLabel(m)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Senioridade</h3>
                <div className="space-y-2">
                  {["junior", "mid", "senior", "lead"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateParam("seniority", seniority === s ? "" : s)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-sm text-left transition-colors ${
                        seniority === s ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {seniorityLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Categoria</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateParam("cat", cat === c.slug ? "" : c.slug)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-sm text-left transition-colors ${
                        cat === c.slug ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tecnologias</h3>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateParam("tech", tech === t.name ? "" : t.name)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        tech === t.name
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Jobs List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-20 text-center">
                <Briefcase className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhuma vaga encontrada</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tente ajustar os filtros</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="btn-secondary mt-4">
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/vagas/${job.id}`}
                      className="card group flex flex-col gap-3 p-5 hover:border-primary-300 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-400">
                          {job.company?.name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                              {job.title}
                            </h3>
                            {job.is_urgent && (
                              <span className="badge bg-red-100 text-red-700">Urgente</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {job.company?.name} · {job.location_city || "Brasil"}
                            {job.location_state ? `, ${job.location_state}` : ""}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                              {seniorityLabel(job.seniority)}
                            </span>
                            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {modalityLabel(job.modality)}
                            </span>
                            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {employmentLabel(job.employment_type)}
                            </span>
                            {job.technologies?.slice(0, 3).map((t) => (
                              <span key={t} className="badge bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                          </div>
                          <div className="text-xs text-slate-400">{timeAgo(job.created_at)}</div>
                        </div>
                        {job.external_source && (
                          <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {job.external_source}
                          </span>
                        )}
                        {user && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(job.id);
                            }}
                            className="text-slate-300 hover:text-primary-500"
                          >
                            <Star className={`h-5 w-5 ${favorites.has(job.id) ? "fill-primary-500 text-primary-500" : ""}`} />
                          </button>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
