// @flow

import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import Config from '../Config.js'
import View from '../components/View.js'
import Text from '../components/Text.js'
import { css } from 'goober'
import { makeObservable, observable, action } from 'mobx'
import { observer } from 'mobx-react-lite'

class PlacesStore {
  username: string = ''
  secret: string = ''
  chat: Array<{ role: string, content: string }> = []
  position: Array<number> = [0, 0, 0]
  lookDirection: Array<number> = [90, 90]
  textDescription: string = ''
  cards: Array<any> = []
  socket: any = null

  constructor() {
    makeObservable(this, {
      username: observable,
      secret: observable,
      chat: observable,
      position: observable,
      lookDirection: observable,
      textDescription: observable,
      cards: observable,
    })
  }

  connect = () => {
    this.socket = io(Config.backendHost, {
      reconnection: true, // Enable reconnection
    })

    this.socket.on('connect', () => {
      console.log('socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.log('connect_error', error)
    })

    this.socket.on('update', (event: any) => {
      console.log('event', event)
      const {
        statusCode,
        // username,
        secret,
        position,
        lookDirection,
        textDescription,
        cardIds,
        status,
        statusMetadata,
        chat,
      } = event

      if (!secret && event.username) {
        // The server tells the client the username it is trying to authenticate,
        // and the client should forward this value back to the server on subsequent requests.
        this.username = event.username
      }

      if (secret) {
        this.secret = secret
      }

      this.position = position
      this.lookDirection = lookDirection
      this.textDescription = textDescription
      this.chat = chat
    })

    this.socket.on('error', (event: any) => {
      console.error(event)
    })
  }
}
const store = new PlacesStore()

export const topLevelClassName: string = css`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-width: 0;
  position: relative;
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  > * {
    flex-shrink: 0;
  }

  .image {
  }

  .panel {
    background-color: rgba(0, 0, 0, 0.9);
    align-self: stretch;
    flex: 1;
    max-width: 450px;
    color: white;
  }

  .chatWindow {
    flex: 1;
    padding: 12px;
    padding-top: 5px;
    color: white;
    justify-content: flex-end;
    align-self: stretch;

    > .wrapper {
      min-height: calc(5 * 1.5em);
    }
  }

  .chatItem {
    display: block;
    flex-direction: row;
    line-height: 1.5;
  }

  .chatInputRow {
    flex-direction: row;
    margin-top: 5px;
    align-self: stretch;

    input {
      flex: 1;
    }

    button {
      margin-left: 12px;
    }
  }
`

const Places: any = observer(() => {
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      store.connect()
    }
  }, [])

  function sendChatMessage(message: string) {
    const { username, secret, chat, position, lookDirection } = store

    if (!store.socket?.connected) return

    const nextChat = chat.concat([{ role: 'user', content: message }])

    console.log('username', username)
    console.log('secret', secret)
    console.log('position', position)

    const payload = {
      username,
      secret,
      chat: nextChat,
      position,
      lookDirection,
      cardId: '',
    }

    console.log('payload', payload)

    store.socket.emit('event', payload)

    store.chat = nextChat
  }

  return (
    <View className={topLevelClassName}>
      <Image
        position={store.position}
        textDescription={store.textDescription}
      />
      <Panel messages={store.chat} onSubmitChatMessage={sendChatMessage} />
    </View>
  )
})

const Image: any = (props) => {
  const { position, textDescription } = props

  const [image, setImage] = useState('')

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
              text: 'blurry bad',
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
    return `data:image/png;base64,${imageBase64}`
  }

  useEffect(() => {
    if (textDescription) {
      generateImage(textDescription).then(setImage).catch(console.error)
    }
  }, [textDescription])

  return (
    <View
      style={{
        alignSelf: 'stretch',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'black',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {image ? (
          <img
            src={image}
            alt={textDescription}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(3px) grayscale(0%) brightness(0.5)',
            }}
          />
        ) : null}
      </View>
      <View
        style={{
          aspectRatio: 1,
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={textDescription}
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
        <Text
          style={{
            position: 'absolute',
            top: '76%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: 12,
          }}
        >
          {textDescription}
        </Text>
      </View>
      <Text style={{ position: 'absolute', top: 0, left: 0, color: 'white' }}>
        {JSON.stringify(position)}
      </Text>
    </View>
  )
}

const Panel: any = (props) => {
  const { messages, onSubmitChatMessage } = props

  return (
    <View className="panel">
      <Chat messages={messages} onSubmit={onSubmitChatMessage} />
    </View>
  )
}

const Chat: any = (props) => {
  const { onSubmit, messages } = props

  const [inputValue, setInputValue] = useState('')

  function submitMessage() {
    onSubmit(inputValue)
    setInputValue('')
  }

  return (
    <View className="chatWindow">
      <View className="wrapper">
        {messages.map((m, i) => (
          <View key={i} className={'chatItem'}>
            <Text>{`${m.role}: `}</Text>
            <Text>{m.content}</Text>
          </View>
        ))}
      </View>
      <View className="chatInputRow">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitMessage()
            }
          }}
          autoFocus
        />
        <button onClick={submitMessage}>Send</button>
      </View>
    </View>
  )
}

export default Places
