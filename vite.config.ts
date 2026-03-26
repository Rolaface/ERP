import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
                  cookie
                    .replace(/;\s*Secure/gi, "")
                    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax"),
                );
              }
            });
          },
        },
      },
    },
  };
});
