/**
 * Main Application Component for Lyria Studio
 * 
 * This component serves as the primary container for the Lyria Studio application.
 * It manages the global state for music generation, including user inputs (prompts,
 * duration, lyrics options, image uploads), the generation process, and the display
 * of generated results.
 * 
 * Key Features:
 * - Prompt building (manual or via the PromptBuilder helper)
 * - Image upload for visual prompting
 * - Integration with Google GenAI for audio generation
 * - Audio playback and video export functionality
 * - Display of generated lyrics and metadata (title, cover art)
 */
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Duration, LyricsOption, GenerationState, SongResult } from './types';
import { Icons, PROMPT_HELPER_CONFIG } from './constants';
import { CONFIG } from './src/config';
import { logFunctionCall } from './src/utils/logger';
import { createAudioUrlFromBase64 } from './src/utils/audioUtils';
import { cleanLyricsForDisplay } from './src/utils/lyricsUtils';
import { handleDownloadVideo } from './src/utils/videoUtils';
import { parseModelOutput, generateSongTitle, generateCoverArt } from './src/services/genaiService';
import { getRandomItem } from './src/utils/helpers';
import { motion } from 'motion/react';
import { PromptBuilder, HelperSection } from './src/components/PromptBuilder';
import { CommunityFeed } from './src/components/CommunityFeed';
import { ThreeDVisualizer } from './src/components/ThreeDVisualizer';
import { handleDownloadMidi } from './src/utils/midiUtils';
import { ThumbsUp, ThumbsDown, Music, Undo2, Redo2, Layers, Wand2, History, Moon, Sun, Search, Share, MessageCircle, Mic2, FolderPlus } from 'lucide-react';

const PLUGINS = [
  { id: 'vintage-synth', name: 'Vintage Synth' },
  { id: 'tube-amp', name: 'Tube Amp' },
  { id: '808-drums', name: '808 Drum Machine' },
  { id: 'lofi-vinyl', name: 'Lo-Fi Vinyl' },
  { id: 'tape-delay', name: 'Tape Delay' },
];

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'create' | 'community'>('create');
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [songComments, setSongComments] = useState<Record<string, {timeCode: string, text: string}[]>>({});
  const [newComment, setNewComment] = useState<{timeCode: string, text: string}>({timeCode: '0:00', text: ''});
  const [isRhymeOpen, setIsRhymeOpen] = useState(false);
  const [albums, setAlbums] = useState<{id: string, name: string, songs: string[]}[]>([{id: '1', name: 'My First EP', songs: []}]);
  const [showAlbumModal, setShowAlbumModal] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');

  const [prompt, setPrompt] = useState('');
  const [isPromptManual, setIsPromptManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [duration, setDuration] = useState<Duration>('Clip (30s)');
  const [lyricsOption, setLyricsOption] = useState<LyricsOption>('Auto');
  const [customLyrics, setCustomLyrics] = useState('');
  const [gen, setGen] = useState<GenerationState>({ results: [] });
  const [isResultPlaying, setIsResultPlaying] = useState<string | null>(null);
  const [encodingVideoId, setEncodingVideoId] = useState<string | null>(null);
  const [encodingProgress, setEncodingProgress] = useState(0);
  const [videoSettings, setVideoSettings] = useState<{type: 'bars'|'waveform'|'particles'|'circular'|'geometric', color: string, density: number, speed: number, animationStyle: 'pulsing'|'spinning'|'flowing'}>({ type: 'waveform', color: '#ff2d55', density: 1, speed: 1, animationStyle: 'flowing' });
  const [selectedImages, setSelectedImages] = useState<{data: string, mimeType: string, previewUrl: string}[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);

  const [pitchLevels, setPitchLevels] = useState<Record<string, number>>({});
  const [tempoLevels, setTempoLevels] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, 'like' | 'dislike' | null>>({});

  const [queue, setQueue] = useState<string[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [masteringStatus, setMasteringStatus] = useState<Record<string, 'processing' | 'done'>>({});
  
  const [history, setHistory] = useState<{prompt: string, helperSections: HelperSection[], isManual: boolean}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  const [isSuggestingPrompts, setIsSuggestingPrompts] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('lunara_saved_prompts');
    if (saved) {
      try { setSavedPrompts(JSON.parse(saved)); } catch(e) {}
    }
    const autosave = localStorage.getItem('lunara_autosave_prompt');
    if (autosave) {
      setPrompt(autosave);
      setIsPromptManual(true);
    }
    const storedFeedbacks = localStorage.getItem('lunara_feedbacks');
    if (storedFeedbacks) {
      try { setFeedbacks(JSON.parse(storedFeedbacks)); } catch(e) {}
    }
    const storedComments = localStorage.getItem('lunara_comments');
    if (storedComments) {
      try { setSongComments(JSON.parse(storedComments)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('lunara_autosave_prompt', prompt);
    }, 1000);
    return () => clearTimeout(timer);
  }, [prompt]);

  const saveCurrentPrompt = () => {
    if (!prompt.trim()) return;
    const newSaved = [...new Set([prompt, ...savedPrompts])].slice(0, 5); // Keep last 5
    setSavedPrompts(newSaved);
    localStorage.setItem('lunara_saved_prompts', JSON.stringify(newSaved));
  };
  
  const handleAddToQueue = (id: string) => {
    setQueue(prev => [...prev, id]);
  };

  const handleQueueSongEnded = (endedId: string) => {
    setIsResultPlaying(null);
    const index = queue.indexOf(endedId);
    if (index !== -1 && index + 1 < queue.length) {
      const nextId = queue[index + 1];
      const audio = document.getElementById(`audio-${nextId}`) as HTMLAudioElement;
      if (audio) audio.play();
    }
  };

  const handlePitchChange = (id: string, value: number) => {
    setPitchLevels(prev => ({ ...prev, [id]: value }));
    const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (audio) {
      if ('preservesPitch' in audio) {
         audio.preservesPitch = false;
      } else if ('mozPreservesPitch' in audio) {
         (audio as any).mozPreservesPitch = false;
      }
      const tempo = tempoLevels[id] ?? 1;
      audio.playbackRate = value * tempo;
    }
  };

  const handleTempoChange = (id: string, value: number) => {
    setTempoLevels(prev => ({ ...prev, [id]: value }));
    const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (audio) {
      if ('preservesPitch' in audio) {
         audio.preservesPitch = true;
      } else if ('mozPreservesPitch' in audio) {
         (audio as any).mozPreservesPitch = true;
      }
      audio.playbackRate = value;
    }
  };

  const handleFeedback = (id: string, fb: 'like' | 'dislike') => {
    const nextFeedbacks = { ...feedbacks, [id]: feedbacks[id] === fb ? null : fb };
    setFeedbacks(nextFeedbacks);
    localStorage.setItem('lunara_feedbacks', JSON.stringify(nextFeedbacks));
  };

  // Helper Mode States
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [helperSections, setHelperSections] = useState<HelperSection[]>([
    { 
      id: 'initial', 
      type: 'main', 
      mood: getRandomItem(PROMPT_HELPER_CONFIG.moods), 
      gender: getRandomItem(PROMPT_HELPER_CONFIG.genders), 
      theme: getRandomItem(PROMPT_HELPER_CONFIG.themes) 
    }
  ]);
  const [activeSelector, setActiveSelector] = useState<{ sectionId: string, type: 'mood' | 'gender' | 'theme' | 'timestamp' | 'bpm' | 'scale' } | null>(null);
  
  const consoleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial history push
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ prompt, helperSections: JSON.parse(JSON.stringify(helperSections)), isManual: isPromptManual }]);
      setHistoryIndex(0);
    }
  }, []);

  // Debounced history push
  useEffect(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const last = prev[historyIndex];
        // Only push if changed
        if (last && last.prompt === prompt && JSON.stringify(last.helperSections) === JSON.stringify(helperSections)) {
          return prev;
        }
        const newHist = prev.slice(0, historyIndex + 1);
        newHist.push({ prompt, helperSections: JSON.parse(JSON.stringify(helperSections)), isManual: isPromptManual });
        setHistoryIndex(newHist.length - 1);
        return newHist;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [prompt, helperSections, isPromptManual, historyIndex, isUndoRedoAction]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const prev = history[historyIndex - 1];
      setPrompt(prev.prompt);
      setHelperSections(JSON.parse(JSON.stringify(prev.helperSections)));
      setIsPromptManual(prev.isManual);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const next = history[historyIndex + 1];
      setPrompt(next.prompt);
      setHelperSections(JSON.parse(JSON.stringify(next.helperSections)));
      setIsPromptManual(next.isManual);
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Sync Helper sections to Prompt
  useEffect(() => {
    if (isHelperOpen) {
      const generated = helperSections.map(s => {
        const scaleInfo = s.scale ? ` in the scale of ${s.scale}` : '';
        const bpmInfo = s.bpm ? ` at a tempo of ${s.bpm}` : '';
        const chordsInfo = s.chords ? ` using a ${s.chords} chord progression` : '';
        const vocalsInfo = s.vocals ? ` with ${s.vocals.toLowerCase()} vocals` : '';

        if (s.type === 'main') {
          return `Create a beautifully crafted, ${s.mood?.toLowerCase() || 'neutral'} ${s.gender?.toLowerCase() || 'vocal'} track focusing on ${s.theme?.toLowerCase() || 'a specific topic'}${scaleInfo}${bpmInfo}${chordsInfo}${vocalsInfo}.`;
        } else {
          return `[At ${s.timestamp}], the musical arrangement smoothly transitions into a ${s.mood?.toLowerCase()} soundscape, featuring a ${s.gender?.toLowerCase()} style${scaleInfo}${bpmInfo}${chordsInfo}${vocalsInfo}.`;
        }
      }).join('\n');
      setPrompt(generated);
      setIsPromptManual(false); // Helper sync is not "manual typing"
    }
  }, [isHelperOpen, helperSections]);

  useEffect(() => {
    Object.values(consoleRefs.current).forEach(el => {
      if (el) {
        (el as HTMLDivElement).scrollTop = (el as HTMLDivElement).scrollHeight;
      }
    });
  }, [gen.results]);

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Limit to 10 images total
    const remainingSlots = 10 - selectedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImages(prev => [...prev, { data: base64, mimeType: file.type, previewUrl: URL.createObjectURL(file) }]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleFeelingLucky = () => {
    // Check if the prompt is manual and not empty. If so, do nothing.
    if (isPromptManual && prompt.trim() !== '') return;

    const randomMood = getRandomItem(PROMPT_HELPER_CONFIG.moods);
    const randomGender = getRandomItem(PROMPT_HELPER_CONFIG.genders);
    const randomTheme = getRandomItem(PROMPT_HELPER_CONFIG.themes);
    
    setPrompt(`Create a ${randomMood.toLowerCase()} ${randomGender.toLowerCase()} song about ${randomTheme.toLowerCase()}.`);
    setIsPromptManual(false); // Mark as generated
  };

  const updateHelperSection = (id: string, updates: Partial<HelperSection>) => {
    setHelperSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateResult = (id: string, updater: (prev: SongResult) => SongResult) => {
    setGen(prev => ({ results: prev.results.map(r => r.id === id ? updater(r) : r) }));
  };

  const addLog = (id: string, message: string) => {
    updateResult(id, prev => ({ ...prev, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`] }));
  };

  const toggleExpand = (id: string) => {
    setGen(prev => ({ results: prev.results.map(r => r.id === id ? { ...r, isExpanded: !r.isExpanded } : r) }));
  };

  const handleGenerateSongTitle = async (id: string, musicPrompt: string, lyricContext: string) => {
    addLog(id, "Decoding narrative architecture for title...");
    const title = await generateSongTitle(musicPrompt, lyricContext);
    updateResult(id, r => ({ ...r, title }));
    addLog(id, `Identity confirmed: "${title}"`);
    return title;
  };

  const handleGenerateCoverArt = async (id: string, musicPrompt: string, lyricContext: string, title?: string) => {
    addLog(id, "Synthesizing visual representation...");
    const base64Image = await generateCoverArt(musicPrompt, lyricContext, title);
    if (base64Image) {
      updateResult(id, r => ({ ...r, coverImageUrl: base64Image }));
      addLog(id, "Visual synthesis finalized.");
    } else {
      addLog(id, "Visual synthesis skipped.");
    }
  };

  const handleGenerate = async (overrides?: { prompt: string, duration: Duration, lyricsOption: LyricsOption, customLyrics?: string }) => {
    const activePrompt = overrides?.prompt ?? prompt;
    const activeDuration = overrides?.duration ?? duration;
    const activeLyricsOption = overrides?.lyricsOption ?? lyricsOption;
    const activeCustomLyrics = overrides?.customLyrics ?? customLyrics;
    if (!activePrompt.trim() && selectedImages.length === 0) return;

    // Check for API key if Pro or Clip model is selected
    if (activeDuration === 'Pro' || activeDuration === 'Clip (30s)') {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
          }
          return; // Stop generation so the user can select the key and try again
        }
      }
    }

    setIsTriggering(true);
    setTimeout(() => setIsTriggering(false), 200);

    const newId = Math.random().toString(36).substring(7);
    const newResult: SongResult = {
      id: newId, status: 'generating', logs: [], audioUrl: null, coverImageUrl: null, title: null, lyrics: '', metadata: '', fullPrompt: null, error: null, duration: activeDuration, timestamp: new Date(), isExpanded: true,
      originalPrompt: activePrompt, originalDuration: activeDuration, originalLyricsOption: activeLyricsOption
    };
    setGen(prev => ({ results: [newResult, ...prev.results.map(r => ({ ...r, isExpanded: false }))] }));
    const modelId = activeDuration === 'Pro' ? CONFIG.MODEL_ID_FULL : CONFIG.MODEL_ID_SHORT;
    const modelDisplayName = activeDuration === 'Pro' ? 'Lunara Pro' : 'Lunara Clip';
    addLog(newId, `Waking ${modelDisplayName} engine...`);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let lyricInstruction = activeLyricsOption === 'Instrumental' ? "IMPORTANT: This track MUST be strictly INSTRUMENTAL." : 
                          activeLyricsOption === 'Custom' ? `\nUse these exact lyrics:\n ${activeCustomLyrics}` : "\nGenerate lyrics with precise [seconds:] timing markers.";
      
      const pluginNames = selectedPlugins.map(id => Object.values(PLUGINS).find(p => p.id === id)?.name).filter(Boolean);
      const pluginString = pluginNames.length > 0 ? ` featuring ${pluginNames.join(', ')}` : '';
      const contextPart = activePrompt.trim() || pluginString ? `\nContext: "${activePrompt}${pluginString}".` : '';
      
      const promptText = `Generate a ${activeDuration === 'Pro' ? 'full-length' : '30-second'} track.${contextPart} ${ lyricInstruction }.`;
      
      // Save the full prompt for display later
      updateResult(newId, r => ({ ...r, fullPrompt: promptText }));
      
      const contents: any = selectedImages.length > 0 ? { 
        parts: [
          { text: promptText }, 
          ...selectedImages.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }))
        ] 
      } : promptText;
      const responseStream = await ai.models.generateContentStream({ model: modelId, contents: contents, config: { responseModalities: [Modality.AUDIO] } });
      let audioAccumulator = ""; let textAccumulator = ""; let mimeType = "audio/wav"; let auxTriggered = false;
      let currentPartType = ''; let textPartsSeen = 0;
      
      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) { 
            currentPartType = 'audio';
            if (!audioAccumulator && part.inlineData.mimeType) mimeType = part.inlineData.mimeType; 
            audioAccumulator += part.inlineData.data; 
          }
          if (part.text) {
            if (currentPartType !== 'text') { 
              textPartsSeen++; 
              currentPartType = 'text'; 
            }
            if (textPartsSeen === 1) {
              textAccumulator += part.text;
              const { lyrics, metadata } = parseModelOutput(textAccumulator);
              updateResult(newId, r => ({ ...r, lyrics, metadata }));
              if (!auxTriggered && textAccumulator.length > 50) { auxTriggered = true; handleGenerateSongTitle(newId, activePrompt, textAccumulator).then(t => handleGenerateCoverArt(newId, activePrompt, textAccumulator, t)); }
            }
          }
        }
      }
      console.log('[Raw Generated Lyrics]', textAccumulator);
      if (audioAccumulator) { updateResult(newId, r => ({ ...r, status: 'completed', audioUrl: createAudioUrlFromBase64(audioAccumulator, mimeType) })); addLog(newId, "Signal stabilized."); }
      else throw new Error("Zero audio bits captured.");
    } catch (err: any) { 
        let errorMsg = err.message || "Synthesis interrupted.";
        let troubleshoot = "Please try again later or adjust your prompt.";
        if (errorMsg.includes("quota") || errorMsg.includes("429")) {
            errorMsg = "Quota Exceeded";
            troubleshoot = "Your API key has reached its quota limit. Please use a different key or try again later when your quota resets.";
        } else if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
            errorMsg = "Content Blocked by Safety Filters";
            troubleshoot = "Your prompt likely triggered safety filters. Please remove potentially inappropriate words or themes and try again.";
        } else if (errorMsg.includes("500") || errorMsg.includes("fetch")) {
            errorMsg = "Server Unreachable";
            troubleshoot = "The generation server is currently unavailable or experiencing high load. Try again in a few minutes.";
        }
        updateResult(newId, r => ({ ...r, status: 'error', error: `${errorMsg}|${troubleshoot}` })); 
    }
  };

  const handleDownload = (result: SongResult) => {
    if (!result.audioUrl) return;
    const link = document.createElement('a'); link.href = result.audioUrl; link.download = `${result.title || 'Lunara'}.wav`; link.click();
  };

  const handleDownloadStems = (result: SongResult) => {
    if (!result.audioUrl) return;
    // Mock downloading multiple files by triggering them with timeouts
    const stems = ['Vocals', 'Drums', 'Bass', 'Other'];
    stems.forEach((stem, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = result.audioUrl as string;
        link.download = `${result.title || 'Lunara'}_${stem}.wav`;
        link.click();
      }, index * 500); 
    });
  };

  const handleRemix = (result: SongResult) => {
    setPrompt(result.originalPrompt);
    setIsPromptManual(true);
    setIsHelperOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveVersion = (result: SongResult) => {
    const newVersion: SongResult = {
      ...result,
      id: Math.random().toString(36).substring(7),
      title: `${result.title || 'Lunara'} (Version)`,
      createdAt: new Date().toISOString(),
    };
    setGen(prev => ({...prev, results: [newVersion, ...prev.results]}));
    
    // Copy the current tempo and pitch if they exist
    if (tempoLevels[result.id]) {
        setTempoLevels(prev => ({...prev, [newVersion.id]: prev[result.id]}));
    }
    if (pitchLevels[result.id]) {
        setPitchLevels(prev => ({...prev, [newVersion.id]: prev[result.id]}));
    }
  };

  const handleMastering = (id: string, currentStatus: string) => {
    if (currentStatus === 'processing' || currentStatus === 'done') return;
    setMasteringStatus(prev => ({ ...prev, [id]: 'processing' }));
    setTimeout(() => {
      setMasteringStatus(prev => ({ ...prev, [id]: 'done' }));
    }, 2500);
  };

  const onDownloadVideo = async (result: SongResult, withLyrics: boolean = false) => {
    if (!result.audioUrl || !result.coverImageUrl || encodingVideoId) return;
    setEncodingVideoId(result.id);
    setEncodingProgress(0);

    await handleDownloadVideo(
      result,
      withLyrics,
      (progress) => setEncodingProgress(progress),
      () => {
        setEncodingVideoId(null);
        setEncodingProgress(0);
      },
      videoSettings.type,
      videoSettings.color,
      videoSettings.density,
      videoSettings.speed,
      videoSettings.animationStyle
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate(); };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-900/40 blur-[120px] mix-blend-screen"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/40 blur-[120px] mix-blend-screen"
          />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-end px-8 py-6 max-w-7xl mx-auto w-full">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setHasStarted(true)}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-md border border-white/10 transition-colors"
          >
            Launch App
          </motion.button>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 mt-[-40px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-medium tracking-widest uppercase text-blue-200">Next-Gen Audio Synthesis</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 relative z-10"
          >
            Sound, <br className="md:hidden"/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Reimagined.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed mb-12 relative z-10"
          >
            Transform your imagination into high-fidelity music. Lunara Studio connects narrative intent with emotional resonance to generate studio-quality tracks instantly.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative z-10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHasStarted(true)}
              className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Start Creating 
                <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
            <div className="absolute inset-0 -z-10 bg-white/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col pb-20 overflow-x-hidden ${isDarkMode ? 'dark-mode' : ''}`} onClick={() => setActiveSelector(null)}>
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHasStarted(false)}>
          <div className="w-8 h-8 music-gradient rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">LN</div>
          <span className="font-semibold text-lg tracking-tight">Lunara Studio</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-100 p-1 rounded-full">
          <button onClick={() => setViewMode('create')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'create' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Create</button>
          <button onClick={() => setViewMode('community')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'community' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Community</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Search prompts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-1.5 bg-gray-100 rounded-full text-xs border border-transparent focus:border-gray-300 w-48 transition-all" />
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
             {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200 hidden sm:block">lunara 1.0 preview</div>
          <button 
            onClick={handleSelectKey} 
            className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
          >
            api key
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-12">
        {viewMode === 'community' ? (
          <CommunityFeed />
        ) : (
          <>
            <section className="text-center mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tighter text-gray-900 leading-tight"
          >
            Create your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">sound</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Synthesis of professional music from narrative engineering.
          </motion.p>
        </section>

        <section className="bg-white rounded-[40px] p-8 md:p-12 card-shadow border border-gray-100 mb-12 relative z-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-1">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Track Directives (Ctrl + Enter to send)</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-3">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-1.5 rounded-full transition-colors ${historyIndex > 0 ? 'text-gray-500 hover:text-blue-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`} title="Undo">
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-1.5 rounded-full transition-colors ${historyIndex < history.length - 1 ? 'text-gray-500 hover:text-blue-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`} title="Redo">
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={saveCurrentPrompt} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-green-600 flex items-center gap-1.5 transition-colors">
                    Save Prompt
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsHelperOpen(!isHelperOpen); }}
                    className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${isHelperOpen ? 'text-blue-600' : 'text-blue-400 hover:text-blue-600'}`}
                  >
                    <Icons.Sparkles className="w-3.5 h-3.5" />
                    {isHelperOpen ? 'Free Text' : 'Help me create'}
                  </button>
                </div>
              </div>
              
              {savedPrompts.length > 0 && !isHelperOpen && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {savedPrompts.map((p, idx) => (
                    <button key={idx} onClick={() => { setPrompt(p); setIsPromptManual(true); }} className="text-[10px] bg-blue-50/50 text-blue-600 border border-blue-100/50 px-3 py-1.5 rounded-full font-medium shadow-sm hover:bg-blue-100 transition-colors truncate max-w-[200px]" title={p}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative group/prompt min-h-[160px]">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                {isHelperOpen ? (
                  <>
                  <PromptBuilder
                    isHelperOpen={isHelperOpen}
                    helperSections={helperSections}
                    setHelperSections={setHelperSections}
                    activeSelector={activeSelector}
                    setActiveSelector={setActiveSelector}
                    selectedImages={selectedImages}
                    onImageSelect={() => fileInputRef.current?.click()}
                    onImageRemove={removeImage}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isSuggestingPrompts}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setIsSuggestingPrompts(true);
                          const { suggestPrompts } = await import('./src/services/genaiService');
                          if(!suggestPrompts) return;
                          
                          const topics = helperSections.map(s => `${s.mood} ${s.theme} ${s.gender}`).join(', ');
                          const suggestions = await suggestPrompts(topics);
                          if (suggestions.length > 0) {
                            setPrompt(suggestions[0]);
                            setIsPromptManual(true);
                            setIsHelperOpen(false);
                            
                            // Push to savedPrompts so user can see alternatives too
                            const newSaved = [...new Set([...suggestions, ...savedPrompts])].slice(0, 10);
                            setSavedPrompts(newSaved);
                            localStorage.setItem('lunara_saved_prompts', JSON.stringify(newSaved));
                          }
                        } catch(err) {
                           console.error(err);
                        } finally {
                          setIsSuggestingPrompts(false);
                        }
                      }}
                      className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-200 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <Icons.Sparkles className="w-4 h-4"/>
                      {isSuggestingPrompts ? "Generating..." : "Suggest AI Prompts"}
                    </button>
                  </div>
                  </>
                ) : (
                  <div className="relative">
                    <textarea
                      ref={promptTextareaRef}
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setIsPromptManual(true);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Atmospheric cinematic track with heavy sub-bass..."
                      className="w-full min-h-[128px] bg-gray-50 border border-gray-100 rounded-3xl p-6 pb-20 text-xl font-light leading-relaxed resize-none focus:bg-white transition-all pr-16"
                      style={{ overflow: 'hidden' }}
                    />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      {selectedImages.length < 10 && (
                        <button 
                          title="By using this feature, you confirm that you have the necessary rights to any content that you upload. Do not generate content that infringes on others’ intellectual property or privacy rights. Your use of this generative AI service is subject to our Prohibited Use Policy." 
                          onClick={() => fileInputRef.current?.click()} 
                          className={`transition-all shadow-sm border border-gray-100 flex items-center justify-center ${selectedImages.length > 0 ? 'p-2.5 rounded-2xl bg-blue-500 text-white' : 'px-4 py-2.5 rounded-2xl bg-white text-gray-500 hover:text-blue-600 gap-2 text-sm font-medium'}`}
                        >
                          <Icons.Camera className="w-5 h-5" />
                          {selectedImages.length === 0 && <span>Add image references</span>}
                        </button>
                      )}
                      {selectedImages.length > 0 && (
                        <div className="flex gap-2">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-lg animate-in zoom-in duration-200">
                              <img src={img.previewUrl} className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur hover:bg-black"><Icons.X className="w-2.5 h-2.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button 
                        title="I'm feeling lucky" 
                        onClick={handleFeelingLucky} 
                        className={`p-2.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-blue-500 rounded-2xl transition-transform active:scale-90 ${isPromptManual && prompt.trim() !== '' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      >
                        <Icons.Sparkles className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Length</label>
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                  {(['Clip (30s)', 'Pro'] as Duration[]).map((opt) => (
                    <button key={opt} onClick={() => setDuration(opt)} className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${duration === opt ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-800'}`}>{opt}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Lyrics</label>
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                  {(['Auto', 'Custom', 'Instrumental'] as LyricsOption[]).map((opt) => (
                    <button key={opt} onClick={() => setLyricsOption(opt)} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${lyricsOption === opt ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            {lyricsOption === 'Custom' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Custom Composition Lyrics</label>
                  <button onClick={() => setIsRhymeOpen(!isRhymeOpen)} className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${isRhymeOpen ? 'text-purple-600' : 'text-purple-400 hover:text-purple-600'}`}>
                    <Mic2 className="w-3.5 h-3.5" />
                    AI Rhyme Assistant
                  </button>
                </div>
                {isRhymeOpen && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-700 flex gap-4 items-start">
                    <Icons.Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">Rhyme & Syllable Suggestions (Mock)</p>
                      <p className="opacity-80">Suggestions: <i>fly, high, sky, lie</i></p>
                      <p className="opacity-80 mt-1">Syllable matches: <i>in the sky (3), let it fly (3)</i></p>
                    </div>
                  </div>
                )}
                <textarea
                  value={customLyrics}
                  onChange={(e) => setCustomLyrics(e.target.value)}
                  placeholder={`[0:00 - 0:15] Hey this is your song\n[0:15 - ] You can write any lyrics you want`}
                  className="w-full min-h-[160px] bg-gray-50 border border-gray-100 rounded-3xl p-6 text-lg font-light leading-relaxed resize-none focus:bg-white transition-all custom-scrollbar"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Instruments & Plugins</label>
              <div className="flex flex-wrap gap-2">
                {PLUGINS.map(plugin => (
                  <button 
                    key={plugin.id} 
                    onClick={() => setSelectedPlugins(prev => prev.includes(plugin.id) ? prev.filter(p => p !== plugin.id) : [...prev, plugin.id])}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedPlugins.includes(plugin.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {plugin.name}
                  </button>
                ))}
              </div>
            </div>

            <motion.button 
              whileHover={(!prompt.trim() && selectedImages.length === 0) || CONFIG.IS_MAINTENANCE_MODE ? {} : { scale: 1.01 }}
              whileTap={(!prompt.trim() && selectedImages.length === 0) || CONFIG.IS_MAINTENANCE_MODE ? {} : { scale: 0.98 }}
              onClick={() => handleGenerate()} 
              disabled={(!prompt.trim() && selectedImages.length === 0) || CONFIG.IS_MAINTENANCE_MODE} 
              className={`w-full py-5 rounded-3xl text-lg font-bold text-white transition-all shadow-xl relative overflow-hidden group ${
                ((!prompt.trim() && selectedImages.length === 0) || CONFIG.IS_MAINTENANCE_MODE)
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : `bg-gradient-to-r from-blue-600 to-purple-600 shadow-purple-500/25 ${isTriggering ? 'scale-[0.98] brightness-125 ring-4 ring-purple-200' : ''}`
              }`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              Generate Song
            </motion.button>

          </div>
        </section>

        {gen.results.length > 0 && (
          <div className="relative mb-12 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/60"></div></div>
            <div className="relative bg-[#fbfbfd] px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Songs Gallery</div>
          </div>
        )}

        <div className="space-y-6">
          {gen.results.filter(r => !searchQuery || (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || r.originalPrompt.toLowerCase().includes(searchQuery.toLowerCase())).map((result) => {
            const isExpanded = result.isExpanded;
            const isEncoding = encodingVideoId === result.id;
            const isGenerating = result.status === 'generating';
            const isFailed = result.status === 'error';
            
            return (
              <div key={result.id} className="group relative transition-all duration-700 ease-in-out transform">
                <div className={`relative transition-all duration-700 ease-in-out border border-gray-200/60 shadow-lg rounded-[40px] ${isExpanded ? 'p-8 pb-12' : 'p-4'}`}>
                  <div className="absolute inset-0 z-0 rounded-[40px] overflow-hidden" style={{ backgroundImage: result.coverImageUrl ? `url(${result.coverImageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out backdrop-blur-2xl ${isExpanded ? 'bg-white/75 opacity-100' : 'bg-white/85 opacity-100'}`} />
                  </div>

                  <div className={`relative z-[30] flex transition-all duration-700 ease-in-out gap-6 items-center ${isExpanded ? 'flex-col md:flex-row mb-8' : 'flex-row'}`} onClick={() => !isExpanded && toggleExpand(result.id)} style={{ cursor: isExpanded ? 'default' : 'pointer' }}>
                    <div className={`relative shrink-0 transition-all duration-700 ease-in-out rounded-3xl overflow-hidden shadow-2xl ${isExpanded ? 'w-48 h-48 md:w-56 md:h-56' : 'w-16 h-16'}`}>
                      {result.coverImageUrl ? <img src={result.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100/50"><Icons.Sparkles className={`text-blue-300 ${isExpanded ? 'w-12 h-12 animate-pulse' : 'w-5 h-5'}`} /></div>}
                      {isEncoding && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"><Icons.Loading className={`${isExpanded ? 'w-12 h-12' : 'w-6 h-6'} text-blue-600 animate-spin`} /></div>}
                      <button onClick={(e) => { e.stopPropagation(); if (isGenerating) return; const audio = document.getElementById(`audio-${result.id}`) as HTMLAudioElement; if (audio) audio.paused ? audio.play() : audio.pause(); }} disabled={(!result.audioUrl && !isGenerating) || isEncoding} className={`absolute inset-0 flex items-center justify-center text-white z-10 transition-opacity duration-300 ${isExpanded || isGenerating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isEncoding ? 'cursor-wait' : 'cursor-pointer'}`}>
                        <div className={`music-gradient backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 shadow-2xl hover:scale-110 transition-transform ${isExpanded ? 'w-16 h-16' : 'w-10 h-10'}`}>
                          {isGenerating ? <Icons.Loading className={`${isExpanded ? 'w-8 h-8' : 'w-5 h-5'} animate-spin`} /> : isResultPlaying === result.id ? <Icons.Pause className={isExpanded ? 'w-8 h-8' : 'w-5 h-5'} /> : <Icons.Play className={`${isExpanded ? 'w-8 h-8' : 'w-5 h-5'} ml-1`} />}
                        </div>
                      </button>
                    </div>

                    <div className={`flex-1 min-w-0 transition-all duration-700 ease-in-out ${isExpanded ? 'text-center md:text-left' : ''}`}>
                      <div className="space-y-1 relative">
                        <div className={`flex items-center gap-4 ${isExpanded ? 'justify-center md:justify-start flex-wrap' : ''}`}>
                          <h4 className={`font-extrabold text-blue-900 tracking-tight transition-all duration-700 ease-in-out truncate ${isExpanded ? 'text-3xl md:text-4xl' : 'text-lg'}`}>
                            {isFailed ? (result.error?.split('|')[0] || 'Processing Failed') : (result.title || (isGenerating ? "Synthesizing..." : "Untitled Composition"))}
                          </h4>
                          {(isFailed || result.audioUrl) && (
                            <div className="relative flex items-center gap-2 mt-2 md:mt-0" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleGenerate({ prompt: `${result.originalPrompt} (Alternative Version)`, duration: result.originalDuration, lyricsOption: result.originalLyricsOption })} className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-600 text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-purple-200 transition-all shadow-sm active:scale-95 z-20">
                                <Icons.Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>Remix</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest transition-all duration-700 ease-in-out ${isExpanded ? 'justify-center md:justify-start' : ''}`}>
                          <span className="px-2 py-0.5 bg-blue-500 text-white rounded">LUNARA 1.0</span>
                          <span>• {result.duration}</span>
                        </div>
                      </div>

                      <div className={`transition-all duration-700 ease-in-out overflow-visible ${isExpanded ? 'max-h-[350px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {isFailed && result.error && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-4">
                            <h5 className="text-red-800 font-bold mb-1 text-sm">{result.error.split('|')[0]}</h5>
                            <p className="text-red-600 text-xs">{result.error.split('|')[1] || "An unexpected error occurred during synthesis."}</p>
                          </div>
                        )}
                        {result.audioUrl && (
                          <div className="space-y-4">
                            <audio id={`audio-${result.id}`} onEnded={() => handleQueueSongEnded(result.id)} onPlay={() => setIsResultPlaying(result.id)} onPause={() => setIsResultPlaying(null)} controls className="h-10 w-full rounded-2xl"><source src={result.audioUrl} /></audio>
                            
                            <div className="flex flex-col gap-3 mt-4 text-xs font-medium text-gray-500 bg-white/50 p-4 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-4">
                                <label className="w-16">Pitch</label>
                                <input type="range" min="0.5" max="1.5" step="0.05" value={pitchLevels[result.id] ?? 1} onChange={(e) => handlePitchChange(result.id, parseFloat(e.target.value))} className="flex-1 accent-blue-500" />
                                <span className="w-12 text-right">{(pitchLevels[result.id] ?? 1).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="w-16">Tempo</label>
                                <input type="range" min="0.5" max="2" step="0.05" value={tempoLevels[result.id] ?? 1} onChange={(e) => handleTempoChange(result.id, parseFloat(e.target.value))} className="flex-1 accent-blue-500" />
                                <span className="w-12 text-right">{(tempoLevels[result.id] ?? 1).toFixed(2)}x</span>
                              </div>
                            </div>

                            <div className="flex gap-4 items-center relative">
                              <div className="flex-1 relative group/download" onClick={e => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); handleDownload(result); }} className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 ${isEncoding ? 'opacity-50 cursor-wait' : ''}`} disabled={isEncoding}>
                                  {isEncoding ? <Icons.Loading className="w-4 h-4 animate-spin" /> : <Icons.Download className="w-4 h-4" />}
                                  {isEncoding ? `Processing ${Math.round(encodingProgress)}%` : 'Download'}
                                </button>
                                {!isEncoding && (
                                  <div className="absolute top-full left-0 right-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/download:opacity-100 group-hover/download:translate-y-0 group-hover/download:pointer-events-auto transition-all duration-300 z-[60]">
                                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                      <button onClick={(e) => { e.stopPropagation(); handleDownload(result); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Icons.Download className="w-4 h-4" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-900">Track</div><div className="text-[9px] text-gray-400">High fidelity master</div></div>
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDownloadMidi(result.title); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Music className="w-4 h-4" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-900">MIDI Data</div><div className="text-[9px] text-gray-400">DAW ready sequences</div></div>
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDownloadStems(result); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-900">Stems</div><div className="text-[9px] text-gray-400">Vocals, Drums, Bass, Other</div></div>
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onDownloadVideo(result, false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Icons.Video className="w-4 h-4" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-900">Video</div><div className="text-[9px] text-gray-400">Reactive visual map</div></div>
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onDownloadVideo(result, true); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-50 transition-colors">
                                        <div className="w-8 h-8 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center"><Icons.Sparkles className="w-4 h-4" /></div>
                                        <div><div className="text-[10px] font-bold uppercase tracking-wider text-gray-900">Karaoke</div><div className="text-[9px] text-gray-400">Timed sync engine</div></div>
                                      </button>
                                      <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-2">Video Style</div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                          {['bars', 'waveform', 'particles', 'circular', 'geometric'].map(t => (
                                            <button key={t} onClick={(e) => { e.stopPropagation(); setVideoSettings(s => ({ ...s, type: t as any })); }} className={`flex-1 min-w-[30%] py-1 rounded text-[9px] font-bold capitalize border ${videoSettings.type === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-500'}`}>
                                              {t}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="space-y-4">
                                          <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                              Color Palette
                                              <input type="color" value={videoSettings.color} onChange={(e) => setVideoSettings(s => ({...s, color: e.target.value})) } onClick={e => e.stopPropagation()} className="w-6 h-6 p-0 border-0 rounded cursor-pointer shrink-0" />
                                            </div>
                                            <div className="flex gap-2">
                                                {['#ff2d55', '#32d74b', '#0a84ff', '#ff9f0a', '#bf5af2'].map(c => (
                                                  <button key={c} onClick={(e) => { e.stopPropagation(); setVideoSettings(s => ({...s, color: c})); }} className={`w-4 h-4 rounded-full border-2 ${videoSettings.color === c ? 'border-gray-900' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                          </div>
                                          
                                          <div className="flex flex-col gap-2">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Animation Style</div>
                                            <div className="flex gap-1">
                                              {['pulsing', 'spinning', 'flowing'].map(style => (
                                                <button key={style} onClick={(e) => { e.stopPropagation(); setVideoSettings(s => ({ ...s, animationStyle: style as any })); }} className={`flex-1 py-1 rounded text-[9px] font-bold capitalize border ${videoSettings.animationStyle === style ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-500'}`}>
                                                  {style}
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          {videoSettings.type === 'particles' && (
                                            <>
                                              <div className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-2">
                                                <span>Density ({videoSettings.density.toFixed(1)}x)</span>
                                                <input type="range" min="0.1" max="5" step="0.1" value={videoSettings.density} onChange={(e) => setVideoSettings(s => ({...s, density: parseFloat(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-full" />
                                              </div>
                                            </>
                                          )}
                                          {(videoSettings.type === 'particles' || videoSettings.type === 'geometric') && (
                                              <div className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                <span>Anim Speed ({videoSettings.speed.toFixed(1)}x)</span>
                                                <input type="range" min="0.1" max="5" step="0.1" value={videoSettings.speed} onChange={(e) => setVideoSettings(s => ({...s, speed: parseFloat(e.target.value)}))} onClick={e => e.stopPropagation()} className="w-full" />
                                              </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-1 items-end h-10 w-24">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1.5 bg-blue-500 rounded-t-sm"
                                    initial={{ height: 4 }}
                                    animate={isResultPlaying === result.id ? { height: [4, Math.random() * 24 + 8, 4] } : { height: 4 }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.05 }}
                                  />
                                ))}
                              </div>
                              
                              <div className="flex gap-2 items-center">
                                <button onClick={(e) => { e.stopPropagation(); handleAddToQueue(result.id); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${queue.includes(result.id) ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'} flex items-center gap-2`}>
                                  <Icons.List className="w-3.5 h-3.5" />
                                  {queue.includes(result.id) ? 'Queued' : 'Queue'}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRemix(result); }} className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                                  <History className="w-3.5 h-3.5" />
                                  Remix
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleSaveVersion(result); }} className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-2" title="Save as a new version with current pitch/tempo">
                                  <Layers className="w-3.5 h-3.5" />
                                  Save Version
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleMastering(result.id, masteringStatus[result.id] || 'idle'); }} disabled={masteringStatus[result.id] === 'processing'} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${masteringStatus[result.id] === 'done' ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm'} flex items-center gap-2`}>
                                  <Wand2 className="w-3.5 h-3.5" />
                                  {masteringStatus[result.id] === 'processing' ? 'Mastering...' : masteringStatus[result.id] === 'done' ? 'Mastered' : 'AI Master'}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}?share=${result.id}`); alert('Link copied to clipboard!'); }} className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                                  <Share className="w-3.5 h-3.5" />
                                  Share
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowAlbumModal(result.id); }} className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                                  <FolderPlus className="w-3.5 h-3.5" />
                                  Add to Album
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleFeedback(result.id, 'like'); }} className={`p-3 rounded-xl transition-colors shadow-sm ${feedbacks[result.id] === 'like' ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}><ThumbsUp className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleFeedback(result.id, 'dislike'); }} className={`p-3 rounded-xl transition-colors shadow-sm ${feedbacks[result.id] === 'dislike' ? 'bg-red-100 text-red-600' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}><ThumbsDown className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        )}
                        {!result.audioUrl && isGenerating && <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden mt-6"><div className="h-full bg-blue-500 animate-[loading_2s_infinite]"></div></div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4"><button onClick={(e) => { e.stopPropagation(); toggleExpand(result.id); }} className={`p-2 rounded-full transition-all duration-500 ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-90' : 'text-gray-400 group-hover:text-blue-500'}`}><Icons.ChevronRight className="w-6 h-6" /></button></div>
                  </div>

                  <div className={`relative z-10 grid transition-all duration-700 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      {/* Generation Directive Box */}
                      {(result.fullPrompt || result.originalPrompt) && (
                        <div className="mb-6 space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Generation Directive</label>
                          <div className="bg-gray-50/80 border border-gray-100 rounded-[24px] p-6 text-xs font-mono text-gray-600 whitespace-pre-wrap shadow-inner overflow-x-auto custom-scrollbar">
                            {result.fullPrompt || result.originalPrompt}
                          </div>
                        </div>
                      )}

                      {/* Time-stamped Comments */}
                      <div className="mb-6 space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Time-stamped Comments</label>
                        <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                          <div className="flex gap-4 items-end mb-4">
                            <div className="w-20">
                              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Time</label>
                              <input type="text" value={newComment.timeCode} onChange={e => setNewComment({...newComment, timeCode: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none" placeholder="0:45" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Comment</label>
                              <input type="text" value={newComment.text} onChange={e => setNewComment({...newComment, text: e.target.value})} onKeyDown={e => {
                                if (e.key === 'Enter' && newComment.text) {
                                  const nextComments = {...songComments, [result.id]: [...(songComments[result.id] || []), newComment]};
                                  setSongComments(nextComments);
                                  localStorage.setItem('lunara_comments', JSON.stringify(nextComments));
                                  setNewComment({timeCode: '0:00', text: ''});
                                }
                              }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Add a note... (Press Enter)" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(songComments[result.id] || []).map((c, i) => (
                              <div key={i} className="flex gap-3 items-center text-sm p-2 rounded-lg hover:bg-gray-50">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 font-mono text-xs rounded-md">{c.timeCode}</span>
                                <span className="text-gray-700">{c.text}</span>
                              </div>
                            ))}
                            {!(songComments[result.id] || []).length && <div className="text-sm text-gray-400 italic">No comments yet.</div>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-2">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Composition Lyrics</label>
                          <div className="bg-white/40 border border-white/50 backdrop-blur-md rounded-[32px] p-8 h-[240px] overflow-y-auto text-base text-gray-800 italic whitespace-pre-wrap font-serif shadow-inner custom-scrollbar">{result.lyrics ? cleanLyricsForDisplay(result.lyrics) : (isGenerating ? "Synthesizing narrative..." : "Instrumental")}</div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">System Console</label>
                          <div ref={el => { consoleRefs.current[result.id] = el; }} className="bg-[#1c1c1e] rounded-[32px] p-8 h-[240px] overflow-y-auto font-mono text-[11px] text-[#32d74b] space-y-1 shadow-2xl border border-gray-800/50 custom-scrollbar">{result.logs.map((log, i) => <div key={i} className="opacity-80 leading-relaxed">{log}</div>)}</div>
                        </div>
                      </div>

                      {/* Advanced 3D Visualizer */}
                      <div className="mt-8 space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">3D Music Visualizer Studio</label>
                        <div className="relative w-full h-[400px] bg-black rounded-[32px] overflow-hidden shadow-2xl">
                          <ThreeDVisualizer intensity={isResultPlaying === result.id ? 0.8 : 0} speed={tempoLevels[result.id] ?? 1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </main>

      {queue.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[100] animate-in slide-in-from-bottom-5">
           <div className="max-w-7xl mx-auto p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                      <Icons.List className="w-5 h-5"/>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 border-b border-transparent">Queue Active</h5>
                      <p className="text-xs text-gray-500">{queue.length} track(s) in queue</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                        if(queue.length > 0){
                          const audio = document.getElementById(`audio-${queue[0]}`) as HTMLAudioElement;
                          if (audio) { audio.play(); setIsResultPlaying(queue[0]); }
                        }
                    }} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition"
                  >
                    Play Queue
                  </button>
                  <button 
                    onClick={() => setQueue([])} 
                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-[0.1em] transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {queue.map((qId, index) => {
                  const s = gen.results.find(r => r.id === qId);
                  if(!s) return null;
                  const isPlaying = isResultPlaying === qId;
                  return (
                    <div key={`${qId}-${index}`} className={`flex-shrink-0 w-48 p-3 rounded-2xl border ${isPlaying ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50'} relative group`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-bold text-gray-800 truncate pr-2 flex items-center gap-1" title={s.title || 'Untitled'} >
                           {isPlaying && <span className="animate-pulse w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>}
                           {s.title || 'Untitled'}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{s.duration}</div>
                      
                      <button onClick={() => {
                        const newQ = [...queue];
                        newQ.splice(index, 1);
                        setQueue(newQ);
                        if (isPlaying) {
                           const audio = document.getElementById(`audio-${qId}`) as HTMLAudioElement;
                           if (audio) { audio.pause(); audio.currentTime = 0; setIsResultPlaying(null); }
                        }
                      }} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <button disabled={index === 0} onClick={() => {
                             const newQ = [...queue];
                             const temp = newQ[index - 1];
                             newQ[index - 1] = newQ[index];
                             newQ[index] = temp;
                             setQueue(newQ);
                         }} className="p-1 bg-white border border-gray-200 rounded text-gray-500 hover:text-indigo-600 disabled:opacity-30"><Icons.ChevronLeft className="w-3 h-3" /></button>
                         <button disabled={index === queue.length - 1} onClick={() => {
                             const newQ = [...queue];
                             const temp = newQ[index + 1];
                             newQ[index + 1] = newQ[index];
                             newQ[index] = temp;
                             setQueue(newQ);
                         }} className="p-1 bg-white border border-gray-200 rounded text-gray-500 hover:text-indigo-600 disabled:opacity-30"><Icons.ChevronRight className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>
      )}

      {showAlbumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAlbumModal(null)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold tracking-tight text-gray-900">Add to Album</h3>
              <button onClick={() => setShowAlbumModal(null)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => {
                    setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, songs: [...new Set([...a.songs, showAlbumModal])] } : a));
                    setShowAlbumModal(null);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-800">{album.name}</div>
                  <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{album.songs.length} Tracks</div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 gap-3 flex">
              <input 
                type="text" 
                value={newAlbumName} 
                onChange={e => setNewAlbumName(e.target.value)}
                placeholder="New Album Name" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button 
                disabled={!newAlbumName.trim()}
                onClick={() => {
                  const newId = Math.random().toString(36).substring(7);
                  setAlbums(prev => [...prev, { id: newId, name: newAlbumName.trim(), songs: [showAlbumModal] }]);
                  setNewAlbumName('');
                  setShowAlbumModal(null);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm tracking-wide disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;