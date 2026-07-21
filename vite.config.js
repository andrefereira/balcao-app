import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANTE: o valor de "base" deve ser o nome do repositório no GitHub.
// Se você criar o repositório com outro nome, ajuste aqui.
const base = "/balcao-app/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-educarte.webp"],
      manifest: {
        name: "Educarte — Balcão, do pedido à entrega",
        short_name: "Educarte",
        description: "Sistema de gestão de pedidos da papelaria Educarte.",
        lang: "pt-BR",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#F6F3EC",
        theme_color: "#F6F3EC",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
