import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { UserType } from "../lib/types";

export default function ProtectedRoute({
  children,
  allowedTypes,
}: {
  children: React.ReactNode;
  allowedTypes?: UserType[];
}) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (profile && allowedTypes && !allowedTypes.includes(profile.user_type)) {
      const dash =
        profile.user_type === "admin"
          ? "/admin"
          : profile.user_type === "company"
          ? "/empresa"
          : "/candidato";
      navigate(dash);
    }
  }, [user, profile, loading, navigate, allowedTypes]);

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
}
