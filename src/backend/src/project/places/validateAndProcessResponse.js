// @flow

import PlayerInterface from './schema/Player/PlayerInterface.js'
import DescriptionInterface from './schema/Description/DescriptionInterface.js'
import ErrorInterface from './schema/Error/ErrorInterface.js'
import ChatCompletion from './rest/ChatCompletion.js'
import type { MainAgentResponse, UserEvent } from './context.js'
import MessageInterface from './schema/Message/MessageInterface.js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

    const textDescription = response.textDescription
    const position = response.position
    if (textDescription && position) {
      const existingDescription = await DescriptionInterface.get(response.position[0], response.position[1], response.position[2])
      if (existingDescription) {
        await DescriptionInterface.update(
          position,
          textDescription,
        )
      } else {
        await DescriptionInterface.insert(
          position,
          textDescription,
        )
      }
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

async function generateImage(textDescription: string) {
  const engineId = 'stable-diffusion-xl-1024-v1-0'
  const apiHost = 'https://api.stability.ai'
  const apiKey = 'sk-GHtkeJBKQa7TClVDyitlxetZNsLcnFlyghpNbivN4pwO82a8'

  if (!apiKey) throw new Error('Missing Stability API key.')

  const response = await fetch(
    `${apiHost}/v1/generation/${engineId}/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: textDescription,
          },
          {
            text: 'anime',
          },
          {
            text: 'blurry bad beings',
            weight: -1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Non-200 response: ${await response.text()}`)
  }

  const responseJSON = await response.json()
  const imageBase64 = responseJSON.artifacts[0].base64

  // Decode the base64 image
  const buffer = Buffer.from(imageBase64, 'base64');
  return buffer
}

async function generateAndSaveImage(text: string) {
  const imageBuffer = await generateImage(text)

  // Upload to S3
  const bucketName = process.env.S3_BUCKET_NAME;
  const key = `generated-images/${Date.now()}.png`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentEncoding: 'base64', // required
    ContentType: 'image/png', // required
  };

  try {
    await s3.upload(params).promise();
    console.log(`Image successfully uploaded to ${bucketName}/${key}`);
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    throw new Error(`Error uploading image to S3: ${error.message}`);
  }
}
