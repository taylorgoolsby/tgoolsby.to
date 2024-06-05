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
  cards: Array<any> = []
  socket: any = null

  constructor() {
    makeObservable(this, {
      username: observable,
      secret: observable,
      chat: observable,
      position: observable,
      lookDirection: observable,
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
        message,
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
  flex-direction: column;
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

  .chatWindow {
    background-color: rgba(0, 0, 0, 0.4);
    position: absolute;
    bottom: 0;
    left: 0;
    margin: 12px;
    padding: 12px;
    padding-top: 5px;
    color: white;
    width: 720px;

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

    store.socket.emit('event', {
      username,
      secret,
      chat: nextChat,
      position,
      lookDirection,
      cardId: '',
    })

    store.chat = nextChat
  }

  return (
    <View className={topLevelClassName}>
      <Chat messages={store.chat} onSubmit={sendChatMessage} />
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
        />
        <button onClick={submitMessage}>Send</button>
      </View>
    </View>
  )
}

export default Places
