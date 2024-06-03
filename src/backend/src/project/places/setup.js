// /Users/taylrun/dev/tgoolsby.to/src/backend/src/project/places/setup.js
// @flow

import axios from 'axios';
import Config from 'common/src/Config.js';
import { prepareContext, makeCompletionCall } from "./context.js";
import http from 'http';
import { Server } from 'socket.io';
import tld from "tldjs";
import { initializeDatabase } from "./schema/initializeDatabase.js";
import { validateAndProcessResponse } from "./validateAndProcessResponse.js";
import PlayerInterface from './schema/Player/PlayerInterface.js';
import { generateSecret } from './utils/generateSecret.js';
import ChatCompletion from './rest/ChatCompletion.js';

export default function (app, router) {
  const server = http.createServer(app);
  const io = new Server(server);

  io.use((socket, next) => {
    // Check subdomain
    const handshakeData = socket.request;
    const host = handshakeData.headers.host;
    const subdomain = tld.parse(host).subdomain;

    if (subdomain === 'places') {
      next();
    } else {
      next(new Error('Invalid subdomain'));
    }
  });

  io.on('connection', socket => {
    console.log('a user connected to places');

    socket.on('disconnect', () => {
      console.log('user disconnected from places');
    });

    socket.on('event', async (event) => {
      try {
        const { username, secret } = event;

        if (username && !secret) {
          socket.emit('error', 'Unauthorized request');
          return;
        }

        if (username && secret) {
          // Check if secret matches username
          const playerData = await PlayerInterface.getPlayerData(username);
          if (!playerData || playerData.secret !== secret) {
            socket.emit('error', 'Unauthorized request');
            return;
          }
        }



        // Process the request
        const context = await prepareContext(event, socket);
        const response = await makeCompletionCall(context);
        await validateAndProcessResponse(response, event);

        if (response.initialSetupConversation) {
          await handleInitialSetup(username, response);
        } else if (response.verificationConversation) {
          await handleVerification(username, response);
        }

        if (response.memoryMetadata) {
          await PlayerInterface.updatePlayerMetadata(username, response.memoryMetadata.statusMetadata, response.memoryMetadata.memoryMetadata);
        }

        // Broadcast the new data to all connected clients
        io.emit('update', response);
      } catch (error) {
        console.error('Error handling event:', error);
        socket.emit('error', error.message);
      }
    });
  });

  initializeDatabase().catch(console.error);
}

async function initiateInitialSetup() {
  // Logic to initiate initial setup
}

async function handleInitialSetup(username, response) {
  const secret = generateSecret(); // Generate a unique secret for the user
  await PlayerInterface.insertPlayer(
    username,
    response.status,
    response.color,
    secret,
    response.position,
    response.look_direction,
    response.statusMetadata,
    response.memoryMetadata,
    response.initialSetupConversation
  );
  return secret;
}

async function handleVerification(username, response) {
  const playerData = await PlayerInterface.getPlayerData(username);
  const verificationResult = await verifyUser(playerData.initialSetupConversation, response.verificationConversation);
  if (!verificationResult) {
    throw new Error('Verification failed');
  }
  return true;
}

async function verifyUser(initialSetupConvo, verificationConvo) {
  const messages = [
    {
      role: 'system',
      content: 'You are an agent tasked with figuring out if this person is who they say they are.'
    },
    {
      role: 'user',
      content: `Here is the conversation you had with them when they set up their account: ${initialSetupConvo}`
    },
    {
      role: 'assistant',
      content: 'Here is the conversation they recently had in attempting to gain access to the account:'
    },
    {
      role: 'user',
      content: verificationConvo
    },
    {
      role: 'assistant',
      content: 'Please tell us, are they allowed access to the account?'
    },
    {
      role: 'user',
      content: 'Please confirm the account access status.'
    }
  ];

  const responseText = await ChatCompletion.waitForCompletion(messages);
  return parseVerificationResponse(responseText);
}

function parseVerificationResponse(responseText) {
  return responseText.trim().toUpperCase() === 'YES';
}
