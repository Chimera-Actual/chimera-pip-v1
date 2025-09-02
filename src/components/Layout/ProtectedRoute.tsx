import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BootSequence } from '@/components/Layout/BootSequence';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, showingBootSequence } = useAuth();
  const navigate = useNavigate();

  console.log('ProtectedRoute render:', { user: !!user, loading, showingBootSequence });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen crt-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-display crt-glow text-primary mb-4">
            INITIALIZING...
          </div>
          <div className="text-muted-foreground">
            Pip-Boy System Boot Sequence
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /auth
  }

  // Show boot sequence for new logins
  if (showingBootSequence) {
    return <BootSequence />;
  }

  return <>{children}</>;
}