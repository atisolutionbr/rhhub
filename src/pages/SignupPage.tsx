import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Building2, Briefcase, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { UserType } from "../lib/types";

const userTypes: { value: UserType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "candidate", label: "Candidato", icon: User, desc: "Buscar e se candidatar a vagas" },
  { value: "company", label: "Empresa", icon: Building2, desc: "Publicar vagas e ver candidatos" },
];

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("candidate");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password, userType, fullName);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      if (userType === "company") {
        navigate("/empresa");
      } else {
        navigate("/candidato");
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <img src="/Logo_Portal_sem_fundo.png" alt="Ati TechHub" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Criar conta</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Comece grátis hoje mesmo</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de conta</label>
            <div className="grid grid-cols-2 gap-3">
              {userTypes.map((type) => {
                const Icon = type.icon;
                const active = userType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      active
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? "text-primary-600 dark:text-primary-400" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${active ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {type.label}
                    </span>
                    <span className="text-xs text-slate-400">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {userType === "company" ? "Nome da empresa" : "Nome completo"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder={userType === "company" ? "Minha Empresa Ltda" : "João Silva"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Já tem conta?{" "}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
