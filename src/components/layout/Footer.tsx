import { Link } from "react-router-dom";
import { Mail, Github, Linkedin, Twitter, Briefcase } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="container-max px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src="/Logo_Portal_sem_fundo.png" alt="Ati TechHub" className="h-9 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Portal de vagas de tecnologia com origem identificada e acesso
              aos anúncios nas fontes.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/vagas" className="hover:text-white transition-colors">Buscar Vagas</Link></li>
              <li><Link to="/empresas" className="hover:text-white transition-colors">Empresas</Link></li>
              <li><Link to="/salarios" className="hover:text-white transition-colors">Salários</Link></li>
              <li><Link to="/rankings" className="hover:text-white transition-colors">Rankings</Link></li>
              <li><Link to="/planos" className="hover:text-white transition-colors">Planos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Área do Candidato</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Área da Empresa</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Projeto</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Github className="h-4 w-4" /> <a href="https://github.com/atisolutionbr/rhhub" target="_blank" rel="noopener noreferrer">RHHub · AtiSolution</a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href="https://github.com/atisolutionbr/rhhub" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700 transition-colors" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Ati Solution. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
