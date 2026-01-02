import { useState, useEffect } from 'react';
import { Palette, Image, Type, Code, Save, Upload } from 'lucide-react';
import { superAdminApi, PlatformBranding } from '../../lib/api/superAdmin';

export function PlatformBrandingPage() {
  const [activeTab, setActiveTab] = useState<'logos' | 'colors' | 'fonts' | 'custom'>('logos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<PlatformBranding | null>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const data = await superAdminApi.getPlatformBranding();
      setBranding(data);
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!branding) return;

    setSaving(true);
    try {
      await superAdminApi.updatePlatformBranding(branding);
      alert('Branding settings saved successfully');
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = (updates: Partial<PlatformBranding>) => {
    if (branding) {
      setBranding({ ...branding, ...updates });
    }
  };

  const handleFileUpload = async (field: 'logo_url' | 'logo_dark_url' | 'favicon_url') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const { url } = await superAdminApi.uploadBrandingAsset(file);
          updateBranding({ [field]: url });
        } catch (error) {
          console.error('Upload failed', error);
          alert('فشل رفع الصورة');
        }
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'logos', label: 'Logos & Icons', icon: Image },
    { id: 'colors', label: 'Color Scheme', icon: Palette },
    { id: 'fonts', label: 'Typography', icon: Type },
    { id: 'custom', label: 'Custom CSS', icon: Code },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading branding settings...</div>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Failed to load branding settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Branding</h1>
        <p className="text-white/60">Customize the look and feel of your platform</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'logos' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">Logos & Icons</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Light Mode Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-24 bg-white/10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                      {branding.logo_url ? (
                        <img src={branding.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Image className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                    <button
                      onClick={() => handleFileUpload('logo_url')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-2">Recommended size: 200x60px, PNG or SVG format</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Dark Mode Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-24 bg-gray-900 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                      {branding.logo_dark_url ? (
                        <img src={branding.logo_dark_url} alt="Dark Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Image className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                    <button
                      onClick={() => handleFileUpload('logo_dark_url')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-2">Recommended size: 200x60px, PNG or SVG format</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Favicon
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                      {branding.favicon_url ? (
                        <img src={branding.favicon_url} alt="Favicon" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Image className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <button
                      onClick={() => handleFileUpload('favicon_url')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Favicon</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-2">Recommended size: 32x32px or 64x64px, ICO or PNG format</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">Color Scheme</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => updateBranding({ primary_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.primary_color}
                      onChange={(e) => updateBranding({ primary_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Main brand color used for buttons and accents</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => updateBranding({ secondary_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => updateBranding({ secondary_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Supporting color for secondary actions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => updateBranding({ accent_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.accent_color}
                      onChange={(e) => updateBranding({ accent_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Highlight color for emphasis</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Danger Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.danger_color}
                      onChange={(e) => updateBranding({ danger_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.danger_color}
                      onChange={(e) => updateBranding({ danger_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Color for errors and destructive actions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Warning Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.warning_color}
                      onChange={(e) => updateBranding({ warning_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.warning_color}
                      onChange={(e) => updateBranding({ warning_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Color for warnings and caution messages</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Success Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.success_color}
                      onChange={(e) => updateBranding({ success_color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding.success_color}
                      onChange={(e) => updateBranding({ success_color: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Color for success messages and confirmations</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-lg">
                <h3 className="text-sm font-medium text-white/80 mb-4">Color Preview</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.primary_color, color: '#fff' }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.secondary_color, color: '#fff' }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.accent_color, color: '#fff' }}
                  >
                    Accent Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.danger_color, color: '#fff' }}
                  >
                    Danger
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.warning_color, color: '#fff' }}
                  >
                    Warning
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: branding.success_color, color: '#fff' }}
                  >
                    Success
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fonts' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">Typography</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Body Font Family
                  </label>
                  <select
                    value={branding.font_family}
                    onChange={(e) => updateBranding({ font_family: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Lato, sans-serif">Lato</option>
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="Source Sans Pro, sans-serif">Source Sans Pro</option>
                    <option value="system-ui, sans-serif">System Default</option>
                  </select>
                  <p className="text-xs text-white/50 mt-1">Font used for body text and paragraphs</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Heading Font Family
                  </label>
                  <select
                    value={branding.heading_font}
                    onChange={(e) => updateBranding({ heading_font: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Lato, sans-serif">Lato</option>
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="Playfair Display, serif">Playfair Display</option>
                    <option value="system-ui, sans-serif">System Default</option>
                  </select>
                  <p className="text-xs text-white/50 mt-1">Font used for headings and titles</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Border Radius
                  </label>
                  <select
                    value={branding.border_radius}
                    onChange={(e) => updateBranding({ border_radius: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0px">None (Sharp corners)</option>
                    <option value="4px">Small (4px)</option>
                    <option value="8px">Medium (8px)</option>
                    <option value="12px">Large (12px)</option>
                    <option value="16px">Extra Large (16px)</option>
                  </select>
                  <p className="text-xs text-white/50 mt-1">Roundness of corners for buttons and cards</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-sm font-medium text-white/80 mb-4">Typography Preview</h3>
                  <div className="space-y-3" style={{ fontFamily: branding.font_family }}>
                    <h1 className="text-3xl font-bold" style={{ fontFamily: branding.heading_font }}>
                      Heading 1
                    </h1>
                    <h2 className="text-2xl font-semibold" style={{ fontFamily: branding.heading_font }}>
                      Heading 2
                    </h2>
                    <h3 className="text-xl font-medium" style={{ fontFamily: branding.heading_font }}>
                      Heading 3
                    </h3>
                    <p className="text-base text-white/80">
                      This is a paragraph of body text. The quick brown fox jumps over the lazy dog.
                    </p>
                    <p className="text-sm text-white/60">
                      This is smaller text for captions and secondary information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">Custom CSS</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Custom CSS Code
                  </label>
                  <textarea
                    value={branding.custom_css || ''}
                    onChange={(e) => updateBranding({ custom_css: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm min-h-[400px]"
                    placeholder="/* Add your custom CSS here */&#10;&#10;.custom-class {&#10;  color: #3b82f6;&#10;  font-weight: bold;&#10;}"
                  />
                  <p className="text-xs text-white/50 mt-2">
                    Add custom CSS to override default styles. Use with caution as this may affect platform functionality.
                  </p>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-500 font-medium mb-1">Warning</p>
                  <p className="text-sm text-white/70">
                    Custom CSS is applied globally and may override platform styles. Test thoroughly before deploying to production.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
