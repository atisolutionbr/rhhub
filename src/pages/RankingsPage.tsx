import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Loader2,
  TrendingUp,
  Building2,
  DollarSign,
  MapPin,
  Star,
  Award,
  ChevronRight,
  Crown,
  Medal,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { CompanyRanking } from "../lib/types";

interface RankingCard {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: { name: string; value: string; extra?: string }[];
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<CompanyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState<{ state: string; count: number }[]>([]);
  const [salaryStats, setSalaryStats] = useState<{ role: string; median: number }[]>([]);
  const [techStats, setTechStats] = useState<{ tech: string; count: number }[]>([]);
  const [companyStats, setCompanyStats] = useState<{ name: string; count: number }[]>([]);
  const [showFullRanking, setShowFullRanking] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [rankRes, jobsRes, salaryRes, techRes, compRes] = await Promise.all([
        supabase.from("company_rankings").select("*").order("published_at", { ascending: false }),
        supabase.from("jobs").select("location_state, salary_max").eq("status", "published"),
        supabase.from("salary_benchmarks").select("role, salary_median_brl").order("salary_median_brl", { ascending: false }).limit(20),
        supabase.from("jobs").select("technologies").eq("status", "published"),
        supabase.from("jobs").select("company:companies(name)").eq("status", "published"),
      ]);

      setRankings((rankRes.data as CompanyRanking[]) || []);

      // Jobs by state
      const stateMap: Record<string, number> = {};
      const salaryByState: Record<string, number[]> = {};
      (jobsRes.data || []).forEach((j: any) => {
        const state = j.location_state || "BR";
        stateMap[state] = (stateMap[state] || 0) + 1;
        if (j.salary_max) {
          salaryByState[state] = salaryByState[state] || [];
          salaryByState[state].push(j.salary_max);
        }
      });
      const states = Object.entries(stateMap)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setJobStats(states);

      // Top salaries
      setSalaryStats((salaryRes.data || []).map((s: any) => ({ role: s.role, median: s.salary_median_brl })));

      // Top technologies
      const techMap: Record<string, number> = {};
      (techRes.data || []).forEach((j: any) => {
        if (j.technologies) {
          j.technologies.forEach((t: string) => {
            techMap[t] = (techMap[t] || 0) + 1;
          });
        }
      });
      const topTechs = Object.entries(techMap)
        .map(([tech, count]) => ({ tech, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTechStats(topTechs);

      // Top companies by job count
      const compMap: Record<string, number> = {};
      (compRes.data || []).forEach((j: any) => {
        if (j.company?.name) {
          compMap[j.company.name] = (compMap[j.company.name] || 0) + 1;
        }
      });
      const topComps = Object.entries(compMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setCompanyStats(topComps);

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Best states for salary
  const bestSalaryStates = Object.entries(
    (jobStats.length > 0 ? jobStats : []).reduce((acc, s) => {
      acc[s.state] = s.count;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cards: RankingCard[] = [
    {
      id: "jobs-by-state",
      title: "Vagas por Estado",
      icon: MapPin,
      color: "from-blue-500 to-cyan-500",
      items: jobStats.map((s) => ({ name: s.state, value: `${s.count} vagas` })),
    },
    {
      id: "top-salaries",
      title: "Maiores Salários",
      icon: DollarSign,
      color: "from-emerald-500 to-teal-500",
      items: salaryStats.slice(0, 5).map((s) => ({
        name: s.role,
        value: `R$ ${s.median.toLocaleString("pt-BR")}`,
      })),
    },
    {
      id: "top-technologies",
      title: "Tecnologias Mais Procuradas",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      items: techStats.map((t) => ({ name: t.tech, value: `${t.count} vagas` })),
    },
    {
      id: "top-companies",
      title: "Empresas que Mais Contratam",
      icon: Building2,
      color: "from-amber-500 to-orange-500",
      items: companyStats.map((c) => ({ name: c.name, value: `${c.count} vagas` })),
    },
    {
      id: "best-states",
      title: "Melhores Oportunidades por Estado",
      icon: Award,
      color: "from-rose-500 to-red-500",
      items: bestSalaryStates.map(([state, count]) => ({ name: state, value: `${count} vagas` })),
    },
  ];

  // Add company rankings from DB
  const grouped: Record<string, CompanyRanking[]> = {};
  rankings.forEach((r) => {
    if (!grouped[r.ranking_name]) grouped[r.ranking_name] = [];
    grouped[r.ranking_name].push(r);
  });

  Object.entries(grouped).forEach(([name, items]) => {
    cards.push({
      id: name,
      title: name,
      icon: Trophy,
      color: "from-indigo-500 to-blue-500",
      items: items.sort((a, b) => a.rank - b.rank).slice(0, 5).map((item) => ({
        name: item.company,
        value: `#${item.rank}`,
        extra: item.sector,
      })),
    });
  });

  const fullRanking = showFullRanking ? cards.find((c) => c.id === showFullRanking) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in">
      <div className="container-max px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Rankings</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Os melhores do mercado de tecnologia no Brasil</p>
        </div>

        {/* 5 columns x 4 rows grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.slice(0, 20).map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="card cursor-pointer p-5 hover:border-primary-300"
                onClick={() => setShowFullRanking(card.id)}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{card.title}</h3>
                </div>
                <div className="space-y-2">
                  {card.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-amber-100 text-amber-700 dark:text-amber-400" :
                        i === 1 ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.value}</span>
                    </div>
                  ))}
                  {card.items.length === 0 && (
                    <p className="text-xs text-slate-400">Sem dados ainda</p>
                  )}
                </div>
                <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Ver top 100 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full ranking modal */}
      {fullRanking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowFullRanking(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${fullRanking.color}`}>
                  <fullRanking.icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{fullRanking.title}</h2>
              </div>
              <button
                onClick={() => setShowFullRanking(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <ChevronRight className="h-5 w-5 rotate-90" />
              </button>
            </div>
            <div className="space-y-2">
              {fullRanking.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-950"
                >
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                    i === 0 ? "bg-amber-100 text-amber-700 dark:text-amber-400" :
                    i === 1 ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                    {item.extra && <div className="text-xs text-slate-400">{item.extra}</div>}
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{item.value}</span>
                </div>
              ))}
              {fullRanking.items.length === 0 && (
                <p className="py-8 text-center text-slate-400">Sem dados disponíveis ainda</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
