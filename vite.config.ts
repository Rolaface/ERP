import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
 
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
   proxy: {
  "/api": {
    // target: "https://api.erp.lms.rolaface.com",
    // target: "http://lms.local:8000",
    target: "http://zambia.local:8000",
    // target: "http://erp.local:8000",
    changeOrigin: true,
    secure: true,
  },
}
},
});