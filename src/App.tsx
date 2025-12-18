import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import HomePage from './page'
import SignInPage from './auth/signin/page'
import SignUpPage from './auth/signup/page'
import AdminQuizzesPage from './admin/quizzes/page'
import AdminHostPage from './admin/host/page'
import PlayJoinPage from './play/join/page'
import PlayGamePage from './play/game/page'
import CreateQuizPage from './admin/quizzes/create/page'
import QuizDetailPage from './admin/quizzes/detail/page'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading-container">
        <div className="app-spinner"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <HomePage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/auth/signin" element={!user ? <SignInPage /> : <Navigate to="/" replace />} />
      <Route path="/auth/signup" element={!user ? <SignUpPage /> : <Navigate to="/" replace />} />
      <Route path="/admin/quizzes" element={user ? <AdminQuizzesPage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/admin/quizzes/create" element={user ? <CreateQuizPage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/admin/quizzes/:quizId" element={user ? <QuizDetailPage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/admin/host" element={user ? <AdminHostPage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/play/join" element={user ? <PlayJoinPage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="/play/game/:gameId" element={user ? <PlayGamePage /> : <Navigate to="/auth/signin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

