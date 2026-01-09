import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AutoRedirectProps {
  to: string;
  delay?: number;
  replace?: boolean;
}

export function AutoRedirect({ to, delay = 3000, replace = true }: AutoRedirectProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(delay);

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate(to, { replace });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          navigate(to, { replace });
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, to, replace, timeLeft]);

  if (timeLeft <= 0) return null;

  return (
    <p className="text-white/40 text-sm mt-2">
      سيتم التوجيه تلقائياً خلال {Math.ceil(timeLeft / 1000)} ثانية...
    </p>
  );
}
