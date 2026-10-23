import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { dashboardFor } from "../lib/authRouting";
import type { UserType } from "../lib/types";

export default function ProtectedRoute({ children, allowedTypes }: {
  children: React.ReactNode;
  allowedTypes?: UserType[];
}) {
  const { user, profile, loading, profileError, refreshProfile, signOut } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex h-[60vh] items-center justify-center" role="status" aria-label="Carregando perfil"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  if (!profile || profile.id !== user.id || profileError) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center" role="alert">
      <h1 className="text-xl font-semibold">Não foi possível carregar seu perfil</h1>
      <p className="my-4">Tente novamente para acessar sua conta.</p>
      <div className="flex justify-center gap-3">
        <button className="btn-primary" onClick={() => void refreshProfile()}>Tentar novamente</button>
        <button className="btn-secondary" onClick={() => void signOut()}>Sair</button>
      </div>
    </div>
  );
  if (allowedTypes && !allowedTypes.includes(profile.user_type)) return <Navigate to={dashboardFor(profile.user_type)} replace />;
  return <>{children}</>;
}
