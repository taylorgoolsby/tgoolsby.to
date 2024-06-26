// /Users/taylrun/dev/tgoolsby.to/src/backend/src/project/places/rest/ChatCompletion.js
// @flow

import axios from 'axios'
import Config from 'common/src/Config.js'

export default class ChatCompletion {
  static async waitForCompletion(
    messages: Array<{ role: string, content: string }>,
  ): Promise<string> {
    // Ensure the pattern is enforced: system, user, assistant, alternating user and assistant, and ending with a user message
    const formattedMessages = formatMessages(messages)

    let response
    try {
      response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: formattedMessages,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${Config.openAiPublicTrialKey}`,
          },
        },
      )

      console.log(
        'response.data.choices[0].message.content',
        response.data.choices[0].message.content,
      )

      return response.data.choices[0].message.content
    } catch (err) {
      console.error(err.message)
      console.log('err.response.data', err.response.data)
      return '{}'
    }
  }
}

function formatMessages(
  messages: Array<{ role: string, content: string }>,
): Array<{ role: string, content: string }> {
  const result = []
  let expectRole = 'system'
  messages.forEach((message, index) => {
    if (index === 0 && message.role !== 'system') {
      throw new Error('First message must have a system role')
    }
    if (expectRole && message.role !== expectRole) {
      throw new Error(`Expected role ${expectRole} but got ${message.role}`)
    }
    result.push(message)
    expectRole =
      expectRole === 'system'
        ? 'user'
        : expectRole === 'user'
        ? 'assistant'
        : 'user'
  })

  // Ensure the last message is a user message
  if (result[result.length - 1].role !== 'user') {
    throw new Error('Last message must be a user message')
  }

  return result
}
