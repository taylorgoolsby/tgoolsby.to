// @flow

// import path from 'path'
// import { fileURLToPath } from 'url'
// // $FlowFixMe
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

import express from 'express'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import { default as setupPlaces } from './project/places/setup.js'
import createWebRouter from './createWebRouter.js'
import tld from 'tldjs'
import http from 'http'

const app: any = express()

app.use(cors())
app.use(express.json())
app.use(fileUpload())

app.use((req, res, next) => {
  const parsed = tld.parse(req.headers.host)
  req.subdomain = parsed.subdomain
  next()
})

app.use(function (req, res, next) {
  const timestamp = Date.now()
  req.timestamp = timestamp
  next()
})

// Append `req.clientIp`.
app.use(function (req, res, next) {
  try {
    const xForwardedFor = req.get('x-forwarded-for')?.split(', ') ?? []
    // If spoofed:
    // [0] is the spoofed ip
    // [1] is the client ip
    // [2:n-2] are intermediate proxies
    // [n-1] is the cloudfront proxy.

    // If not spoofed:
    // [0] is the client ip
    // [1:n-2] are intermediate proxies
    // [n-1] is the cloudfront proxy.

    // If spoofed, there's at least 3.
    // If not, there's at least 2.

    const spoofOrClient = xForwardedFor[0] ?? '127.0.0.1'
    const clientOrProxy = xForwardedFor[1] ?? spoofOrClient

    if (xForwardedFor.length === 2) {
      req.clientIp = spoofOrClient
    } else {
      req.clientIp = clientOrProxy
    }

    if (!req.clientIp) {
      res.status(400).json({ error: 'IP address unresolved.' })
    } else {
      next()
    }
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'IP address unresolved.' })
  }
})

app.get('/health', (req, res) => {
  res.send('OK')
})

// Redirect http to https if not on localhost.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.header('x-forwarded-proto') === 'http') {
    console.log('redirect')
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})

// Set up routes for serving web pages for each project by subdomain.
const webIndexRouter = createWebRouter(app, 'web-index')
const webPlacesRouter = createWebRouter(app, 'web-places')

setupPlaces(app, webPlacesRouter)

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

const server: any = http.createServer(app)
export default server
