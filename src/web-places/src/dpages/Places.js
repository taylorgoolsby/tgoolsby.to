// @flow

import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import Config from '../Config.js'
import View from '../components/View.js'
import Text from '../components/Text.js'

const Places: any = () => {
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const [chat, setChat] = useState<Array<{ role: string, content: string }>>([])
  const [position, setPosition] = useState<Array<number>>([0, 0, 0])
  const [lookDirection, setLookDirection] = useState<Array<number>>([90, 90])
  const [cards, setCards] = useState<Array<any>>([])

  const socket = useRef<any>(null)

  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true

      console.log('Config.backendHost', Config.backendHost)

      socket.current = io(Config.backendHost, {
        reconnection: true, // Enable reconnection
      })

      socket.current.on('connect', () => {
        console.log('socket connected')
      })

      socket.current.on('disconnect', () => {
        console.log('disconnected')
      })

      socket.current.on('update', (event: any) => {
        const {
          statusCode,
          username,
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

        setChat(chat)
      })

      socket.current.on('error', (event: any) => {
        console.error(event)
      })
    }
  }, [])

  function sendChatMessage(message: string) {
    if (!socket.current) return

    const nextChat = chat.concat([{ role: 'user', content: message }])

    console.log('sending')

    socket.current.emit('event', {
      username,
      secret,
      chat: nextChat,
      position,
      lookDirection,
      cardId: '',
    })

    setChat(nextChat)
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Chat messages={chat} onSubmit={sendChatMessage} />
    </div>
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
    <View>
      {messages.map((m, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <Text>{`${m.role}: `}</Text>
          <Text>{m.content}</Text>
        </View>
      ))}
      <View style={{ flexDirection: 'row' }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={submitMessage}>Send</button>
      </View>
    </View>
  )
}

export default Places
