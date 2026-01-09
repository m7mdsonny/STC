import { apiClient } from '../apiClient';

export interface LandingPageSettings {
  id: string;
  is_enabled: boolean;
  is_coming_soon: boolean;
  coming_soon_message: string;
  coming_soon_date: string | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string | null;
  header_logo_url: string | null;
  header_show_login: boolean;
  header_show_register: boolean;
  header_cta_text: string;
  header_cta_url: string;
  hero_enabled: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_image_url: string | null;
  hero_video_url: string | null;
  hero_primary_cta_text: string;
  hero_primary_cta_url: string;
  hero_secondary_cta_text: string;
  hero_secondary_cta_url: string;
  features_enabled: boolean;
  features_title: string;
  features_subtitle: string;
  how_it_works_enabled: boolean;
  how_it_works_title: string;
  how_it_works_subtitle: string;
  testimonials_enabled: boolean;
  testimonials_title: string;
  testimonials_subtitle: string;
  pricing_enabled: boolean;
  pricing_title: string;
  pricing_subtitle: string;
  contact_enabled: boolean;
  contact_title: string;
  contact_subtitle: string;
  contact_email: string;
  contact_phone: string | null;
  contact_address: string | null;
  footer_copyright: string;
  footer_links: Array<{ label: string; url: string }>;
  social_links: Record<string, string>;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
}

export interface LandingPageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  is_enabled: boolean;
  display_order: number;
  background_color: string | null;
  background_image_url: string | null;
  custom_css: string | null;
  settings: Record<string, unknown>;
}

export interface LandingPageFeature {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_enabled: boolean;
  display_order: number;
  link_url: string | null;
  link_text: string | null;
}

export interface LandingPageTestimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  author_avatar_url: string | null;
  quote: string;
  rating: number;
  is_enabled: boolean;
  display_order: number;
}

export interface LandingPageImage {
  id: string;
  image_key: string;
  image_url: string;
  alt_text: string | null;
  caption: string | null;
  display_order: number;
}

export const landingPageApi = {
  getSettings: async (): Promise<LandingPageSettings> => {
    // Use the correct endpoint from SettingsController
    const response = await apiClient.get('/settings/landing');
    return response.data?.content || response.data || {};
  },

  updateSettings: async (data: Partial<LandingPageSettings>): Promise<LandingPageSettings> => {
    // Use the correct endpoint from SettingsController
    const response = await apiClient.put('/settings/landing', { content: data });
    return response.data?.content || response.data || {};
  },

  getSections: async (): Promise<LandingPageSection[]> => {
    const response = await apiClient.get('/api/v1/landing-page/sections');
    return response.data;
  },

  updateSection: async (id: string, data: Partial<LandingPageSection>): Promise<LandingPageSection> => {
    const response = await apiClient.put(`/api/v1/landing-page/sections/${id}`, data);
    return response.data;
  },

  reorderSections: async (order: string[]): Promise<void> => {
    await apiClient.post('/api/v1/landing-page/sections/reorder', { order });
  },

  getFeatures: async (): Promise<LandingPageFeature[]> => {
    const response = await apiClient.get('/api/v1/landing-page/features');
    return response.data;
  },

  createFeature: async (data: Omit<LandingPageFeature, 'id'>): Promise<LandingPageFeature> => {
    const response = await apiClient.post('/api/v1/landing-page/features', data);
    return response.data;
  },

  updateFeature: async (id: string, data: Partial<LandingPageFeature>): Promise<LandingPageFeature> => {
    const response = await apiClient.put(`/api/v1/landing-page/features/${id}`, data);
    return response.data;
  },

  deleteFeature: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/landing-page/features/${id}`);
  },

  getTestimonials: async (): Promise<LandingPageTestimonial[]> => {
    const response = await apiClient.get('/api/v1/landing-page/testimonials');
    return response.data;
  },

  createTestimonial: async (data: Omit<LandingPageTestimonial, 'id'>): Promise<LandingPageTestimonial> => {
    const response = await apiClient.post('/api/v1/landing-page/testimonials', data);
    return response.data;
  },

  updateTestimonial: async (id: string, data: Partial<LandingPageTestimonial>): Promise<LandingPageTestimonial> => {
    const response = await apiClient.put(`/api/v1/landing-page/testimonials/${id}`, data);
    return response.data;
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/landing-page/testimonials/${id}`);
  },

  getImages: async (): Promise<LandingPageImage[]> => {
    const response = await apiClient.get('/api/v1/landing-page/images');
    return response.data;
  },

  uploadImage: async (key: string, file: File): Promise<LandingPageImage> => {
    const formData = new FormData();
    formData.append('image_key', key);
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/landing-page/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/landing-page/images/${id}`);
  },
};
