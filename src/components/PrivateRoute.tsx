import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        navigate("/login"); // Redirect to login on error
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (e.g., logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    // You can replace this with a proper loading spinner component
    return <p className="text-center p-4">Loading...</p>;
  }

  return children;
}
