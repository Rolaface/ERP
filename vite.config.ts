import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
 
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
   proxy: {
  "/api": {
    target: "http://site1.local:8001",
    changeOrigin: true,
    secure: true,
  },
}
},
});