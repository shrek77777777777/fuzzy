import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Orbit Messenger render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f4ee', color: '#20231f', fontFamily: 'Arial, sans-serif' }}>
          <section style={{ maxWidth: 440, textAlign: 'center' }}>
            <h1>Не удалось отобразить чат</h1>
            <p>Произошла ошибка интерфейса. Обнови страницу. Если ошибка повторится, открой консоль браузера и отправь сообщение об ошибке разработчику.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', border: 0, borderRadius: 10, background: '#20231f', color: '#fff', cursor: 'pointer' }}>Обновить страницу</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
