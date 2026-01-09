import { createContext, useContext, useEffect, useState } from 'react';
import type { PlatformBranding } from '../lib/api/superAdmin';
import { brandingApi } from '../lib/api';

interface BrandingContextValue {
  branding: PlatformBranding | null;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: null,
  loading: true,
});

function applyBrandingTheme(branding: PlatformBranding | null) {
  if (!branding) return;
  const root = document.documentElement;
  const setVar = (key: string, value?: string | null, fallback?: string) => {
    if (value) {
      root.style.setProperty(key, value);
    } else if (fallback) {
      root.style.setProperty(key, fallback);
    }
  };

  setVar('--stc-gold', branding.primary_color, '#DCA000');
  setVar('--stc-gold-light', branding.accent_color || branding.primary_color, '#F5C518');
  setVar('--stc-navy', branding.secondary_color, '#141450');
  setVar('--stc-navy-light', branding.secondary_color, '#1E1E6E');
  setVar('--stc-bg-dark', branding.secondary_color, '#0A0A2E');
  setVar('--stc-success', branding.success_color, '#10B981');
  setVar('--stc-danger', branding.danger_color, '#EF4444');
  setVar('--stc-warning', branding.warning_color, '#F59E0B');

  if (branding.font_family) {
    document.body.style.fontFamily = branding.font_family;
  }

  const faviconUrl = branding.favicon_url;
  if (faviconUrl) {
    const link: HTMLLinkElement =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      Object.assign(document.createElement('link'), { rel: 'icon' });
    link.href = faviconUrl;
    document.head.appendChild(link);
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PlatformBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to stop loading even if API call fails
    timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000); // Max 5 seconds loading

    brandingApi
      .getPublicBranding()
      .then((data) => {
        if (mounted) {
          clearTimeout(timeoutId);
          setBranding(data);
          applyBrandingTheme(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.warn('Failed to load branding:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setBranding(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
