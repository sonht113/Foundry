import { AlertTriangle, Info } from "lucide-react";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "danger" | "primary";
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    buttonVariant: "danger" as const,
  },
  primary: {
    icon: Info,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    buttonVariant: "primary" as const,
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  loadingLabel = "Processing...",
  variant = "primary",
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon size={18} className={config.iconColor} />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={config.buttonVariant} onClick={onConfirm} disabled={loading}>
          {loading ? loadingLabel : (confirmLabel ?? (variant === "danger" ? "Delete" : "Confirm"))}
        </Button>
      </div>
    </Modal>
  );
}
