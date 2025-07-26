'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  id: number
  name: string
  age: number
  address: string
  areaLevel: 'City' | 'District' | 'Village'
  healthStatus: 'Healthy' | 'Sick' | 'Critical'
  balance: string
  avatar?: string
}

export interface AdminUser {
  id: 0
  name: '管理员'
  role: 'admin'
}

interface UserContextType {
  currentUser: User | AdminUser | null
  isUserMode: boolean
  isAdminMode: boolean
  switchToUser: (user: User) => void
  switchToAdmin: () => void
  userBalance: string
  updateUserBalance: (newBalance: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | AdminUser | null>(null)
  const [isUserMode, setIsUserMode] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(true) // 默认管理员模式
  const [userBalance, setUserBalance] = useState('¥0')

  const switchToUser = (user: User) => {
    setCurrentUser(user)
    setIsUserMode(true)
    setIsAdminMode(false)
    setUserBalance(user.balance)
  }

  const switchToAdmin = () => {
    const adminUser: AdminUser = { id: 0, name: '管理员', role: 'admin' }
    setCurrentUser(adminUser)
    setIsUserMode(false)
    setIsAdminMode(true)
    setUserBalance('¥0')
  }

  const updateUserBalance = (newBalance: string) => {
    setUserBalance(newBalance)
    if (currentUser) {
      setCurrentUser({ ...currentUser, balance: newBalance })
    }
  }

  return (
    <UserContext.Provider value={{
      currentUser,
      isUserMode,
      isAdminMode,
      switchToUser,
      switchToAdmin,
      userBalance,
      updateUserBalance
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 