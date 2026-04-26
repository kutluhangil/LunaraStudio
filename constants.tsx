/**
 * Global Constants and Configuration Data
 * 
 * This file contains static data used throughout the Lyria Studio application,
 * including configuration options for the Prompt Builder (moods, genres, themes),
 * a list of example songs for the gallery, and a collection of SVG icons as React components.
 */
import React from 'react';
import { ExampleSong } from './types';

/**
 * Configuration for the Prompt Builder helper tool.
 * Provides predefined lists of musical attributes to help users construct prompts.
 */
export const PROMPT_HELPER_CONFIG = {
  moods: ['Epic', 'Groovy', 'Melancholic', 'Aggressive', 'Ethereal', 'Uplifting', 'Cinematic', 'Nostalgic', 'Energetic', 'Dreamy', 'Dark', 'Hopeful', 'Mysterious', 'Playful', 'Tense', 'Serene'],
  genders: ['Lo-fi', 'Rock', 'Disco', 'Robot', 'Metal', 'Choir', 'Rap', 'Jazz', 'Synthwave', 'Classical', 'Techno', 'Folk', 'R&B', 'Country', 'Ambient'],
  themes: ['Midnight City', 'Lost Love', 'Galaxy Exploration', 'Morning Coffee', 'Cyberpunk Future', 'Ocean Waves', 'Digital Dreams', 'Summer Sunset', 'Neon Rain', 'Deep Space', 'Ancient Ruins', 'Mountain Peak', 'Urban Jungle', 'Time Travel', 'Winter Solstice'],
  timestamps: ['0:10', '0:20', '0:30', '0:45', '1:00', '1:15', '1:30', '2:00'],
  bpms: ['80 BPM', '100 BPM', '120 BPM', '128 BPM', '140 BPM', '160 BPM', '172 BPM'],
  scales: ['C Major', 'A Minor', 'G Major', 'E Minor', 'D Minor', 'F Major', 'Blues Scale', 'Phrygian'],
  tooltips: {
    moods: {
      'Epic': 'Grand, sweeping, and larger-than-life.',
      'Groovy': 'Rhythmic and danceable with an infectious feel.',
      'Melancholic': 'Sorrowful, reflective, and emotionally deep.',
      'Aggressive': 'Intense, forceful, and hard-hitting.',
      'Ethereal': 'Delicate, airy, and seemingly otherworldly.',
      'Uplifting': 'Inspiring, positive, and soaring.',
      'Cinematic': 'Like a movie score; highly emotive and dramatic.',
      'Nostalgic': 'Evoking a sentimental longing for the past.',
      'Energetic': 'Fast-paced, lively, and full of vitality.',
      'Dreamy': 'Surreal, soothing, and atmospheric.',
      'Dark': 'Ominous, brooding, and mysterious.',
      'Hopeful': 'Bright, optimistic, and encouraging.',
      'Mysterious': 'Enigmatic, secretive, and intriguing.',
      'Playful': 'Lighthearted, fun, and bouncy.',
      'Tense': 'Nerve-wracking, suspenseful, and uneasy.',
      'Serene': 'Calm, peaceful, and untroubled.'
    },
    genders: {
      'Lo-fi': 'Low-fidelity, chill, and relaxed beats.',
      'Rock': 'Guitar-driven, energetic, and classic.',
      'Disco': '70s dance music with strong beats and basslines.',
      'Robot': 'Synthetic, vocoded, and mechanical sounds.',
      'Metal': 'Heavy, distorted, and intense rock.',
      'Choir': 'Vocal ensemble, often grandiose or reverent.',
      'Rap': 'Rhythmic speech over a beat.',
      'Jazz': 'Complex chords, swing feeling, and improvisation.',
      'Synthwave': '80s-inspired electronic soundscapes.',
      'Classical': 'Orchestral, formal, and traditional.',
      'Techno': 'Repetitive, synthesized, and club-oriented.',
      'Folk': 'Acoustic, storytelling, and traditional roots.',
      'R&B': 'Rhythm and Blues; soulful and vocal-driven.',
      'Country': 'Twangy, storytelling, often with acoustic guitars.',
      'Ambient': 'Atmospheric, background-oriented, and textural.'
    },
    themes: {
      'Midnight City': 'Urban, late-night driving vibes.',
      'Lost Love': 'Heartbreak, separation, and longing.',
      'Galaxy Exploration': 'Spacey, grand, and sci-fi oriented.',
      'Morning Coffee': 'Warm, cozy, and gentle awakening.',
      'Cyberpunk Future': 'Dystopian, high-tech, and gritty.',
      'Ocean Waves': 'Flowing, rhythmic, and natural.',
      'Digital Dreams': 'Surreal, electronic, and virtual.',
      'Summer Sunset': 'Warm, hazy, and relaxing.',
      'Neon Rain': 'Moody, colorful, and damp urban feel.',
      'Deep Space': 'Vast, empty, and mysterious.',
      'Ancient Ruins': 'Historical, grand, and slightly tragic.',
      'Mountain Peak': 'Triumphant, clear, and elevated.',
      'Urban Jungle': 'Busy, chaotic, and rhythmic.',
      'Time Travel': 'Disorienting, blending old and new.',
      'Winter Solstice': 'Cold, crisp, and stark.'
    },
    timestamps: {
      '0:10': 'Very early transition (10 secs).',
      '0:20': 'Early transition (20 secs).',
      '0:30': 'Standard chorus drop (30 secs).',
      '0:45': 'Late chorus drop (45 secs).',
      '1:00': 'Mid-song change (1 min).',
      '1:15': 'Bridge or interlude (1m 15s).',
      '1:30': 'Late arrangement switch (1m 30s).',
      '2:00': 'Outro buildup (2 mins).'
    },
    bpms: {
      '80 BPM': 'Slow and steady, good for chillout.',
      '100 BPM': 'Mid-tempo, relaxed groove.',
      '120 BPM': 'Standard house/pop tempo.',
      '128 BPM': 'Energetic dance music tempo.',
      '140 BPM': 'Fast, dubstep or trap tempo.',
      '160 BPM': 'Very fast, drum & bass or footwork.',
      '172 BPM': 'Frenetic, up-tempo drum & bass.'
    },
    scales: {
      'C Major': 'Happy, bright, and standard.',
      'A Minor': 'Sad, serious, and standard minor.',
      'G Major': 'Warm, rustic, and slightly bright.',
      'E Minor': 'Restless, darker, good for rock.',
      'D Minor': 'Melancholy, solemn, and emotional.',
      'F Major': 'Calm, pastoral, and controlled.',
      'Blues Scale': 'Soulful, expressive, and edgy.',
      'Phrygian': 'Exotic, dark, and tense.'
    }
  }
};

export const EXAMPLE_SONGS: ExampleSong[] = [
  {
    id: '1',
    title: 'Neon Horizons',
    artist: 'Lyria Synth',
    coverUrl: 'https://picsum.photos/seed/music1/400/400',
    prompt: 'A high-energy synthwave track with driving basslines, shimmering 80s pads, and a cinematic build-up. Suggests a late-night drive through a futuristic cityscape.',
    duration: '3:45',
    tags: ['Electronic', 'Synthwave', 'Cinematic']
  },
  {
    id: '2',
    title: 'Midnight Jazz Lounge',
    artist: 'Echo Blue',
    coverUrl: 'https://picsum.photos/seed/music2/400/400',
    prompt: 'Soft acoustic jazz with a smooth saxophone lead, light brush drums, and a warm upright bass. Intimate atmosphere with a touch of melancholy.',
    duration: '2:30',
    tags: ['Jazz', 'Acoustic', 'Chill']
  },
  {
    id: '3',
    title: 'Digital Raindrops',
    artist: 'Pixel Pulse',
    coverUrl: 'https://picsum.photos/seed/music3/400/400',
    prompt: 'Experimental IDM featuring glitchy textures, rhythmic water drop samples, and ethereal vocal chops. Dynamic and evolving soundscape.',
    duration: '4:12',
    tags: ['IDM', 'Experimental', 'Ambient']
  },
  {
    id: '4',
    title: 'Desert Mirage',
    artist: 'Solar Winds',
    coverUrl: 'https://picsum.photos/seed/music4/400/400',
    prompt: 'A slow, atmospheric ambient track with sweeping pads, distant echoing guitar, and subtle wind sound effects. Evokes a feeling of vast, empty spaces.',
    duration: '5:05',
    tags: ['Ambient', 'Atmospheric', 'Chill']
  },
  {
    id: '5',
    title: 'Cybernetic Rebellion',
    artist: 'Null Pointer',
    coverUrl: 'https://picsum.photos/seed/music5/400/400',
    prompt: 'Aggressive industrial techno with distorted kick drums, metallic clangs, and a fast, driving tempo. High energy and intense.',
    duration: '3:15',
    tags: ['Techno', 'Industrial', 'Aggressive']
  },
  {
    id: '6',
    title: 'Summer Breeze',
    artist: 'The Sunflowers',
    coverUrl: 'https://picsum.photos/seed/music6/400/400',
    prompt: 'An uplifting indie pop song with bright acoustic guitars, a catchy whistling melody, and a light, bouncy rhythm. Cheerful and carefree.',
    duration: '2:50',
    tags: ['Indie Pop', 'Uplifting', 'Acoustic']
  }
];

export const Icons = {
  Play: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Pause: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  Info: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Loading: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Download: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Video: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Camera: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  List: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
};