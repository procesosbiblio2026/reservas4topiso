import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // In local dev, does the same job as api/gsheets.js on Vercel
        name: 'local-api-gsheets',
        configureServer(server) {
          server.middlewares.use('/api/gsheets', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            try {
              if (!env.APPS_SCRIPT_URL) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'APPS_SCRIPT_URL no configurada en .env' }))
                return
              }
              let upstream: Response
              if (req.method === 'POST') {
                let body = ''
                for await (const chunk of req) body += chunk
                const payload = body ? JSON.parse(body) : {}
                upstream = await fetch(env.APPS_SCRIPT_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({ ...payload, key: env.INTERNAL_KEY }),
                })
              } else if (req.method === 'GET') {
                upstream = await fetch(env.APPS_SCRIPT_URL)
              } else {
                res.statusCode = 405
                res.end(JSON.stringify({ error: 'Método no permitido' }))
                return
              }
              res.statusCode = upstream.status
              res.end(await upstream.text())
            } catch (err: any) {
              res.statusCode = 502
              res.end(JSON.stringify({ error: 'No se pudo contactar a Apps Script: ' + err.message }))
            }
          })
        },
      },
    ],
  }
})