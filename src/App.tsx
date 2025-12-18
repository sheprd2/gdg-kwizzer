import './App.css'
import { useNavigate } from 'react-router'

function App() {
  const navigate = useNavigate();

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: '#18181b',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '2rem', letterSpacing: '2px' }}>
          Kwizzer
        </h1>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button style={{
            background: '#27272a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }} onClick={() => navigate("quiz")}>
            Join Game
          </button>
          <button style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }} onClick={() => navigate("admin/quiz")}>
            Create Game
          </button>
        </div>
      </div>
    </>
  )
}

export default App
