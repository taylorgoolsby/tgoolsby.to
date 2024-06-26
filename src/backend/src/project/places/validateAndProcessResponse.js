// @flow

import PlayerInterface from './schema/Player/PlayerInterface.js'
import DescriptionInterface from './schema/Description/DescriptionInterface.js'
import ErrorInterface from './schema/Error/ErrorInterface.js'
import ChatCompletion from './rest/ChatCompletion.js'
import type { MainAgentResponse, UserEvent } from './context.js'
import MessageInterface from './schema/Message/MessageInterface.js'

export async function validateAndProcessResponse(
  response: MainAgentResponse,
  event: UserEvent,
) {
  if (response.position) {
    if (Array.isArray(response.position)) {
      response.position = [
        parseInt(response?.position?.[0] ?? 0),
        parseInt(response?.position?.[1] ?? 0),
        0,
      ]
    }
  }

  // Validate response format based on status code
  switch (response.statusCode) {
    case 200:
      break
    case 400:
    case 401:
    case 404:
    case 500:
      await ErrorInterface.logError(
        'Main Agent Error',
        response.errorReason ?? '',
      )
      break
    default:
      throw new Error('Unexpected status code in response')
  }

  // Process memory metadata if present
  const username = event.username
  if (username) {
    if (response.chatMessage) {
      await MessageInterface.insert(username, 'assistant', response.chatMessage)
    }

    if (response.textDescription && response.position) {
      await DescriptionInterface.storeOrUpdateTextDescription(
        response.position,
        [90, 90],
        response.textDescription,
      )
    }

    if (response.statusMetadata) {
      await PlayerInterface.updateStatusMetadata(
        username,
        response.statusMetadata,
      )
    }

    if (response.memoryMetadata) {
      await PlayerInterface.updateMemoryMetadata(
        username,
        response.memoryMetadata,
      )
    }
  }
}
