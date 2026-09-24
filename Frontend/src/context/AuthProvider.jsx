import { useState } from 'react'
import { AuthContext } from './AuthContext'

const validRoles = ['admin', 'faculty', 'student']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('attendance_user') || 'null')
      return saved && validRoles.includes(saved.role) ? saved : null
    } catch {
      return null
    }
  })

  const saveSession = (token, nextUser) => {
    if (!nextUser || !validRoles.includes(nextUser.role)) {
      throw new Error('Invalid user role')
    }

    localStorage.setItem('attendance_token', token)
    localStorage.setItem('attendance_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem('attendance_token')
    localStorage.removeItem('attendance_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, saveSession, logout }}>{children}</AuthContext.Provider>
}