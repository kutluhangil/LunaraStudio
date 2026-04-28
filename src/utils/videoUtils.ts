/**
 * Video Utilities
 *
 * This module handles the complex logic of rendering audio and cover art into a video file.
 * It uses the Web Audio API for spectrum analysis and the Canvas API for visual rendering.
 *
 * Use Cases:
 * - Exporting a generated song as a video file (WebM) for sharing on social media.
 * - Rendering dynamic audio spectrum visualizations.
 * - Overlaying synchronized lyrics on the video.
 */
import { SongResult } from '../../types';
import { parseTimedLyrics } from './lyricsUtils';
import { logFunctionCall } from './logger';

/**
 * Generates and downloads a video combining the song's audio, cover art, and optional lyrics.
 * @param result The song result object containing audio and image URLs.
 * @param withLyrics Whether to overlay synchronized lyrics on the video.
 * @param onProgress Callback function to report encoding progress (0-100).
 * @param onComplete Callback function executed when encoding finishes.
 */
  export const handleDownloadVideo = async (
    result: SongResult,
    withLyrics: boolean,
    onProgress: (progress: number) => void,
    onComplete: () => void,
    visualizerType: 'bars' | 'waveform' | 'particles' | 'circular' | 'geometric' = 'bars',
    visualizerColor: string = 'rgba(255, 45, 85, 0.8)',
    density: number = 1,
    speed: number = 1,
    animationStyle: 'pulsing' | 'spinning' | 'flowing' = 'flowing'
  ) => {
  logFunctionCall('handleDownloadVideo', { resultId: result.id, withLyrics });
  if (!result.audioUrl || !result.coverImageUrl) {
    onComplete();
    return;
  }

  const audio = new Audio(result.audioUrl);
  audio.crossOrigin = "anonymous";
  await new Promise(resolve => audio.onloadedmetadata = resolve);

  const canvas = document.createElement('canvas');
  const canvasWidth = withLyrics ? 1920 : 1080;
  const canvasHeight = 1080;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    onComplete();
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = result.coverImageUrl;
  await new Promise(resolve => img.onload = resolve);

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const dest = audioCtx.createMediaStreamDestination();
  source.connect(analyser);
  analyser.connect(dest);

  const stream = canvas.captureStream(30);
  const combined = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const recorder = new MediaRecorder(combined, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.title || 'Lyria'}_${withLyrics ? 'Lyrics' : 'Spectrum'}.webm`;
    link.click();
    onComplete();
  };

  const timedLyrics = withLyrics ? parseTimedLyrics(result.lyrics) : [];
  console.log('[Video Debug] withLyrics:', withLyrics);
  console.log('[Video Debug] timedLyrics length:', timedLyrics.length);
  if (withLyrics && timedLyrics.length === 0) {
    console.warn('[Video Debug] WARNING: withLyrics is true, but timedLyrics is empty. Lyrics will not be displayed.');
  }

  const workerCode = `
    let interval;
    self.onmessage = function(e) {
      if (e.data === 'start') {
        interval = setInterval(() => self.postMessage('tick'), 1000 / 30);
      } else if (e.data === 'stop') {
        clearInterval(interval);
      }
    };
  `;
  const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(workerBlob);
  const worker = new Worker(workerUrl);

  let lastProgress = -1;

  recorder.start();
  audio.play().catch(err => {
    console.error("Audio playback failed:", err);
    worker.postMessage('stop');
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
    recorder.stop();
    audioCtx.close();
    onComplete();
  });

  const getWrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  const draw = () => {
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (withLyrics) {
      ctx.filter = 'blur(40px)';
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw cover image on the left (or center if no lyrics)
    ctx.drawImage(img, 0, 0, 1080, 1080);

    // Add a darker overlay for readability
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 1080, 1080);

    // Get frequency data for spectrum
    analyser.getByteFrequencyData(dataArray);

    // Draw Spectrum
    if (visualizerType === 'bars') {
      const barWidth = (1080 / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * 300;

        const gradient = ctx.createLinearGradient(0, 1080, 0, 1080 - barHeight);
        gradient.addColorStop(0, visualizerColor);
        gradient.addColorStop(1, 'rgba(175, 82, 222, 0.8)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, 1080 - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    } else if (visualizerType === 'waveform') {
      analyser.getByteTimeDomainData(dataArray);
      ctx.lineWidth = 4;
      ctx.strokeStyle = visualizerColor;
      ctx.beginPath();
      const sliceWidth = 1080 / bufferLength;
      let x = 0;
      for(let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * 540; // centered in 1080/2
        if(i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(1080, 540);
      ctx.stroke();
    } else if (visualizerType === 'particles') {
      const particleCount = Math.floor(bufferLength * density);
      const barWidth = 1080 / particleCount;
      const speedOffset = (Date.now() / 1000 * speed) % bufferLength;
      
      for (let i = 0; i < particleCount; i++) {
        const dataIndex = Math.floor((i + speedOffset) % bufferLength);
        const val = dataArray[dataIndex] || 0;
        if (val > 0) {
          ctx.beginPath();
          ctx.arc(i * barWidth, 1080 - (val / 255) * 500, Math.max(2, (val / 40) * density), 0, 2 * Math.PI, false);
          ctx.fillStyle = visualizerColor;
          ctx.fill();
        }
      }
    } else if (visualizerType === 'circular') {
      const centerX = 1080 / 2;
      const centerY = 1080 / 2;
      const radius = 200;
      
      analyser.getByteFrequencyData(dataArray);
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        const rads = Math.PI * 2 / bufferLength;
        const x = centerX + Math.cos(rads * i) * (radius + val * 0.8);
        const y = centerY + Math.sin(rads * i) * (radius + val * 0.8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = visualizerColor;
      ctx.stroke();

      // inner glowing circle
      const avgVal = dataArray.reduce((acc, curr) => acc + curr, 0) / bufferLength;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + avgVal * 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = visualizerColor.replace('0.8', '0.2').replace('1)', '0.2)'); // make it transparent
      ctx.fill();

    } else if (visualizerType === 'geometric') {
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const size = 100 + avg;
      const t = Date.now() / 1000 * speed;
      ctx.save();
      ctx.translate(1080 / 2, 1080 / 2);
      ctx.rotate(t * 0.5);
      
      for(let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.rect(-size, -size, size * 2, size * 2);
        ctx.strokeStyle = visualizerColor;
        ctx.lineWidth = 4 + avg * 0.05;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Lyrics if enabled
    if (withLyrics && timedLyrics.length > 0) {
      const currentTime = audio.currentTime;
      let currentLine = "";
      for (let i = timedLyrics.length - 1; i >= 0; i--) {
        if (currentTime >= timedLyrics[i].time) {
          currentLine = timedLyrics[i].text;
          break;
        }
      }

      if (currentLine) {
        ctx.font = 'bold 64px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = 1920 - 1080 - 100; // 740px
        const lines = getWrappedLines(ctx, currentLine, maxWidth);
        const lineHeight = 80;
        const totalHeight = lines.length * lineHeight;
        let startY = 1080 / 2 - totalHeight / 2 + lineHeight / 2;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.fillStyle = 'white';

        const centerX = 1080 + (1920 - 1080) / 2;

        for (const line of lines) {
          ctx.strokeText(line, centerX, startY);
          ctx.fillText(line, centerX, startY);
          startY += lineHeight;
        }
      }
    }

    // Update progress
    if (audio.duration) {
      const currentProgress = Math.round((audio.currentTime / audio.duration) * 100);
      if (currentProgress !== lastProgress) {
        lastProgress = currentProgress;
        onProgress(currentProgress);
      }
    }

    if (audio.paused && audio.currentTime >= audio.duration) {
      worker.postMessage('stop');
      return;
    }
  };

  worker.onmessage = () => {
    draw();
  };

  worker.postMessage('start');
  audio.onended = () => { 
    worker.postMessage('stop');
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
    recorder.stop(); 
    audioCtx.close(); 
  };
};
