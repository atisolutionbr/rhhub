import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, Calendar, ArrowRight, TrendingUp, DollarSign, Briefcase, Code2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatDate } from "../lib/format";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  published_at: string | null;
  author_id: string | null;
}

const featuredTopics = [
  { icon: TrendingUp, title: "Tendências do mercado de TI", desc: "Análise das tecnologias mais procuradas e como o mercado se move em 2026." },
  { icon: DollarSign, title: "Pesquisa salarial", desc: "Veja a media salarial por cargo, senioridade e região. Participe da pesquisa." },
  { icon: Briefcase, title: "Carreira & Dicas", desc: "Conteúdos para alavancar sua carreira em tecnologia - do currículo a entrevista." },
  { icon: Code2, title: "Guias tecnicos", desc: "Tutoriais e deep dives sobre as tecnologias mais relevantes do momento." },
];

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id, title, slug, excerpt, cover_url, category, published_at, author_id")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setArticles((data as Article[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 py-16">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Carreira & Dicas
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Conteúdos para alavancar sua carreira em tecnologia
            </p>
          </div>
        </div>
      </section>

      {/* Featured topics */}
      <section className="section-padding bg-slate-50 dark:bg-slate-950">
        <div className="container-max">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div key={topic.title} className="card p-5 hover:border-primary-300">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{topic.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{topic.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="section-padding bg-slate-100 dark:bg-slate-800">
        <div className="container-max">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ultimos artigos</h2>
            <Link to="/vagas" className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Ver vagas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            </div>
          ) : articles.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Em breve!</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Estamos preparando conteudo incrivel para você. Enquanto isso, explore as vagas disponiveis.
              </p>
              <Link to="/vagas" className="btn-primary mt-6">
                Ver vagas
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <article key={a.id} className="card overflow-hidden hover:border-primary-300">
                  {a.cover_url && (
                    <img src={a.cover_url} alt={a.title} className="h-48 w-full object-cover" />
                  )}
                  <div className="p-5">
                    {a.category && (
                      <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 mb-2">{a.category}</span>
                    )}
                    <h2 className="font-semibold text-slate-900 dark:text-white">{a.title}</h2>
                    {a.excerpt && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{a.excerpt}</p>}
                    {a.published_at && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" /> {formatDate(a.published_at)}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
