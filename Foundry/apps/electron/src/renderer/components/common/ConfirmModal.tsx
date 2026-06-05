import { AlertTriangle } from "lucide-react";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-300 dark:text-zinc-300 dark:text-zinc-700">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:bg-red-600/50"
        >
          {loading ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
