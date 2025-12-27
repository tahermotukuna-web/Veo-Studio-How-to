
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';

export enum AppState {
  AUTH,
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum ContentCategory {
  HOW_TO = 'How-To Guide',
  DRAMA_REVIEW = 'Drama Serial Review',
  PRICE_IN_BD = 'Price in Bangladesh',
}

export enum TutorialType {
  PRO_VIDEO = 'Pro Video',
  BASIC_SLIDESHOW = 'Basic Slideshow',
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  EXTEND_VIDEO = 'Extend Video',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface GenerateVideoParams {
  prompt: string;
  category: ContentCategory;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  tutorialType: TutorialType;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  inputVideoObject?: Video | null;
  isLooping?: boolean;
  isSmartTutorial?: boolean;
  isDeepDive?: boolean;
  hasVoiceover?: boolean;
  voiceName?: string;
}

export interface VideoGenerationResult {
  objectUrl?: string; 
  slideshowImages?: string[]; 
  thumbnailUrl?: string;
  blob?: Blob;
  uri?: string;
  video?: Video;
  audioUrl?: string;
  sources?: GroundingSource[];
  tutorialType: TutorialType;
  fullScript?: string;
  youtubeMetadata?: YouTubeMetadata;
}
