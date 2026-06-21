import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import LoginPage from './auth/LoginPage'
import Layout from './components/Layout'
import MotionListPage from './pages/MotionListPage'
import MotionDetailPage from './pages/MotionDetailPage'
import MotionEditPage from './pages/MotionEditPage'
import ModuleListPage from './pages/ModuleListPage'
import ModuleDetailPage from './pages/ModuleDetailPage'
import VocabListPage from './pages/VocabListPage'
import CoachPage from './pages/CoachPage'
import DrillPickerPage from './pages/DrillPickerPage'
import DrillSessionPage from './pages/DrillSessionPage'
import PoiPickerPage from './pages/PoiPickerPage'
import PoiSessionPage from './pages/PoiSessionPage'
import DataPage from './pages/DataPage'
import SetupNotice from './components/SetupNotice'

export default function App() {
  const { user, loading, isConfigured } = useAuth()

  if (!isConfigured) return <SetupNotice />
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
        加载中…
      </div>
    )
  }
  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MotionListPage />} />
        <Route path="/motions/new" element={<MotionEditPage />} />
        <Route path="/motions/:id" element={<MotionDetailPage />} />
        <Route path="/motions/:id/edit" element={<MotionEditPage />} />
        <Route path="/modules" element={<ModuleListPage />} />
        <Route path="/modules/:id" element={<ModuleDetailPage />} />
        <Route path="/vocab" element={<VocabListPage />} />
        <Route path="/drill" element={<DrillPickerPage />} />
        <Route path="/drill/:id" element={<DrillSessionPage />} />
        <Route path="/poi" element={<PoiPickerPage />} />
        <Route path="/poi/:id" element={<PoiSessionPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
