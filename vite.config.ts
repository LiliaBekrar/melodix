import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { appConfig } from './app.config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const repoName = env.VITE_REPOSITORY_NAME || appConfig.repositoryName
  const isGithubPagesProject = (env.VITE_GITHUB_PAGES_PROJECT || String(appConfig.githubPagesProject)).toLowerCase() === 'true'

  return {
    plugins: [react()],
    base: isGithubPagesProject ? `/${repoName}/` : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
