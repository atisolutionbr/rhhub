import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Briefcase,
  Building2,
  TrendingUp,
  Trophy,
  DollarSign,
  BookOpen,
  LogOut,
  LayoutDashboard,
  User,
  Users,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const navLinks = [
  { to: "/vagas", label: "Vagas", icon: Briefcase },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/salarios", label: "Salários", icon: DollarSign },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/carreiras", label: "Carreiras", icon: Users },
  { to: "/planos", label: "Planos", icon: TrendingUp },
  { to: "/blog", label: "Blog", icon: BookOpen },
];

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardPath =
    profile?.user_type === "admin"
      ? "/admin"
      : profile?.user_type === "company"
      ? "/empresa"
      : "/candidato";

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="container-max px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 lg:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0 sm:gap-2">
            <img src="/Logo_Portal_sem_fundo.png" alt="Ati TechHub" className="h-7 w-auto flex-shrink-0 sm:h-9" />
            <span className="text-base font-bold whitespace-nowrap text-slate-900 dark:text-white sm:text-lg">
              Ati<span className="text-primary-600">Tech</span>Hub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 xl:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden items-center gap-2 xl:flex">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="max-w-[100px] truncate">
                    {profile?.full_name || "Usuário"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </button>
                {userMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-20 animate-slide-down dark:border-slate-700 dark:bg-slate-900">
                      <Link
                        to={dashboardPath}
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Meu Painel
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenu(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Entrar
                </Link>
                <Link to="/cadastro" className="btn-primary">
                  Cadastrar
                </Link>
              </>
            )}
          </div>

          {/* Tablet/Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 xl:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            {user && (
              <Link
                to={dashboardPath}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Meu Painel"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
            <button
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet dropdown menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white xl:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav className="space-y-1 px-3 py-3 sm:px-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary flex-1"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

    </header>
  );
}
