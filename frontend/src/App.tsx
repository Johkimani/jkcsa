import React from 'react'
import { AdminProvider, useAdmin } from './context/AdminContext'
import Admin from './pages/Admin'
import Official from './pages/Official'

function AppContent(){
  const { isAdmin, logout } = useAdmin()

  const [route, setRoute] = React.useState<string>(window.location.pathname || '/admin')



  React.useEffect(()=>{
    const onPop = ()=> setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return ()=> window.removeEventListener('popstate', onPop)
  },[])

  React.useEffect(()=>{
    // Update page title based on route
    if (displayRoute.startsWith('/admin')) {
      document.title = 'Admin Panel'
    } else {
      document.title = 'Official Page'
    }
  },[route])

  const navigate = (path: string)=>{
    window.history.pushState({}, '', path)
    setRoute(path)
  }



  // Default to admin page, unless explicitly on official page
  const displayRoute = route.startsWith('/official') ? '/official' : '/admin'

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          {displayRoute.startsWith('/admin') && (
            <h1 className="text-lg sm:text-xl font-semibold truncate">Officials Management</h1>
          )}
          <nav className="flex items-center gap-1 sm:gap-2 ml-auto">
            {displayRoute.startsWith('/admin') && (
              <button onClick={()=>navigate('/official')} className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded transition hover:bg-gray-100">Official Page</button>
            )}
            {isAdmin && (
              <button onClick={()=>navigate('/admin')} className={`px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded transition ${displayRoute.startsWith('/admin')? 'bg-green-600 text-white':'hover:bg-gray-100'}`}>Admin Panel</button>
            )}
            {isAdmin && (
              <button onClick={logout} className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm rounded transition hover:bg-gray-100 text-red-600">Logout</button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 pb-safe">
        {displayRoute.startsWith('/admin') ? <Admin /> : <Official />}
      </main>
    </div>
  )
}



export default function App(){
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  )
}
