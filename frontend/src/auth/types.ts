export type AuthUser = {
  id: string
  email: string
  display_name: string
  role: string
}

export type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; token: string; user: AuthUser }