import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.state.status === "loading") {
    return <div>Загрузка...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}