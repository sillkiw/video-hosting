import { createContext } from "react"
import type { LoginRequest, RegisterRequest } from "../api/auth"
import type { AuthState, AuthUser } from "./types"

export type AuthContextValue = {
  state: AuthState
  isAuthenticated: boolean
  user: AuthUser | null
  token: string | null
  login: (req: LoginRequest) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)