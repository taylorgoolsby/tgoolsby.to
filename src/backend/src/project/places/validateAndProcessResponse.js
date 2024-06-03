// @flow

import PlayerInterface from './schema/Player/PlayerInterface.js';
import DescriptionInterface from './schema/Description/DescriptionInterface.js';
import ErrorInterface from './schema/Error/ErrorInterface.js';
import ChatCompletion from './rest/ChatCompletion.js';

export async function validateAndProcessResponse(response, event) {
  // Validate response format based on status code
  switch (response.status_code) {
    case 200:
      if (response.vector_embedding && response.text_description && response.ai_message) {
        await DescriptionInterface.storeTextDescription(event.position, event.look_direction, response.text_description, response.vector_embedding);
      } else {
        throw new Error('Invalid response format for status code 200');
      }
      break;
    case 400:
    case 401:
    case 404:
    case 500:
      if (!response.error_message) {
        throw new Error(`Invalid response format for status code ${response.status_code}`);
      }
      await ErrorInterface.logError(response.error_message, response.ai_generated_message);
      break;
    default:
      throw new Error('Unexpected status code in response');
  }

  // Process initial setup or verification conversation if present
  if (response.initialSetupConversation) {
    await PlayerInterface.insertPlayer(
      response.intendedUsername,
      response.status,
      response.color,
      response.secret,
      response.position,
      response.look_direction,
      response.statusMetadata,
      response.memoryMetadata,
      response.initialSetupConversation
    );
  } else if (response.verificationConversation) {
    const playerData = await PlayerInterface.getPlayerData(response.intendedUsername);
    const verificationResult = await verifyUser(playerData.initialSetupConversation, response.verificationConversation);
    if (!verificationResult) {
      throw new Error('Verification failed');
    }
  }

  // Process memory metadata if present
  if (response.memoryMetadata) {
    await PlayerInterface.updatePlayerMetadata(event.username, response.memoryMetadata.statusMetadata, response.memoryMetadata.memoryMetadata);
  }
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
