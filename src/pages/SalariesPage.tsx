import { useEffect, useState } from "react";
import {
  DollarSign,
  Loader2,
  TrendingUp,
  Search,
  Briefcase,
  Building2,
  FileText,
  Send,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { SalaryBenchmark } from "../lib/types";

const cboRoles = [
  "Desenvolvedor Frontend",
  "Desenvolvedor Backend",
  "Desenvolvedor Full Stack",
  "Desenvolvedor Mobile",
  "Cientista de Dados",
  "Engenheiro de Dados",
  "Engenheiro de Software",
  "Engenheiro DevOps",
  "Engenheiro de Segurança",
  "Analista de Sistemas",
  "Analista de TI",
  "Administrador de Banco de Dados",
  "Administrador de Redes",
  "Arquiteto de Software",
  "Tech Lead",
  "Product Manager",
  "Product Owner",
  "Scrum Master",
  "Designer UX/UI",
  "Analista de QA",
  "Analista de Suporte",
  "Analista de Infraestrutura",
  "Desenvolvedor Python",
  "Desenvolvedor Java",
  "Desenvolvedor React",
  "Desenvolvedor Node.js",
  "Desenvolvedor .NET",
  "Desenvolvedor PHP",
  "Desenvolvedor Go",
  "Desenvolvedor Ruby",
];

export default function SalariesPage() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState<SalaryBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState<number>(0);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [formRole, setFormRole] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formFairSalary, setFormFairSalary] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formEducation, setFormEducation] = useState("");
  const [formModality, setFormModality] = useState("");
  const [formState, setFormState] = useState("");

  useEffect(() => {
    supabase
      .from("salary_benchmarks")
      .select("*")
      .order("salary_median_brl", { ascending: false })
      .then(({ data }) => {
        setSalaries((data as SalaryBenchmark[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = salaries.filter((s) => {
    const matchesText = !filter || s.role.toLowerCase().includes(filter.toLowerCase());
    const matchesSalary = salaryFilter === 0 || s.salary_median_brl >= salaryFilter;
    return matchesText && matchesSalary;
  });

  const handleSubmitResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("salary_research").insert({
      user_id: user?.id || null,
      role: formRole,
      current_salary: parseFloat(formSalary) || null,
      company_name: formCompany,
      cnpj: formCnpj,
      fair_salary: parseFloat(formFairSalary) || null,
      experience_years: formExperience || null,
      education_level: formEducation || null,
      modality: formModality || null,
      state: formState || null,
    });
    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        setShowForm(false);
        setSubmitted(false);
        setFormRole(""); setFormSalary(""); setFormCompany(""); setFormCnpj("");
        setFormFairSalary(""); setFormExperience(""); setFormEducation("");
        setFormModality(""); setFormState("");
      }, 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in">
      <div className="container-max px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Benchmark de Salários</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Salários de mercado para a área de tecnologia no Brasil</p>
        </div>

        {/* Research form toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            <FileText className="h-4 w-4" />
            {showForm ? "Fechar pesquisa" : "Participar da pesquisa salarial"}
          </button>
        </div>

        {/* Research form */}
        {showForm && (
          <div className="card mb-8 p-6">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Obrigado pela sua participação!</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sua resposta foi registrada e ajudará a comunidade de TI.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitResearch} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pesquisa Salarial</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contribua com dados reais para o benchmark de salários de TI</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Cargo *</label>
                    <select
                      required
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione um cargo</option>
                      {cboRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário atual (R$) *</label>
                    <input
                      type="number"
                      required
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      className="input-field"
                      placeholder="Ex: 8000"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Empresa</label>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="input-field"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</label>
                    <input
                      type="text"
                      value={formCnpj}
                      onChange={(e) => setFormCnpj(e.target.value)}
                      className="input-field"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Salário que considera justo (R$)</label>
                    <input
                      type="number"
                      value={formFairSalary}
                      onChange={(e) => setFormFairSalary(e.target.value)}
                      className="input-field"
                      placeholder="Ex: 12000"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Anos de experiência</label>
                    <select
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="0-1">Menos de 1 ano</option>
                      <option value="1-3">1 a 3 anos</option>
                      <option value="3-5">3 a 5 anos</option>
                      <option value="5-10">5 a 10 anos</option>
                      <option value="10+">Mais de 10 anos</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Escolaridade</label>
                    <select
                      value={formEducation}
                      onChange={(e) => setFormEducation(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="ensino_medio">Ensino Médio</option>
                      <option value="tecnologo">Tecnólogo</option>
                      <option value="bacharelado">Bacharelado</option>
                      <option value="especializacao">Especialização</option>
                      <option value="mestrado">Mestrado</option>
                      <option value="doutorado">Doutorado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Modalidade</label>
                    <select
                      value={formModality}
                      onChange={(e) => setFormModality(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="remote">Remoto</option>
                      <option value="hybrid">Híbrido</option>
                      <option value="onsite">Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                    <input
                      type="text"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="input-field"
                      placeholder="Ex: SP"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full">
                  <Send className="h-4 w-4" /> Enviar pesquisa
                </button>
              </form>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por cargo..."
              className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 dark:text-slate-400">Salário mínimo:</label>
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value={0}>Todos</option>
              <option value={3000}>R$ 3.000+</option>
              <option value={5000}>R$ 5.000+</option>
              <option value={8000}>R$ 8.000+</option>
              <option value={12000}>R$ 12.000+</option>
              <option value={20000}>R$ 20.000+</option>
            </select>
          </div>
        </div>

        {/* Salary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="card p-5 hover:border-primary-300">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{s.role}</h3>
                  <div className="mt-1 flex gap-2">
                    <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">{s.seniority}</span>
                    <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s.contract_type}</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Mínimo</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">R$ {s.salary_min_brl.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Mediana</span>
                  <span className="font-bold text-primary-700 dark:text-primary-400">R$ {s.salary_median_brl.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Máximo</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">R$ {s.salary_max_brl.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-400">
                Fonte: {s.source_name} · {s.sample_size} amostras
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card flex flex-col items-center py-16 text-center">
            <DollarSign className="mb-3 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum salário encontrado</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tente ajustar os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
