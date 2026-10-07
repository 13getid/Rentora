import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./pages/Landing";
import Styleguide from "./pages/Styleguide";
import { ToastProvider } from "./components/ui/Toast";

// Temporary routing until React Router arrives in Phase 3.
const Page = window.location.pathname.startsWith("/styleguide") ? Styleguide : Landing;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Page />
    </ToastProvider>
  </StrictMode>,
);
