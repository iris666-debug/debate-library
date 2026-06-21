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
            <NavItem to="/">题卡</NavItem>
            <NavItem to="/modules">模块</NavItem>
            <NavItem to="/vocab">词汇</NavItem>
            <NavItem to="/drill">复述</NavItem>
            <NavItem to="/poi">POI</NavItem>
            <NavItem to="/coach">AI教练</NavItem>
            <NavItem to="/data">数据</NavItem>
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
