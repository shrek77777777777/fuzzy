import { useCallback, useEffect, useRef, useState } from 'react'
import { getProfile, login, logout, refreshAccessToken, register } from './api/auth'
import { AuthScreen } from './components/AuthScreen'
import { ChatScreen } from './components/ChatScreen'
import { connectChat, sendChatMessage } from './services/websocket'
import type { ChatMessage, ServerEvent, SocketStatus, User } from './types'

const TOKEN_KEY = 'pulse_access_token'

export default function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<SocketStatus>('disconnected')
  const [busy, setBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [chatError, setChatError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const tokenRef = useRef(token)

  useEffect(() => { tokenRef.current = token }, [token])

  const closeSocket = useCallback(() => {
    const socket = socketRef.current
    socketRef.current = null
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Client leaving')
    setStatus('disconnected')
  }, [])

  const handleServerEvent = useCallback((event: ServerEvent) => {
    if (event.type !== 'NEW_MESSAGE') return

    // Сервер может прислать данные как внутри payload, так и на верхнем уровне.
    const payload = event.payload && typeof event.payload === 'object'
      ? event.payload as Record<string, unknown>
      : {}
    const root = event as unknown as Record<string, unknown>
    const textValue = payload.text ?? root.text
    if (typeof textValue !== 'string') return

    const senderValue = payload.sender ?? payload.username ?? root.sender ?? root.username
    const sender = typeof senderValue === 'string' && senderValue.trim()
      ? senderValue.trim()
      : 'Неизвестный пользователь'

    const rawTimestamp = payload.timestamp ?? root.timestamp
    let timestamp = typeof rawTimestamp === 'number'
      ? rawTimestamp
      : typeof rawTimestamp === 'string' ? Date.parse(rawTimestamp) : Date.now()
    // Некоторые серверы передают Unix-время в секундах, а Date ожидает миллисекунды.
    if (Number.isFinite(timestamp) && timestamp > 0 && timestamp < 1_000_000_000_000) timestamp *= 1000
    if (!Number.isFinite(timestamp) || timestamp <= 0) timestamp = Date.now()

    const rawId = payload.id ?? root.id
    const id = typeof rawId === 'string' || typeof rawId === 'number'
      ? String(rawId)
      : `${timestamp}-${Math.random().toString(36).slice(2)}`

    setMessages((current) => {
      // Не добавляем повторно одно и то же серверное сообщение при повторной доставке.
      if (current.some((message) => message.id === id)) return current
      return [...current, {
        id,
        sender,
        text: textValue,
        timestamp,
        own: sender === user?.username,
      }]
    })
  }, [user?.username])

  useEffect(() => {
    if (!token || !user) return
    closeSocket()
    const socket = connectChat(token, {
      onStatus: setStatus,
      onMessage: handleServerEvent,
      onError: () => setChatError('Сервер отклонил подключение или произошла ошибка. Проверь токен и попробуй войти снова.'),
    })
    socketRef.current = socket
    return () => {
      if (socketRef.current === socket) socketRef.current = null
      if (socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Component cleanup')
    }
  }, [token, user, closeSocket, handleServerEvent])

  useEffect(() => {
    let cancelled = false
    async function restoreSession() {
      try {
        let currentToken = tokenRef.current
        if (currentToken) {
          try {
            const profile = await getProfile(currentToken)
            if (!cancelled) setUser(profile)
            return
          } catch {
            // Access token мог истечь: пробуем обновить его через HttpOnly refresh-cookie.
          }
        }
        const refreshed = await refreshAccessToken()
        currentToken = refreshed.access
        if (cancelled) return
        sessionStorage.setItem(TOKEN_KEY, currentToken)
        tokenRef.current = currentToken
        setToken(currentToken)
        const profile = await getProfile(currentToken)
        if (!cancelled) setUser(profile)
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY)
          tokenRef.current = null
          setToken(null)
          setUser(null)
        }
      }
    }
    void restoreSession()
    return () => { cancelled = true }
  }, [])

  async function authenticate(username: string, password: string, mode: 'login' | 'register') {
    setBusy(true)
    setAuthError('')
    try {
      const result = mode === 'login'
        ? await login(username, password)
        : await register(username, password)
      sessionStorage.setItem(TOKEN_KEY, result.access)
      setMessages([])
      setToken(result.access)
      setUser(result.user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    const currentToken = tokenRef.current
    closeSocket()
    try {
      if (currentToken) await logout(currentToken)
    } catch (error) {
      // Локальный выход выполняется даже если серверный logout завершился ошибкой.
      console.warn('Logout request failed:', error)
    } finally {
      sessionStorage.removeItem(TOKEN_KEY)
      tokenRef.current = null
      setToken(null)
      setUser(null)
      setMessages([])
      setAuthError('')
      setChatError('')
    }
  }

  function handleSend(text: string) {
    try {
      if (socketRef.current) sendChatMessage(socketRef.current, text)
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Не удалось отправить сообщение')
    }
  }

  if (!user) {
    return <AuthScreen onAuthenticate={authenticate} busy={busy} error={authError} />
  }

  return (
    <ChatScreen
      user={user}
      messages={messages}
      status={status}
      error={chatError}
      onSend={handleSend}
      onLogout={handleLogout}
    />
  )
}
