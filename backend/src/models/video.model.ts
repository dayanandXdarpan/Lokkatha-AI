/**
 * Video Model - Extended metadata for published videos
 * Stores video information in Redis for Explore page
 */

export interface VideoMetadata {
  jobId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string; // Generated from topic
  topic: string;
  gradeLevel: string;
  language: string;
  dialect?: string;
  duration: number;
  fileSize?: number;
  quality: 'low' | 'medium' | 'high';
  
  // Publishing info
  isPublic: boolean;
  createdBy?: string; // Teacher ID/name
  createdAt: string;
  publishedAt?: string;
  
  // Analytics
  views: number;
  likes: number;
  shareCount: number;
  
  // Additional metadata
  description?: string;
  tags?: string[];
  subject?: string; // Math, Science, History, etc.
}

export interface VideoFilter {
  search?: string;
  gradeLevel?: string;
  language?: string;
  subject?: string;
  quality?: string;
}

export interface VideoSort {
  sortBy: 'newest' | 'popular' | 'views' | 'likes' | 'duration';
  order: 'asc' | 'desc';
}

export interface ExploreVideosResponse {
  videos: VideoMetadata[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ShareOptions {
  platform: 'link' | 'whatsapp' | 'email' | 'explore';
  videoId: string;
  shareUrl: string;
}
