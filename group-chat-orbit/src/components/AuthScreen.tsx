import { useState, type FormEvent } from 'react'

interface Props {
  onAuthenticate: (username: string, password: string, mode: 'login' | 'register') => Promise<void>
  busy: boolean
  error: string
}

export function AuthScreen({ onAuthenticate, busy, error }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onAuthenticate(username.trim(), password, mode)
  }

  return (
    <main className="entry-page">
      <section className="entry-intro">
        <div className="orbit-brand"><span className="orbit-symbol">◎</span> ORBIT <small>MESSENGER</small></div>
        <div className="intro-copy">
          <div className="intro-kicker"><span /> ПРОСТРАНСТВО ДЛЯ ОБЩЕНИЯ</div>
          <h1>Разговоры,<br /><i>которые</i> объединяют.</h1>
          <p>Один общий канал для команды, идей и быстрых сообщений. Подключайся и оставайся на связи.</p>
          <div className="intro-stats">
            <div><strong>01</strong><span>Общий канал</span></div>
            <div><strong>24/7</strong><span>Онлайн-общение</span></div>
            <div><strong>JWT</strong><span>Защищённый вход</span></div>
          </div>
        </div>
        <div className="intro-decoration"><div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" /><div className="orbit-core">◎</div></div>
        <div className="intro-footer">ORBIT / GROUP SPACE <span>СОЗДАНО ДЛЯ ДИАЛОГА</span></div>
      </section>

      <section className="entry-form-side">
        <div className="entry-form-wrap">
          <div className="mobile-brand">◎ ORBIT</div>
          <div className="form-overline">{mode === 'login' ? 'РАДЫ ТЕБЯ ВИДЕТЬ' : 'НОВЫЙ УЧАСТНИК'}</div>
          <h2>{mode === 'login' ? 'Войти в пространство' : 'Создать профиль'}</h2>
          <p className="entry-description">{mode === 'login' ? 'Введи данные аккаунта, чтобы продолжить.' : 'Заполни данные, чтобы присоединиться к общему чату.'}</p>

          <div className="entry-switch">
            <button type="button" className={mode === 'login' ? 'chosen' : ''} onClick={() => setMode('login')}>Вход</button>
            <button type="button" className={mode === 'register' ? 'chosen' : ''} onClick={() => setMode('register')}>Регистрация</button>
          </div>

          <form onSubmit={submit} className="entry-fields">
            <label>ИМЯ ПОЛЬЗОВАТЕЛЯ
              <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder="Введите логин" required />
            </label>
            <label>ПАРОЛЬ
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Введите пароль" required />
            </label>
            {error && <div className="entry-error" role="alert">{error}</div>}
            <button className="entry-submit" type="submit" disabled={busy}>
              {busy ? 'Выполняется…' : mode === 'login' ? 'Продолжить' : 'Зарегистрироваться'} <span>→</span>
            </button>
          </form>
          <div className="entry-security"><span>◇</span> СЕССИЯ ЗАЩИЩЕНА JWT-АВТОРИЗАЦИЕЙ</div>
        </div>
        <div className="entry-copyright">© ORBIT GROUP CHAT <span>TERMS · PRIVACY</span></div>
      </section>
    </main>
  )
}
