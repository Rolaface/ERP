import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
 
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
   proxy: {
  "/api": {
    target: "http://mysite.local:8000",
    changeOrigin: true,
    secure: true,
  },
}
},
});