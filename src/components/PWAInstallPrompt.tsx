import { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone, CheckCircle2, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

const DISMISS_KEY = "pwa-install-dismissed";
const INSTALLED_KEY = "pwa-installed";
const DISMISS_COOLDOWN = 1000 * 60 * 60 * 24; // 24h

function shouldShowAfterDismiss(): boolean {
  try {
    if (localStorage.getItem(INSTALLED_KEY)) return false;
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    return !ts || !Number.isFinite(ts) || Date.now() - ts > DISMISS_COOLDOWN;
  } catch { return true; }
}

function remember(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Private browsing can block storage. */ }
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (isStandalone()) {
      remember(INSTALLED_KEY, "true");
      setInstalled(true);
      return;
    }

    if (isIOS()) {
      setPlatform("ios");
    } else if (/android/i.test(navigator.userAgent)) {
      setPlatform("android");
    }

    const showWithDelay = () => {
      if (!shouldShowAfterDismiss()) return;
      timers.push(setTimeout(() => { if (!isStandalone() && shouldShowAfterDismiss()) setShowModal(true); }, 1500));
    };

    const deferredHandler = (e: Event) => {
      e.preventDefault();
      // A fresh browser event also detects a previously removed installation.
      try { localStorage.removeItem(INSTALLED_KEY); } catch { /* Storage unavailable. */ }
      deferredRef.current = e as BeforeInstallPromptEvent;
      setInstallPrompt(e as BeforeInstallPromptEvent);
      showWithDelay();
    };

    const installedHandler = () => {
      setInstalled(true);
      setShowModal(false);
      setInstallPrompt(null);
      setShowSuccess(true);
      remember(INSTALLED_KEY, "true");
      timers.forEach(clearTimeout);
      timers.push(setTimeout(() => setShowSuccess(false), 4000));
    };

    // If beforeinstallprompt already fired (some browsers fire before JS runs),
    // we can't catch it, but we check for iOS which never fires it.
    window.addEventListener("beforeinstallprompt", deferredHandler);
    window.addEventListener("appinstalled", installedHandler);

    // For iOS and other browsers that don't fire beforeinstallprompt,
    // show instructions modal after a delay.
    if (isIOS()) {
      showWithDelay();
    } else {
      // Fallback: if no beforeinstallprompt after 4s, show a generic prompt
      // for browsers that might support install but didn't fire the event yet
      const fallbackTimer = setTimeout(() => {
        if (!deferredRef.current && !isStandalone() && shouldShowAfterDismiss()) {
          setShowModal(true);
        }
      }, 4000);
      return () => {
        timers.forEach(clearTimeout);
        clearTimeout(fallbackTimer);
        window.removeEventListener("beforeinstallprompt", deferredHandler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("beforeinstallprompt", deferredHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        remember(DISMISS_KEY, Date.now().toString());
      }
      setInstallPrompt(null);
      deferredRef.current = null;
    }
    setShowModal(false);
  };

  const handleDismiss = () => {
    remember(DISMISS_KEY, Date.now().toString());
    setShowModal(false);
  };

  if (installed && !showSuccess) return null;

  return (
    <>
      {showSuccess && (
        <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 animate-slide-up">
          <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg dark:border-green-800 dark:bg-slate-900">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              App instalado! Acesse pelo ícone na tela inicial.
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center"
          onClick={handleDismiss}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="relative w-full max-w-sm rounded-t-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-up dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
                <img src="/icon-192.png" alt="Ati TechHub" className="h-16 w-16 rounded-xl" />
              </div>

              <h2 id="pwa-install-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Instale o Ati TechHub
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Acesse vagas de tecnologia, salários e rankings diretamente do seu celular. Rápido, offline e sem app store.
              </p>

              {platform === "ios" ? (
                <div className="mt-5 w-full rounded-xl bg-slate-50 p-4 text-left dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Como instalar no iPhone/iPad
                  </p>
                  <ol className="mt-2.5 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">1</span>
                      Toque no botão Compartilhar
                      <Share className="h-4 w-4 flex-shrink-0 text-primary-600" />
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">2</span>
                      Selecione "Adicionar à Tela de Início"
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">3</span>
                      Toque em "Adicionar"
                    </li>
                  </ol>
                </div>
              ) : null}

              <div className="mt-5 flex w-full flex-col gap-2.5">
                {installPrompt ? (
                  <button
                    onClick={handleInstall}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-700 active:scale-[0.98]"
                  >
                    <Download className="h-5 w-5" />
                    Instalar agora
                  </button>
                ) : platform === "android" ? (
                  <p className="text-xs text-slate-400">
                    Abra o menu do navegador e toque em "Instalar app" ou "Adicionar à tela inicial".
                  </p>
                ) : platform === "other" ? <p className="text-xs text-slate-400">Use o menu do navegador para instalar este site como aplicativo, quando disponível.</p> : null}
                <button
                  onClick={handleDismiss}
                  className="w-full rounded-xl px-5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {platform === "ios" ? "Entendi" : "Agora não"}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <Smartphone className="h-3.5 w-3.5" />
                Funciona como app nativo
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
