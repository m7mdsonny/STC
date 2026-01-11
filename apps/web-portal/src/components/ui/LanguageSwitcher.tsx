import { Globe } from 'lucide-react';
import { useLanguage, type Language } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
  showLabel?: boolean;
}

export function LanguageSwitcher({ variant = 'buttons', showLabel = true }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; nameEn: string }[] = [
    { code: 'ar', name: 'العربية', nameEn: 'Arabic' },
    { code: 'en', name: 'English', nameEn: 'English' },
  ];

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
        title={t('settings.language')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative group">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {showLabel && (
            <span className="text-sm">
              {languages.find(l => l.code === language)?.name}
            </span>
          )}
        </button>
        <div className="absolute top-full left-0 mt-2 bg-stc-navy border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full px-4 py-2 text-right hover:bg-white/10 transition-colors flex items-center justify-between gap-3 ${
                language === lang.code ? 'text-stc-gold' : 'text-white/70'
              }`}
            >
              <span>{lang.name}</span>
              {language === lang.code && (
                <div className="w-2 h-2 rounded-full bg-stc-gold" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            language === lang.code
              ? 'bg-stc-gold text-stc-navy'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {lang.code === 'ar' ? 'عربي' : 'EN'}
        </button>
      ))}
    </div>
  );
}
