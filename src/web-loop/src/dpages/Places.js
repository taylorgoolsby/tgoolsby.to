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

  sendState: any = () => {
    if (!this.socket?.connected) return
    const { username, secret, chat, position, lookDirection } = this
    const payload = {
      username,
      secret,
      chat,
      position,
      lookDirection,
      cardId: '',
    }
    console.log('payload', payload)
    this.socket.emit('event', payload)
  }

  sendChatMessage = (message: string) => {
    const nextChat = this.chat.concat([{ role: 'user', content: message }])
    this.chat = nextChat
    this.sendState()
  }

  move: any = (dir: string) => {
    if (dir === 'up')  {
      this.position = [this.position[0], this.position[1] + 1, this.position[2]]
    } else if (dir === 'right') {
      this.position = [this.position[0] + 1, this.position[1], this.position[2]]
    } else if (dir === 'down')  {
      this.position = [this.position[0], this.position[1] - 1, this.position[2]]
    } else if (dir === 'left')  {
      this.position = [this.position[0] - 1, this.position[1], this.position[2]]
    }
    this.sendState()
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
    background-color: #333;
    align-self: stretch;
    width: 450px;
    color: white;
  }
  
  .controls-overlay {
    position: absolute;
    top: 0;  
    right: 0;
    bottom: 0;
    left: 0;
    
    button {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      width: 45px;
      height: 45px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 1);
        cursor: pointer;
      }
    }
    
    button.up {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    button.left {
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }

    button.down {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    button.right {
      top: 50%;
      right: 0;
      transform: translateY(-50%);
    }
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
      overflow-y: scroll;  
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

  return (
    <View className={topLevelClassName}>
      <Image/>
      {/*<Panel messages={store.chat} onSubmitChatMessage={sendChatMessage} />*/}
    </View>
  )
})

const Image: any = observer((props) => {
  const {  } = props

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
    return `data:image/png;base64,${imageBase64}`
  }

  useEffect(() => {
    if (store.textDescription) {
      generateImage(store.textDescription).then(setImage).catch(console.error)
    }
  }, [store.textDescription])

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
            alt={store.textDescription}
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
            alt={store.textDescription}
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
        <ControlsOverlay/>
      </View>
      <Panel messages={store.chat} onSubmitChatMessage={store.sendChatMessage} />
    </View>
  )
})

const Panel: any = observer((props) => {
  const { messages, onSubmitChatMessage } = props

  return (
    <View className="panel">
      <Text style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: 12, alignSelf: 'stretch' }}>
        {`Username: ${store.username}`}
      </Text>
      <Text style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: 12, alignSelf: 'stretch' }}>
        {`Authenticated: ${store.secret ? 'yes' : 'no'}`}
      </Text>
      <Text style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: 12, alignSelf: 'stretch' }}>
        {`Position: ${JSON.stringify(store.position)}`}
      </Text>
      <Text
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: 12,
          alignSelf: 'stretch'
        }}
      >
        {store.textDescription}
      </Text>
      <Chat messages={messages} onSubmit={onSubmitChatMessage} />
    </View>
  )
})

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

const ControlsOverlay: any = (props) => {
  return (
    <View className={'controls-overlay'}>
      <button onClick={() => store.move('up')} className="up"><span>▲</span></button>
      <button onClick={() => store.move('right')} className="right"><span>▶</span></button>
      <button onClick={() => store.move('down')} className="down"><span>▼</span></button>
      <button onClick={() => store.move('left')} className="left"><span>◀</span></button>
    </View>
  )
}

export default Places
