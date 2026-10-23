import { Link } from "react-router-dom";
import { Home, Search, Briefcase, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />

      <div className="relative px-4 text-center">
        <div className="mb-6 flex justify-center">
          <img src="/Logo_Portal_sem_fundo.png" alt="Ati TechHub" className="h-16 w-auto opacity-80" />
        </div>

        <h1 className="text-8xl font-bold text-slate-700 sm:text-9xl">
          4<span className="text-primary-500">0</span>4
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-white">Página não encontrada</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-400">
          A página que você procura não existe ou foi movida. Que tal buscar uma nova oportunidade?
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            <Home className="h-4 w-4" /> Voltar ao início
          </Link>
          <Link
            to="/vagas"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <Search className="h-4 w-4" /> Buscar vagas
          </Link>
        </div>
      </div>
    </div>
  );
}
