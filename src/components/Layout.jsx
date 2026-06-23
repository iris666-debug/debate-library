import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">辩题库</Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavItem to="/">Motions</NavItem>
            <NavItem to="/modules">Frameworks</NavItem>
            <NavItem to="/vocab">Vocabulary</NavItem>
            <NavItem to="/clash">Clash</NavItem>
            <NavItem to="/motion-type-notes">Strategy Notes</NavItem>
            <NavItem to="/coach">AI Coach</NavItem>
            <NavItem to="/drill">Shadowing</NavItem>
            <NavItem to="/poi">POI</NavItem>
            <NavItem to="/data">Data</NavItem>
            <a
              href="https://notebooklm.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition flex items-center gap-1"
              title="将视频/文章导入NotebookLM做结构化笔记"
            >
              素材 ↗
            </a>
          </nav>
          <button
            onClick={logout}
            className="text-xs text-stone-500 hover:text-stone-900"
            title={user?.email || ''}
          >
            退出
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md transition ${
          isActive
            ? 'bg-stone-900 text-white'
            : 'text-stone-600 hover:bg-stone-100'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
