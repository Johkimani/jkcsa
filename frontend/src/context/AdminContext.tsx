
import React, { createContext, useContext, useState, useEffect } from 'react'

interface AdminContextType {
  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') || ''
    if (isAdmin) {
      setIsAdmin(true)
    }
  }, [])

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value)
    if (value) {
      localStorage.setItem('isAdmin', 'true')
    } else {
      localStorage.removeItem('isAdmin')
    }
  }

  const logout = () => {
    setIsAdmin(false)
    localStorage.removeItem('isAdmin')
  }

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin: handleSetIsAdmin, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
