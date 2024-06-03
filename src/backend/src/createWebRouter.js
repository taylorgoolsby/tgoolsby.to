// @flow

import express from 'express'
import path from 'path'
import {fileURLToPath} from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function createWebRouter(app, webFolderName) {
  const router = express.Router()

  app.use((req, res, next) => {
    // Route based on subdomain.
    if (webFolderName === 'web-places' && req.subdomain === 'places') {
      router(req, res, next)
    } else if (webFolderName === 'web-index' && !req.subdomain) {
      router(req, res, next)
    } else {
      next()
    }
  })

  const webPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? `../../${webFolderName}/dist` : `../../../../${webFolderName}/dist`)

  router.use(express.static(webPath))

  router.get('/*', (req, res) => {
    const completedPath = path.resolve(
      webPath,
      '.' + req.path + '.html',
    )

    let usedPath = completedPath
    if (!fs.existsSync(completedPath)) {
      if (req.path.startsWith('/app')) {
        // Allows a page loading with a /app path to load the app.html file which has different logged out state than index.html.
        // This can avoid a flashing UI while waiting for the app to load.
        usedPath = path.resolve(__dirname, webPath, 'app.html')
      } else {
        usedPath = path.resolve(__dirname, webPath, 'index.html')
      }
    }

    const indexHtml = fs.readFileSync(usedPath, {
      encoding: 'utf-8',
    })
    res.send(indexHtml)
  })

  return router
}
