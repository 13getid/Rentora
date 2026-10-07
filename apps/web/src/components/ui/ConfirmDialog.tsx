import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string; // say exactly what will happen
  confirmLabel: string; // a verb, never "OK"
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
}

// Radix handles the hard accessibility parts: focus trap, Esc to close,
// focus returns to the trigger, and aria-labelledby/describedby wiring.
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, tone = "default", loading, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade fixed inset-0 z-40 bg-ink/50" />
        <Dialog.Content className="fade fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-paper p-6 shadow-hard">
          <Dialog.Title className="text-xl font-extrabold tracking-tight">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-muted">{description}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
