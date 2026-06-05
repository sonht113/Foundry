import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { useUIStore } from "../../stores/uiStore";

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const config = {
    success: {
      bg: "bg-emerald-950/90 border-emerald-800",
      text: "text-emerald-200",
      icon: CheckCircle2,
    },
    error: { bg: "bg-red-950/90 border-red-800", text: "text-red-200", icon: XCircle },
    warning: { bg: "bg-amber-950/90 border-amber-800", text: "text-amber-200", icon: AlertCircle },
    info: {
      bg: "bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700",
      text: "text-zinc-900 dark:text-zinc-200",
      icon: Info,
    },
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col-reverse gap-2">
      {toasts.map((toast) => {
        const { bg, text, icon: Icon } = config[toast.type];
        return (
          <div
            key={toast.id}
            className={`animate-in slide-in-from-right-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-xl backdrop-blur-sm ${bg} ${text}`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
