import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ParseResult {
  full_name?: string;
  headline?: string;
  summary?: string;
  phone?: string;
  email?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  technologies?: string[];
  experience?: Array<{ title: string; company: string; period: string; description: string }>;
  education?: Array<{ institution: string; degree: string; period: string }>;
  languages?: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;
  resume_text?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { file_path, file_type } = await req.json();

    if (!file_path) {
      return new Response(JSON.stringify({ error: "file_path é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Falha ao baixar arquivo" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let text = "";

    if (file_type === "application/pdf") {
      text = await extractPdfText(fileData);
    } else if (file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      text = await extractDocxText(fileData);
    } else if (file_type === "text/plain") {
      text = await fileData.text();
    } else {
        return new Response(JSON.stringify({ error: "Para leitura automática, converta o currículo para PDF, DOCX ou texto." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text.trim()) return new Response(JSON.stringify({ error: "Não foi possível extrair texto. Se o PDF for uma imagem, envie uma versão com texto selecionável." }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const parsed = parseResumeText(text);

    return new Response(JSON.stringify({ ...parsed, resume_text: text.slice(0, 5000) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function extractPdfText(file: Blob): Promise<string> {
  try {
    const pdfParse = (await import("npm:pdf-parse@1.1.1/lib/pdf-parse.js")).default;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch { return ""; }
}

async function extractDocxText(file: Blob): Promise<string> {
  try {
    const mammoth = await import("npm:mammoth@1.8.0");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return result.value || "";
  } catch {
    return "";
  }
}

// Brazilian state names mapped to codes
const BR_STATE_NAMES: Record<string, string> = {
  "acre": "AC", "alagoas": "AL", "amapá": "AP", "amazonas": "AM",
  "bahia": "BA", "ceará": "CE", "distrito federal": "DF", "espírito santo": "ES",
  "goiás": "GO", "maranhão": "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
  "minas gerais": "MG", "pará": "PA", "paraíba": "PB", "paraná": "PR",
  "pernambuco": "PE", "piauí": "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN",
  "rio grande do sul": "RS", "rondônia": "RO", "roraima": "RR",
  "santa catarina": "SC", "são paulo": "SP", "sergipe": "SE", "tocantins": "TO",
};

// Major Brazilian cities mapped to state codes
const BR_CITY_TO_STATE: Record<string, string> = {
  "são paulo": "SP", "rio de janeiro": "RJ", "belo horizonte": "MG", "brasília": "DF",
  "salvador": "BA", "fortaleza": "CE", "curitiba": "PR", "recife": "PE",
  "porto alegre": "RS", "manaus": "AM", "belém": "PA", "goiânia": "GO",
  "guarulhos": "SP", "campinas": "SP", "são luís": "MA", "maceió": "AL",
  "natal": "RN", "teresina": "PI", "joão pessoa": "PB", "florianópolis": "SC",
  "aracaju": "SE", "cusiba": "MT", "campo grande": "MS", "palmas": "TO",
  "porto velho": "RO", "macapá": "AP", "rio branco": "AC", "boa vista": "RR",
  "vitória": "ES", "londrina": "PR", "maringá": "PR", "joinville": "SC",
  "juiz de fora": "MG", "uberlândia": "MG", "contagem": "MG", "sorocaba": "SP",
  "osasco": "SP", "ribeirão preto": "SP", "santos": "SP", "mauá": "SP",
  "são josé dos campos": "SP", "são josé do rio preto": "SP", "mogi das cruzes": "SP",
  "niterói": "RJ", "nova iguaçu": "RJ", "duque de caxias": "RJ", "petrópolis": "RJ",
  "caxias do sul": "RS", "pelotas": "RS", "canoas": "RS", "santa maria": "RS",
  "novo hamburgo": "RS", "são leopoldo": "RS", "igrejinha": "RS", "parobé": "RS",
};

function parseResumeText(text: string): ParseResult {
  const result: ParseResult = {};
  const lines = text.split(/\n|\r/).map((l) => l.trim()).filter(Boolean);
  const fullText = text;

  // === FULL NAME ===
  // Look at first 5 lines for a name (2+ words, mostly letters, not a section header)
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 5 &&
      line.length < 60 &&
      /^[A-Za-zÀ-ú\s]+$/.test(line) &&
      line.split(/\s+/).length >= 2 &&
      !line.toLowerCase().match(/^(curr[ií]culo|resume|cv|perfil|contato|dados pessoais)/)
    ) {
      result.full_name = line;
      break;
    }
  }

  // === HEADLINE ===
  // Look for job title keywords in first 10 lines
  const titleKeywords = [
    "desenvolvedor", "developer", "engenheiro", "engineer", "programador", "programmer",
    "analista", "analyst", "designer", "arquiteto", "architect", "tech lead",
    "gerente", "manager", "consultor", "consultant", "especialista", "specialist",
    "cientista", "scientist", "administrador", "administrator", "coordenador",
    "frontend", "backend", "fullstack", "full stack", "full-stack",
    "devops", "sre", "qa", "tester", "scrum master", "product owner", "product manager",
    "ux", "ui", "ux/ui", "ux-designer", "data scientist", "data engineer",
  ];
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (
      line.length > 5 &&
      line.length < 120 &&
      !line.includes("@") &&
      !line.match(/https?:\/\//) &&
      !line.match(/^\d/) &&
      titleKeywords.some((kw) => lower.includes(kw))
    ) {
      result.headline = line;
      break;
    }
  }

  // === EMAIL ===
  const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) result.email = emailMatch[0];

  // === PHONE ===
  // Match Brazilian and international phone formats
  const phonePatterns = [
    /\+55\s*\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/,
    /\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/,
    /\+?\d{1,3}\s*\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/,
  ];
  for (const p of phonePatterns) {
    const m = fullText.match(p);
    if (m) {
      result.phone = m[0].trim();
      break;
    }
  }

  // === LINKEDIN ===
  const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[\w-]+/i);
  if (linkedinMatch) {
    result.linkedin_url = linkedinMatch[0].startsWith("http") ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // === GITHUB ===
  const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  if (githubMatch) {
    result.github_url = githubMatch[0].startsWith("http") ? githubMatch[0] : `https://${githubMatch[0]}`;
  }

  // === PORTFOLIO / WEBSITE ===
  const websiteMatches = fullText.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.)+(com|dev|io|me|tech|app|com\.br)(\/[\w-]*)?/gi);
  if (websiteMatches) {
    const site = websiteMatches.find((s) =>
      !s.includes("linkedin") && !s.includes("github") && !s.includes("gmail") && !s.includes("hotmail") && !s.includes("outlook")
    );
    if (site) {
      result.portfolio_url = site.startsWith("http") ? site : `https://${site}`;
    }
  }

  // === LOCATION ===
  // Try multiple patterns: "Cidade - UF", "Cidade, UF", "Cidade/UF"
  const locPatterns = [
    /([A-ZÀ-ú][a-zà-ú]+(?:\s[A-ZÀ-ú][a-zà-ú]+)*)\s*[-–,/]\s*([A-Z]{2})\b/,
    /(?:localização|local|cidade|resid[eê]ncia)\s*[:\-]\s*([A-ZÀ-ú][a-zà-ú]+(?:\s[A-ZÀ-ú][a-zà-ú]+)*)\s*[-–,/]\s*([A-Z]{2})\b/i,
  ];
  for (const p of locPatterns) {
    const m = fullText.match(p);
    if (m) {
      result.location_city = m[1].trim();
      result.location_state = m[2].trim();
      result.location_country = "Brasil";
      break;
    }
  }
  // If no match, try city name lookup
  if (!result.location_city) {
    const lowerText = fullText.toLowerCase();
    for (const [city, stateCode] of Object.entries(BR_CITY_TO_STATE)) {
      if (lowerText.includes(city)) {
        result.location_city = city.charAt(0).toUpperCase() + city.slice(1);
        result.location_state = stateCode;
        result.location_country = "Brasil";
        break;
      }
    }
  }
  // Try state name lookup
  if (!result.location_state) {
    const lowerText = fullText.toLowerCase();
    for (const [stateName, stateCode] of Object.entries(BR_STATE_NAMES)) {
      if (lowerText.includes(stateName)) {
        result.location_state = stateCode;
        result.location_country = "Brasil";
        break;
      }
    }
  }

  // === TECHNOLOGIES ===
  const techKeywords = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular", "Next.js", "Node.js",
    "Nuxt", "Svelte", "Express", "NestJS", "Prisma",
    "Python", "Django", "Flask", "FastAPI", "Java", "Spring", "Spring Boot", "Kotlin",
    "C#", ".NET", ".NET Core", "Go", "Rust", "Ruby", "Rails", "PHP", "Laravel",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "GraphQL", "REST", "gRPC", "Kafka", "RabbitMQ", "Celery",
    "HTML", "CSS", "Sass", "Tailwind", "Styled Components", "Bootstrap",
    "Jest", "Cypress", "Playwright", "Vitest", "Testing Library",
    "Git", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
    "Figma", "Photoshop", "Illustrator", "Sketch",
    "Swift", "Objective-C", "Flutter", "React Native",
    "SQL", "NoSQL", "Microservices", "DDD", "Clean Architecture", "SOLID",
    "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
    "Power BI", "Tableau", "Looker",
    "Linux", "Bash", "Shell Script",
    "Agile", "Scrum", "Kanban",
  ];
  const foundTechs: string[] = [];
  for (const tech of techKeywords) {
    const escaped = tech.replace(/[.+*?^$()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(fullText) && !foundTechs.includes(tech)) {
      foundTechs.push(tech);
    }
  }
  if (foundTechs.length > 0) result.technologies = foundTechs;

  // === SUMMARY ===
  // Look for "Resumo", "Summary", "Perfil", "Objetivo" sections
  const summaryHeaders = /^(resumo|summary|perfil profissional|objetivo|sobre mim|about me|profile)\s*:?\s*$/i;
  let summaryStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (summaryHeaders.test(lines[i])) {
      summaryStart = i + 1;
      break;
    }
  }
  if (summaryStart >= 0) {
    const summaryLines: string[] = [];
    for (let i = summaryStart; i < Math.min(summaryStart + 8, lines.length); i++) {
      const line = lines[i];
      if (line.length < 10 && summaryLines.length > 0) break;
      if (!line.match(/^(experi[eê]ncia|educação|forma[cç][aã]o|habilidades|compet[eê]ncias|cursos|certifica)/i)) {
        summaryLines.push(line);
      } else {
        break;
      }
      if (summaryLines.join(" ").length > 400) break;
    }
    if (summaryLines.length > 0) result.summary = summaryLines.join(" ").slice(0, 500);
  }
  // Fallback: first long paragraph that's not contact info
  if (!result.summary) {
    const summaryLines: string[] = [];
    let inSummary = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 80 && !line.includes("@") && !line.match(/https?:\/\//)) {
        inSummary = true;
        summaryLines.push(line);
        if (summaryLines.length >= 3) break;
      } else if (inSummary && line.length < 20) {
        break;
      }
    }
    if (summaryLines.length > 0) result.summary = summaryLines.join(" ").slice(0, 500);
  }

  // === EXPERIENCE ===
  const expHeader = lines.findIndex((l) => /^(experi[eê]ncia|experience|hist[oó]rico profissional)/i.test(l));
  if (expHeader >= 0) {
    const experiences: Array<{ title: string; company: string; period: string; description: string }> = [];
    for (let i = expHeader + 1; i < Math.min(expHeader + 30, lines.length); i++) {
      const line = lines[i];
      if (line.match(/^(educação|forma[cç][aã]o|habilidades|compet[eê]ncias|cursos|certifica|idiomas)/i)) break;
      // Look for "Title at Company (Period)" pattern
      const expMatch = line.match(/^(.+?)\s*(?:[-–@|,]\s*|at\s*|na\s*|em\s*)(.+?)\s*(?:\((.+?)\)|(\d{4}\s*[-–]\s*(?:\d{4}|presente|atual|present)))?/);
      if (expMatch && expMatch[1].length > 3) {
        experiences.push({
          title: expMatch[1].trim().slice(0, 100),
          company: (expMatch[2] || "").trim().slice(0, 100),
          period: (expMatch[3] || expMatch[4] || "").trim().slice(0, 50),
          description: "",
        });
        if (experiences.length >= 5) break;
      }
    }
    if (experiences.length > 0) result.experience = experiences;
  }

  // === EDUCATION ===
  const eduHeader = lines.findIndex((l) => /^(educação|forma[cç][aã]o|education|academic)/i.test(l));
  if (eduHeader >= 0) {
    const education: Array<{ institution: string; degree: string; period: string }> = [];
    for (let i = eduHeader + 1; i < Math.min(eduHeader + 15, lines.length); i++) {
      const line = lines[i];
      if (line.match(/^(habilidades|compet[eê]ncias|cursos|certifica|idiomas|experi[eê]ncia)/i)) break;
      if (line.length > 5) {
        education.push({
          institution: line.slice(0, 100),
          degree: "",
          period: "",
        });
        if (education.length >= 3) break;
      }
    }
    if (education.length > 0) result.education = education;
  }

  // === LANGUAGES ===
  const langMap: Record<string, string> = {
    "português": "Português", "portugues": "Português", "portuguese": "Português",
    "inglês": "Inglês", "ingles": "Inglês", "english": "Inglês",
    "espanhol": "Espanhol", "spanish": "Espanhol",
    "francês": "Francês", "frances": "Francês", "french": "Francês",
    "alemão": "Alemão", "alemao": "Alemão", "german": "Alemão",
    "italiano": "Italiano", "italian": "Italiano",
    "japonês": "Japonês", "japones": "Japonês", "japanese": "Japonês",
    "mandarim": "Mandarim", "chinese": "Mandarim", "chinês": "Mandarim",
  };
  const langs: string[] = [];
  const lowerText = fullText.toLowerCase();
  for (const [key, label] of Object.entries(langMap)) {
    if (lowerText.includes(key) && !langs.includes(label)) {
      langs.push(label);
    }
  }
  if (langs.length > 0) result.languages = langs;

  // === DESIRED SALARY ===
  const salaryPatterns = [
    /(?:pretens[aã]o|desejado|expectativa|meta)\s*(?:salarial)?\s*[:\-]?\s*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:a|at[eé])\s*R\$\s*([\d.,]+)/i,
  /sal[aá]rio\s*(?:atual|pretens[aã]o|desejado)\s*[:\-]?\s*R\$\s*([\d.,]+)/i,
  /R\$\s*([\d.,]+)/i,
  /([\d.,]+)\s*(?:reais|bucks)/i,
  ];
  for (const p of salaryPatterns) {
    const m = fullText.match(p);
    if (m) {
      const val1 = parseInt(m[1].replace(/\./g, "").replace(",", ""));
      if (val1 > 0) {
        result.desired_salary_min = val1;
        if (m[2]) {
          const val2 = parseInt(m[2].replace(/\./g, "").replace(",", ""));
          if (val2 > val1) result.desired_salary_max = val2;
        }
        break;
      }
    }
  }

  return result;
}
