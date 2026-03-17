import { useEffect, useMemo, useState } from "react"
import { AuthContext, type AuthContextValue } from "./AuthContext"
import type { AuthState, AuthUser } from "./types"
import {
  login as loginRequest,
  register as registerRequest,
  me as meRequest,
  type LoginRequest,
  type RegisterRequest,
} from "../api/auth"
import { clearToken, getToken, setToken } from "./storage"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken()

      if (!token) {
        setState({ status: "guest" })
        return
      }

      try {
        const user = await meRequest()
        setState({ status: "authenticated", token, user })
      } catch {
        clearToken()
        setState({ status: "guest" })
      }
    }

    void bootstrap()
  }, [])

  const login = async (req: LoginRequest) => {
    const res = await loginRequest(req)
    setToken(res.token)
    setState({
      status: "authenticated",
      token: res.token,
      user: res.user,
    })
  }

  const register = async (req: RegisterRequest) => {
    const res = await registerRequest(req)
    setToken(res.token)
    setState({
      status: "authenticated",
      token: res.token,
      user: res.user,
    })
  }

  const logout = () => {
    clearToken()
    setState({ status: "guest" })
  }

  const value: AuthContextValue = useMemo(() => {
    const isAuthenticated = state.status === "authenticated"
    const user: AuthUser | null = isAuthenticated ? state.user : null
    const token: string | null = isAuthenticated ? state.token : null

    return {
      state,
      isAuthenticated,
      user,
      token,
      login,
      register,
      logout,
    }
  }, [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}