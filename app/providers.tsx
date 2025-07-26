'use client'

import React from 'react'
import { UserProvider } from './contexts/UserContext'
import { Web3Provider } from './contexts/Web3Context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <UserProvider>
        {children}
      </UserProvider>
    </Web3Provider>
  )
} 