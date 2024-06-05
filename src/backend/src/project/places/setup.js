// @flow

import { prepareContext, makeCompletionCall } from './context.js'
import http from 'http'
import { Server } from 'socket.io'
import tld from 'tldjs'
import { initializeDatabase } from './schema/initializeDatabase.js'
import { validateAndProcessResponse } from './validateAndProcessResponse.js'
import PlayerInterface from './schema/Player/PlayerInterface.js'
import { generateSecret } from './utils/generateSecret.js'
import ChatCompletion from './rest/ChatCompletion.js'
import type { MainAgentResponse, UserEvent } from './context.js'
import MessageInterface from './schema/Message/MessageInterface.js'
import Config from 'common/src/Config.js'
import DescriptionInterface from './schema/Description/DescriptionInterface.js'

export default function (app: any): any {
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  })

  io.use((socket, next) => {
    if (!Config.isProd) return next()

    // Check subdomain
    const handshakeData = socket.request
    const host = handshakeData.headers.host
    const subdomain = tld.parse(host).subdomain

    console.log('subdomain', subdomain)

    if (subdomain === 'places') {
      next()
    } else {
      next(new Error('Invalid subdomain'))
    }
  })

  io.on('connection', async (socket) => {
    console.log('a user connected to places')

    const description = await DescriptionInterface.get(0, 0, 0)

    socket.emit('update', {
      statusCode: 200,
      chat: [{ role: 'assistant', content: 'Welcome! What is your name?' }],
      position: [0, 0, 0],
      lookDirection: [90, 90],
      textDescription: description?.text ?? '',
    })

    socket.on('disconnect', () => {
      console.log('user disconnected from places')
    })

    socket.on('event', async (event) => {
      try {
        const {
          /* The following is what the client can send. */

          /*
            Leave empty if logged out.
          */
          username,

          /*
            Must match the username's secret in order to perform actions as that user.
            The secret is provided by in the server's response.
          */
          secret,

          /*
            You may use message when username and secret are empty, I.E. the user is logged out.
            The server will attempt to walk the user through the log in process, ultimately providing a secret.
            The client should then set the username and secret to the provided values to continue logged in.

            When logged out, the client is the authority on the chat history, meaning, client's chat history is the source of truth.
            When logged in, the server is the authority on the chat history, meaning, server's chat history is the source of truth,

            So, when logged out, the entire chat array is considered,
            but when logged in, only the last user message in the chat array (the new message from the user) is considered.

            chat is an Array<{role: string, content: string}>
          */
          chat,

          /*
            The position in the world the user is attempting to move to.
            This is an array of three integers: [x, y, z]
            Z is locked to 0 at this time.
          */
          // position,

          /*
            The direction in the world the user is looking.
            This is a placeholder and is currently locked to [90, 90], which is looking straight down the z-axis,
            with y-up.
            This is because the current game world is restricted to 2D.
          * */
          lookDirection,

          /*
            The server may at times issue out a card to a username.
            The client may play a card by setting this value to the card's id.
            The server always includes a list of cards the username has in responses.
          */
          cardId,
        } = event

        // Check, validate, sanitize user inputs immediately:

        // Lock z=0
        const position = [...event.position]
        console.log('typeof event.position', typeof event.position)
        console.log('position.length', position.length)
        if (position.length !== 3) {
          socket.emit('error', 'Invalid position')
          return
        }
        position[0] = parseInt(position[0])
        position[1] = parseInt(position[1])
        position[2] = 0

        let playerData
        let realChat = chat
        if (username && secret) {
          // Check if secret matches username
          playerData = await PlayerInterface.getPlayerData(username)
          if (!playerData || playerData.secret !== secret) {
            socket.emit('error', 'Unauthorized request')
            return
          }

          // Once logged in, chat history is server authoritative
          const chatHistory = await MessageInterface.getHistory(username)
          realChat = chatHistory.map((message) => ({
            role: message.role,
            content: message.content,
          }))

          // Last user message is the new message from the user
          if (chat && chat.length) {
            const lastMessage = chat[chat.length - 1]
            if (lastMessage.role === 'user') {
              realChat.push(lastMessage)
            }
          }
        }

        const userEvent: UserEvent = {
          username,
          secret,
          chat: realChat,
          position,
          lookDirection,
          cardId,
        }

        // Process the request
        const context = await prepareContext(userEvent, socket, playerData)
        const response = await makeCompletionCall(context)
        await validateAndProcessResponse(response, event)

        let setSecret
        if (response.initialSetupConversation) {
          try {
            setSecret = await handleInitialSetup(response)
          } catch (err) {
            console.error(err)
          }
        } else if (response.verificationConversation) {
          try {
            setSecret = await handleVerification(response)
          } catch (err) {
            console.error(err)
          }
        }

        const outputChat = (userEvent.chat ?? []).concat([
          { role: 'assistant', content: response.chatMessage },
        ])

        // Broadcast the new data to all connected clients
        io.emit('update', {
          statusCode: response.statusCode,
          username: userEvent.secret
            ? userEvent.username
            : response.intendedUsername,
          secret: setSecret,
          message: response.chatMessage,

          position: JSON.parse(context.request.requestedPosition),
          lookDirection: JSON.parse(context.request.lookDirection),
          textDescription: response.textDescription,

          // The cards the username has:
          cardIds: [], // todo

          status: playerData?.status ?? '',
          statusMetadata:
            response.statusMetadata ?? playerData?.statusMetadata ?? {},

          chat: outputChat,
        })
      } catch (error) {
        console.error('Error handling event:', error)
        socket.emit('error', error.message)
      }
    })
  })

  initializeDatabase().catch(console.error)

  return server
}

async function initiateInitialSetup() {
  // Logic to initiate initial setup
}

async function handleInitialSetup(
  response: MainAgentResponse,
): Promise<?string> {
  const username = response.intendedUsername
  if (!username) {
    response.statusCode = 500
    response.errorReason = 'Agent did not respond correctly. Try again.'
    return
  }

  const secret = generateSecret() // Generate a unique secret for the user
  await PlayerInterface.insertPlayer(
    username,
    '',
    '#FFFFFF',
    secret,
    [0, 0, 0],
    [0, 0],
    response.statusMetadata ?? {},
    response.memoryMetadata ?? {},
    response.initialSetupConversation ?? '',
  )
  return secret
}

async function handleVerification(
  response: MainAgentResponse,
): Promise<?string> {
  const verificationConversation = response.verificationConversation ?? ''

  const username = response.intendedUsername
  if (!username) {
    response.statusCode = 500
    response.errorReason = 'Agent did not respond correctly. Try again.'
    return
  }

  const playerData = await PlayerInterface.getPlayerData(username)
  if (!playerData) {
    return null
  }
  if (!playerData.secret) {
    return null
  }
  const initialSetupConversation = playerData.initialSetupConversation
  if (!initialSetupConversation) {
    return null
  }

  const verificationResult = await verifyUser(
    initialSetupConversation,
    verificationConversation,
  )
  if (!verificationResult) {
    response.statusCode = 401
    response.errorReason = 'Verification failed.'
    return
  }
  return playerData.secret
}

async function verifyUser(
  initialSetupConvo: string,
  verificationConvo: string,
) {
  const messages = [
    {
      role: 'system',
      content:
        'You are an agent tasked with figuring out if this person is who they say they are. You will be given two conversations to review. The first is the conversation they had when they set up their account. The second is the conversation they recently had in attempting to gain access to the account. You must determine if they are allowed access to the account. Reply with a JSON object with a single key, "allowed", with a boolean value.',
    },
    {
      role: 'user',
      content: `Here is the conversation you had with them when they set up their account: ${initialSetupConvo}\n\nHere is the conversation they recently had in attempting to gain access to the account: ${verificationConvo}\n\nPlease tell us, are they allowed access to the account?`,
    },
  ]

  const res = await ChatCompletion.waitForCompletion(messages)
  const json = JSON.parse(res)
  return !!json.allowed
}
