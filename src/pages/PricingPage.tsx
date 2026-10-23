import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, QrCode, Copy, CheckCircle2, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { SubscriptionPlan } from "../lib/types";
import { formatBRL } from "../lib/format";

const PIX_KEY = "55.044.004/0001-63";
const PIX_MERCHANT = "ATI SOLUTION";

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setPlans((data as SubscriptionPlan[]) || []);
        setLoading(false);
      });
  }, []);

  const generatePixPayload = (plan: SubscriptionPlan) => {
    const amount = (plan.price_cents / 100).toFixed(2);
    const payload = `00020126580014BR.GOV.BCB.PIX0136${PIX_KEY}5204000053039865802BR5913${PIX_MERCHANT}6009SAO PAULO62070503***6304${amount.replace(".", "")}`;
    return payload;
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="container-max px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Planos para candidatos</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
            Escolha o plano ideal para acelerar sua carreira em tecnologia
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative flex flex-col p-6 ${
                plan.slug === "pro" ? "border-primary-500 border-2 shadow-lg" : ""
              }`}
            >
              {plan.slug === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                  Mais popular
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {plan.is_free ? "R$ 0" : formatBRL(plan.price_cents)}
                </span>
                {!plan.is_free && <span className="text-sm text-slate-500 dark:text-slate-400">/mês</span>}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description || `${plan.max_applications_per_day} candidaturas por dia`}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.is_free ? (
                <Link
                  to={user ? "/candidato" : "/cadastro"}
                  className="btn-secondary mt-6 w-full"
                >
                  {user ? "Plano atual" : "Começar grátis"}
                </Link>
              ) : (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`mt-6 ${plan.slug === "pro" ? "btn-primary" : "btn-secondary"} w-full`}
                >
                  Assinar com PIX
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pagamentos processados via PIX. Chave PIX: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{PIX_KEY}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Após o pagamento, seu plano será ativado automaticamente em até 24h.
          </p>
        </div>
      </div>

      {/* PIX Payment Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pagamento via PIX</h2>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">Plano {selectedPlan.name}</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatBRL(selectedPlan.price_cents)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">por mês</div>
            </div>

            {/* QR Code placeholder */}
            <div className="mb-6 flex flex-col items-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-950">
                <QrCode className="h-20 w-20 text-slate-300" />
              </div>
              <p className="mt-3 text-xs text-slate-400">Escaneie o QR Code com seu app de banco</p>
            </div>

            {/* PIX Copy */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Chave PIX (CNPJ)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={PIX_KEY}
                  className="input-field flex-1 font-mono"
                />
                <button
                  onClick={copyPixKey}
                  className="btn-secondary flex-shrink-0"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between py-1">
                <span>Beneficiario:</span>
                <span className="font-semibold">{PIX_MERCHANT}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Valor:</span>
                <span className="font-semibold">{formatBRL(selectedPlan.price_cents)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="btn-primary w-full"
            >
              Já paguei
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
