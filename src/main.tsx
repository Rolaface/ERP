import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.tsx";
import { initTheme } from "../src/themes.ts";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"; 
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";    
import { ThemeProvider } from "./theme/ThemeProvider"; // ✅ added

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>  
      <BrowserRouter>
        <ThemeProvider> {/* ✅ wrapped */}
          <App />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </BrowserRouter>
    </LocalizationProvider>
  </StrictMode>,
);