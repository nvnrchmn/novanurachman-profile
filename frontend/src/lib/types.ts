export interface Profile {
  id: string;
  name: string;
  headline: string;
  tagline: string;
  bio: string;
  avatar: string;
  location: string;
  email: string;
  phone: string;
  resume_url: string;
  available: boolean;
  github_url: string;
  linkedin_url: string;
  x_url: string;
  website_url: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  cover_image: string;
  tech_stack: string;
  repo_url: string;
  live_url: string;
  year: string;
  featured: boolean;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  company_url: string;
  location: string;
  employment: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: string;
  icon: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Stats {
  projects: number;
  experiences: number;
  skills: number;
  contacts: number;
  contacts_unread: number;
}
