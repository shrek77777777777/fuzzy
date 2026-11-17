import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ChatMessage, SocketStatus, User } from '../types'

interface Props {
  user: User
  messages: ChatMessage[]
  status: SocketStatus
  error: string
  onSend: (text: string) => void
  onLogout: () => void
}

const statusText: Record<SocketStatus, string> = {
  connecting: 'Подключаемся',
  authorizing: 'Авторизация',
  connected: 'Подключено',
  disconnected: 'Не в сети',
  error: 'Ошибка соединения',
}

function initials(name: string) {
  return typeof name === 'string' && name.length > 0 ? name.slice(0, 1).toUpperCase() : '?'
}
function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return '--:--'
  try {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
  } catch {
    return '--:--'
  }
}

export function ChatScreen({ user, messages, status, error, onSend, onLogout }: Props) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Не возвращаем результат DOM-метода из useEffect: эффект должен
    // возвращать только функцию очистки либо ничего.
    const element = bottomRef.current
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || status !== 'connected') return
    onSend(text)
    setDraft('')
  }

  const participants = [...new Set([user.username, ...messages.map(message => message.sender)])]

  return (
    <main className="orbit-app">
      <header className="topbar">
        <div className="orbit-brand dark"><span className="orbit-symbol">◎</span> ORBIT <small>MESSENGER</small></div>
        <div className="topbar-center"><span className="topbar-mark">⌂</span> Командное пространство <span className="topbar-slash">/</span> Общий канал</div>
        <div className="topbar-account"><div className="account-avatar">{initials(user.username)}</div><strong>{user.username}</strong><button onClick={onLogout} title="Выйти из аккаунта">Выйти ↗</button></div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <div className="rail-heading">РАБОЧАЯ ОБЛАСТЬ</div>
          <div className="workspace-card"><div className="workspace-icon">O</div><div><strong>Учебная группа</strong><small>Общее пространство</small></div><span>⌄</span></div>
          <div className="rail-heading channels-heading">КАНАЛЫ <span>＋</span></div>
          <div className="channel-link active"><span>#</span><strong>общий</strong><i /></div>
          <div className="rail-tip"><span>✳</span><strong>Небольшая подсказка</strong><p>Пиши коротко и по делу — все участники увидят сообщение в общей ленте.</p></div>
          <div className="rail-bottom"><div className="rail-status-dot" /> Подключение к серверу <small>{statusText[status]}</small></div>
        </aside>

        <section className="conversation">
          <div className="conversation-heading">
            <div><div className="channel-title"><span>#</span> общий</div><p>Открытый канал для всех участников группы</p></div>
            <div className={`online-indicator ${status}`}><span />{statusText[status]}</div>
          </div>

          <div className="conversation-body">
            <div className="welcome-panel"><div className="welcome-icon">✳</div><div><strong>Добро пожаловать в #общий</strong><p>Это начало вашей общей переписки. Можно начинать общение.</p></div><span className="welcome-date">ОБЩИЙ КАНАЛ</span></div>
            <div className="timeline-label"><span>СООБЩЕНИЯ</span><i /></div>
            {messages.length === 0 ? (
              <div className="no-messages"><div>↗</div><strong>Здесь пока тихо</strong><p>Отправь первое сообщение, чтобы начать разговор.</p></div>
            ) : (
              <div className="chat-feed">
                {messages.map(message => (
                  <article className={`feed-message ${message.own ? 'mine' : ''}`} key={message.id}>
                    <div className="feed-avatar">{initials(message.sender)}</div>
                    <div className="feed-body">
                      <div className="feed-meta"><strong>{message.sender}</strong>{message.own && <span className="self-tag">ВЫ</span>}<time>{formatTime(message.timestamp)}</time></div>
                      <div className="feed-text">{message.text}</div>
                    </div>
                  </article>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="composer-area">
            {error && <div className="chat-alert">{error}</div>}
            {status !== 'connected' && <div className="chat-alert neutral">Отправка станет доступна после подключения к чату.</div>}
            <form className="message-composer" onSubmit={submit}>
              <span className="composer-hash">＋</span>
              <input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Написать в #общий…" disabled={status !== 'connected'} aria-label="Текст сообщения" />
              <button type="submit" disabled={status !== 'connected' || !draft.trim()}>Отправить <span>↑</span></button>
            </form>
            <div className="composer-help">Enter — отправить <span>Сообщения доступны всем участникам канала</span></div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="right-title">О КАНАЛЕ</div>
          <div className="channel-info-icon">#</div>
          <h3>общий</h3>
          <p className="channel-info-copy">Главное место для вопросов, новостей и общения участников.</p>
          <div className="panel-divider" />
          <div className="members-heading">УЧАСТНИКИ <span>{participants.length}</span></div>
          <div className="member-list">
            {participants.map((name, index) => <div className="member-row" key={name}><div className={`member-avatar tone-${index % 4}`}>{initials(name)}</div><div><strong>{name}</strong><small>{name === user.username ? 'Это вы' : 'В чате'}</small></div><i /></div>)}
          </div>
          <div className="right-note"><span>⌁</span><strong>Общайтесь вместе</strong><p>Все авторизованные участники подключаются к одному каналу.</p></div>
        </aside>
      </div>
    </main>
  )
}
