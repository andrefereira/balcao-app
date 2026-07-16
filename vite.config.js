import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANTE: o valor de "base" deve ser o nome do repositório no GitHub.
// Se você criar o repositório com outro nome, ajuste aqui.
export default defineConfig({
  plugins: [react()],
  base: "/balcao-app/",
});
