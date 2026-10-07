import * as T from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToastTone = "success" | "danger" | "info";
interface ToastInput { title: string; description?: string; tone?: ToastTone }
interface ToastItem extends ToastInput { id: number }

const ToastContext = createContext<{ toast: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const accent: Record<ToastTone, string> = {
  success: "border-l-success",
  danger: "border-l-danger",
  info: "border-l-info",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((t: ToastInput) => setItems((p) => [...p, { ...t, id: nextId++ }]), []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <T.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((i) => (
          <T.Root
            key={i.id}
            // Errors interrupt screen readers; everything else waits politely.
            type={i.tone === "danger" ? "foreground" : "background"}
            onOpenChange={(open) => !open && setItems((p) => p.filter((x) => x.id !== i.id))}
            className={cn("toast-anim flex items-start gap-3 border-2 border-l-8 border-ink bg-paper p-4 shadow-hard-sm", accent[i.tone ?? "info"])}
          >
            <div className="flex-1">
              <T.Title className="font-bold">{i.title}</T.Title>
              {i.description && <T.Description className="mt-1 text-sm text-muted">{i.description}</T.Description>}
            </div>
            <T.Close aria-label="Dismiss notification" className="rounded p-1 hover:bg-sand">
              <X className="size-4" aria-hidden="true" />
            </T.Close>
          </T.Root>
        ))}
        <T.Viewport className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 outline-none" />
      </T.Provider>
    </ToastContext.Provider>
  );
}
