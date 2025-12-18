import { Routes, Route, Navigate } from 'react-router'
import Dashboard from '../pages/admin/dashboard'
import App from '../App'
import CreateQuiz from '../pages/admin/quiz/CreateQuiz'

export default function AppRoutes() {
	// const { user, loading } = useAuth()

	// if (loading) return <div className="center">Loading…</div>

	return (
		<Routes>
			<Route index element={<App />} />
			<Route path="admin">
				<Route index element={<Navigate to="dashboard" />} />
				<Route path="dashboard" element={<Dashboard />} />
				<Route path='quiz'>
					<Route index element={<CreateQuiz/>} />

				</Route>
			</Route>
			<Route path="quiz">
				<Route index element={<Navigate to="list" />} />
			</Route>
			
			{/* <Route path="/scan" element={user ? <Scan /> : <Navigate to="/" />} />
			<Route path="/rate/:id" element={user ? <Rate /> : <Navigate to="/" />} />
			<Route path="*" element={<Navigate to="/" />} /> */}
		</Routes>
	)
}
