import { useState, useEffect } from 'react';
import {
  Save,
  Globe,
  Search,
  Layout,
  Star,
  MessageSquare,
  Phone,
  Settings,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { landingPageApi, LandingPageSettings, LandingPageFeature, LandingPageTestimonial } from '../../lib/api/landingPage';

type TabType = 'general' | 'seo' | 'hero' | 'features' | 'testimonials' | 'contact' | 'footer';

interface FeatureFormData {
  title: string;
  description: string;
  icon: string;
}

interface TestimonialFormData {
  author_name: string;
  author_title: string;
  author_company: string;
  author_avatar_url: string;
  quote: string;
  rating: number;
}

export function LandingPageConfig() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LandingPageSettings | null>(null);
  const [features, setFeatures] = useState<LandingPageFeature[]>([]);
  const [testimonials, setTestimonials] = useState<LandingPageTestimonial[]>([]);
  const [editingFeature, setEditingFeature] = useState<LandingPageFeature | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<LandingPageTestimonial | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [featureForm, setFeatureForm] = useState<FeatureFormData>({
    title: '',
    description: '',
    icon: '',
  });
  const [testimonialForm, setTestimonialForm] = useState<TestimonialFormData>({
    author_name: '',
    author_title: '',
    author_company: '',
    author_avatar_url: '',
    quote: '',
    rating: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, featuresData, testimonialsData] = await Promise.all([
        landingPageApi.getSettings(),
        landingPageApi.getFeatures(),
        landingPageApi.getTestimonials(),
      ]);
      setSettings(settingsData);
      setFeatures(featuresData);
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await landingPageApi.updateSettings(settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = () => {
    setEditingFeature(null);
    setFeatureForm({ title: '', description: '', icon: '' });
    setShowFeatureModal(true);
  };

  const handleEditFeature = (feature: LandingPageFeature) => {
    setEditingFeature(feature);
    setFeatureForm({
      title: feature.title,
      description: feature.description || '',
      icon: feature.icon || '',
    });
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async () => {
    try {
      if (editingFeature) {
        const updated = await landingPageApi.updateFeature(editingFeature.id, featureForm);
        setFeatures(features.map(f => f.id === updated.id ? updated : f));
      } else {
        const newFeature = await landingPageApi.createFeature({
          ...featureForm,
          image_url: null,
          is_enabled: true,
          display_order: features.length,
          link_url: null,
          link_text: null,
        });
        setFeatures([...features, newFeature]);
      }
      setShowFeatureModal(false);
    } catch (error) {
      console.error('Error saving feature:', error);
      alert('Error saving feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      await landingPageApi.deleteFeature(id);
      setFeatures(features.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting feature:', error);
      alert('Error deleting feature');
    }
  };

  const handleMoveFeature = async (index: number, direction: 'up' | 'down') => {
    const newFeatures = [...features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFeatures.length) return;
    [newFeatures[index], newFeatures[targetIndex]] = [newFeatures[targetIndex], newFeatures[index]];
    setFeatures(newFeatures);
  };

  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      author_name: '',
      author_title: '',
      author_company: '',
      author_avatar_url: '',
      quote: '',
      rating: 5,
    });
    setShowTestimonialModal(true);
  };

  const handleEditTestimonial = (testimonial: LandingPageTestimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialForm({
      author_name: testimonial.author_name,
      author_title: testimonial.author_title || '',
      author_company: testimonial.author_company || '',
      author_avatar_url: testimonial.author_avatar_url || '',
      quote: testimonial.quote,
      rating: testimonial.rating,
    });
    setShowTestimonialModal(true);
  };

  const handleSaveTestimonial = async () => {
    try {
      if (editingTestimonial) {
        const updated = await landingPageApi.updateTestimonial(editingTestimonial.id, testimonialForm);
        setTestimonials(testimonials.map(t => t.id === updated.id ? updated : t));
      } else {
        const newTestimonial = await landingPageApi.createTestimonial({
          ...testimonialForm,
          is_enabled: true,
          display_order: testimonials.length,
        });
        setTestimonials([...testimonials, newTestimonial]);
      }
      setShowTestimonialModal(false);
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert('Error saving testimonial');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await landingPageApi.deleteTestimonial(id);
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Error deleting testimonial');
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'hero', label: 'Hero Section', icon: Layout },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'footer', label: 'Footer', icon: Globe },
  ];

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Page Configuration</h1>
        <p className="text-white/60">Configure your public landing page settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
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
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">General Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_enabled}
                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Enable Landing Page</p>
                    <p className="text-sm text-white/50">Make the landing page publicly accessible</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_coming_soon}
                    onChange={(e) => setSettings({ ...settings, is_coming_soon: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Coming Soon Mode</p>
                    <p className="text-sm text-white/50">Display a coming soon message instead of the full page</p>
                  </div>
                </label>

                {settings.is_coming_soon && (
                  <div className="ml-8 space-y-4">
                    <div>
                      <label className="label">Coming Soon Message</label>
                      <textarea
                        value={settings.coming_soon_message}
                        onChange={(e) => setSettings({ ...settings, coming_soon_message: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="We're working on something amazing..."
                      />
                    </div>
                    <div>
                      <label className="label">Expected Launch Date</label>
                      <input
                        type="date"
                        value={settings.coming_soon_date || ''}
                        onChange={(e) => setSettings({ ...settings, coming_soon_date: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Meta Title</label>
                  <input
                    type="text"
                    value={settings.meta_title}
                    onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })}
                    className="input"
                    placeholder="Your Platform Name - Tagline"
                  />
                  <p className="text-sm text-white/40 mt-1">Recommended: 50-60 characters</p>
                </div>

                <div>
                  <label className="label">Meta Description</label>
                  <textarea
                    value={settings.meta_description}
                    onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Describe your platform in a compelling way..."
                  />
                  <p className="text-sm text-white/40 mt-1">Recommended: 150-160 characters</p>
                </div>

                <div>
                  <label className="label">Meta Keywords</label>
                  <input
                    type="text"
                    value={settings.meta_keywords}
                    onChange={(e) => setSettings({ ...settings, meta_keywords: e.target.value })}
                    className="input"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-sm text-white/40 mt-1">Comma-separated keywords</p>
                </div>

                <div>
                  <label className="label">Open Graph Image URL</label>
                  <input
                    type="url"
                    value={settings.og_image_url || ''}
                    onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                    className="input"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <p className="text-sm text-white/40 mt-1">Recommended size: 1200x630px</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Hero Section</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hero_enabled}
                    onChange={(e) => setSettings({ ...settings, hero_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Enable Hero Section</p>
                    <p className="text-sm text-white/50">Display the hero section on the landing page</p>
                  </div>
                </label>

                {settings.hero_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Hero Title</label>
                      <input
                        type="text"
                        value={settings.hero_title}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        className="input"
                        placeholder="Transform Your Business"
                      />
                    </div>

                    <div>
                      <label className="label">Hero Subtitle</label>
                      <input
                        type="text"
                        value={settings.hero_subtitle}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        className="input"
                        placeholder="The leading platform for..."
                      />
                    </div>

                    <div>
                      <label className="label">Hero Description</label>
                      <textarea
                        value={settings.hero_description}
                        onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="More detailed description about your platform..."
                      />
                    </div>

                    <div>
                      <label className="label">Hero Image URL</label>
                      <input
                        type="url"
                        value={settings.hero_image_url || ''}
                        onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                        className="input"
                        placeholder="https://example.com/hero.jpg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Primary CTA Text</label>
                        <input
                          type="text"
                          value={settings.hero_primary_cta_text}
                          onChange={(e) => setSettings({ ...settings, hero_primary_cta_text: e.target.value })}
                          className="input"
                          placeholder="Get Started"
                        />
                      </div>
                      <div>
                        <label className="label">Primary CTA URL</label>
                        <input
                          type="text"
                          value={settings.hero_primary_cta_url}
                          onChange={(e) => setSettings({ ...settings, hero_primary_cta_url: e.target.value })}
                          className="input"
                          placeholder="/register"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Secondary CTA Text</label>
                        <input
                          type="text"
                          value={settings.hero_secondary_cta_text}
                          onChange={(e) => setSettings({ ...settings, hero_secondary_cta_text: e.target.value })}
                          className="input"
                          placeholder="Learn More"
                        />
                      </div>
                      <div>
                        <label className="label">Secondary CTA URL</label>
                        <input
                          type="text"
                          value={settings.hero_secondary_cta_url}
                          onChange={(e) => setSettings({ ...settings, hero_secondary_cta_url: e.target.value })}
                          className="input"
                          placeholder="/about"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Features Section</h2>
                <button onClick={handleAddFeature} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.features_enabled}
                    onChange={(e) => setSettings({ ...settings, features_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Enable Features Section</p>
                    <p className="text-sm text-white/50">Display the features section on the landing page</p>
                  </div>
                </label>

                {settings.features_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Section Title</label>
                      <input
                        type="text"
                        value={settings.features_title}
                        onChange={(e) => setSettings({ ...settings, features_title: e.target.value })}
                        className="input"
                        placeholder="Our Features"
                      />
                    </div>
                    <div>
                      <label className="label">Section Subtitle</label>
                      <input
                        type="text"
                        value={settings.features_subtitle}
                        onChange={(e) => setSettings({ ...settings, features_subtitle: e.target.value })}
                        className="input"
                        placeholder="Everything you need to succeed"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={feature.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveFeature(index, 'up')}
                        disabled={index === 0}
                        className="text-white/40 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveFeature(index, 'down')}
                        disabled={index === features.length - 1}
                        className="text-white/40 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <GripVertical className="w-5 h-5 text-white/40" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {feature.icon && <span className="text-blue-400">{feature.icon}</span>}
                        <h3 className="font-medium">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-white/60">{feature.description}</p>
                    </div>
                    <button
                      onClick={() => handleEditFeature(feature)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    No features added yet. Click "Add Feature" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Testimonials Section</h2>
                <button onClick={handleAddTestimonial} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Testimonial
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.testimonials_enabled}
                    onChange={(e) => setSettings({ ...settings, testimonials_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Enable Testimonials Section</p>
                    <p className="text-sm text-white/50">Display testimonials on the landing page</p>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {testimonial.author_avatar_url && (
                          <img src={testimonial.author_avatar_url} alt={testimonial.author_name} className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <h3 className="font-medium">{testimonial.author_name}</h3>
                          <p className="text-sm text-white/60">
                            {testimonial.author_title} {testimonial.author_company && `at ${testimonial.author_company}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <button
                          onClick={() => handleEditTestimonial(testimonial)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/70 italic">"{testimonial.quote}"</p>
                  </div>
                ))}
                {testimonials.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    No testimonials added yet. Click "Add Testimonial" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Contact Section</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.contact_enabled}
                    onChange={(e) => setSettings({ ...settings, contact_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5"
                  />
                  <div>
                    <p className="font-medium">Enable Contact Section</p>
                    <p className="text-sm text-white/50">Display contact information on the landing page</p>
                  </div>
                </label>

                {settings.contact_enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contact_email}
                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                        className="input"
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div>
                      <label className="label">Contact Phone</label>
                      <input
                        type="tel"
                        value={settings.contact_phone || ''}
                        onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                        className="input"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div>
                      <label className="label">Contact Address</label>
                      <textarea
                        value={settings.contact_address || ''}
                        onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                        className="input"
                        rows={3}
                        placeholder="123 Main St, City, Country"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Footer Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Copyright Text</label>
                  <input
                    type="text"
                    value={settings.footer_copyright}
                    onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                    className="input"
                    placeholder="© 2025 Your Company. All rights reserved."
                  />
                </div>

                <div>
                  <label className="label">Social Links</label>
                  <div className="space-y-3">
                    {Object.entries(settings.social_links || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={key}
                          className="input flex-shrink-0 w-32"
                          disabled
                        />
                        <input
                          type="url"
                          value={value}
                          onChange={(e) => setSettings({
                            ...settings,
                            social_links: { ...settings.social_links, [key]: e.target.value }
                          })}
                          className="input flex-1"
                          placeholder="https://..."
                        />
                        <button
                          onClick={() => {
                            const newLinks = { ...settings.social_links };
                            delete newLinks[key];
                            setSettings({ ...settings, social_links: newLinks });
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const platform = prompt('Enter social platform name (e.g., twitter, facebook, linkedin):');
                        if (platform) {
                          setSettings({
                            ...settings,
                            social_links: { ...settings.social_links, [platform]: '' }
                          });
                        }
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Social Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Footer Links</label>
                  <div className="space-y-3">
                    {settings.footer_links.map((link, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const newLinks = [...settings.footer_links];
                            newLinks[index] = { ...link, label: e.target.value };
                            setSettings({ ...settings, footer_links: newLinks });
                          }}
                          className="input flex-1"
                          placeholder="Link Label"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...settings.footer_links];
                            newLinks[index] = { ...link, url: e.target.value };
                            setSettings({ ...settings, footer_links: newLinks });
                          }}
                          className="input flex-1"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => {
                            const newLinks = settings.footer_links.filter((_, i) => i !== index);
                            setSettings({ ...settings, footer_links: newLinks });
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setSettings({
                          ...settings,
                          footer_links: [...settings.footer_links, { label: '', url: '' }]
                        });
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Footer Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button onClick={handleSaveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {showFeatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingFeature ? 'Edit Feature' : 'Add Feature'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                  className="input"
                  placeholder="Feature title"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Feature description"
                />
              </div>
              <div>
                <label className="label">Icon (emoji or text)</label>
                <input
                  type="text"
                  value={featureForm.icon}
                  onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })}
                  className="input"
                  placeholder="🚀"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveFeature} className="btn-primary flex-1">
                Save
              </button>
              <button onClick={() => setShowFeatureModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Author Name</label>
                <input
                  type="text"
                  value={testimonialForm.author_name}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, author_name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Author Title</label>
                  <input
                    type="text"
                    value={testimonialForm.author_title}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, author_title: e.target.value })}
                    className="input"
                    placeholder="CEO"
                  />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input
                    type="text"
                    value={testimonialForm.author_company}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, author_company: e.target.value })}
                    className="input"
                    placeholder="Acme Inc"
                  />
                </div>
              </div>
              <div>
                <label className="label">Avatar URL</label>
                <input
                  type="url"
                  value={testimonialForm.author_avatar_url}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, author_avatar_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div>
                <label className="label">Quote</label>
                <textarea
                  value={testimonialForm.quote}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="This platform has transformed our business..."
                />
              </div>
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setTestimonialForm({ ...testimonialForm, rating })}
                      className={`p-2 rounded-lg ${testimonialForm.rating >= rating ? 'text-yellow-400' : 'text-white/20'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveTestimonial} className="btn-primary flex-1">
                Save
              </button>
              <button onClick={() => setShowTestimonialModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
