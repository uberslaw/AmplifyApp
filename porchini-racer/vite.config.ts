import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/** Serve / copy project-root Art/ (e.g. Art/Porcini base image.png). */
function artFolderPlugin(): Plugin {
  const artDir = path.resolve(__dirname, 'Art')
  return {
    name: 'porchini-art-folder',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/Art/')) return next()
        const rel = decodeURIComponent(req.url.split('?')[0] ?? '').replace(/^\//, '')
        const file = path.resolve(__dirname, rel)
        if (!file.startsWith(artDir + path.sep) && file !== artDir) return next()
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        const ext = path.extname(file).toLowerCase()
        const type =
          ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : ext === '.webp'
                ? 'image/webp'
                : 'application/octet-stream'
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      if (!fs.existsSync(artDir)) return
      const dest = path.resolve(__dirname, 'dist', 'Art')
      fs.mkdirSync(dest, { recursive: true })
      for (const name of fs.readdirSync(artDir)) {
        const from = path.join(artDir, name)
        if (!fs.statSync(from).isFile()) continue
        fs.copyFileSync(from, path.join(dest, name))
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [artFolderPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
