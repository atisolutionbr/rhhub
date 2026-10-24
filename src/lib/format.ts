export function formatSalary(min: number | null | undefined, max: number | null | undefined, period?: string | null | undefined, currency: string | null = "BRL"): string {
  if (min == null && max == null) return "Salário não informado";
  const fmt = (v: number) => {
    try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "XXX", maximumFractionDigits: 2 }).format(v); }
    catch { return `${currency || "Moeda não informada"} ${v.toLocaleString("pt-BR")}`; }
  };
  const periods: Record<string, string> = { hourly: "hora", weekly: "semana", fortnightly: "quinzena", monthly: "mês", month: "mês", annual: "ano", yearly: "ano", year: "ano" };
  const suffix = period ? ` / ${periods[period] || period}` : "";
  if (min != null && max != null) {
    return `${fmt(min)}${min !== max ? ` - ${fmt(max)}` : ""}${suffix}`;
  }
  const val = (min ?? max) as number;
  return `${fmt(val)}${suffix}`;
}

export function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function seniorityLabel(s: string | null): string {
  const map: Record<string, string> = {
    junior: "Júnior",
    mid: "Pleno",
    senior: "Sênior",
    lead: "Tech Lead",
    intern: "Estágio",
  };
  return s ? map[s] || s : "—";
}

export function modalityLabel(s: string | null): string {
  const map: Record<string, string> = {
    remote: "Remoto",
    hybrid: "Híbrido",
    onsite: "Presencial",
  };
  return s ? map[s] || s : "—";
}

export function employmentLabel(s: string | null): string {
  const map: Record<string, string> = {
    clt: "CLT",
    pj: "PJ",
    freelance: "Freelancer",
    internship: "Estágio",
    contract: "Contrato",
  };
  return s ? map[s] || s : "—";
}
