import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages pe site /Avara/ subpath pe serve hoti hai
  // isliye base set karna zaroori hai — bina iske CSS/JS load nahi hota
  base: '/Avara/',
})
