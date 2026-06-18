/**
 * Audio Effects Processor using Web Audio API
 *
 * This module enables real-time studio eklentileri (plugins) for playbacks.
 */
import { logFunctionCall } from './logger';

// Cache to prevent duplicate nodes on the same HTMLAudioElement
const effectCache = new Map<HTMLAudioElement, {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  dryGain: GainNode;
  wetGain: GainNode;
  distortion: WaveShaperNode;
  distFilter: BiquadFilterNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  chorusDelay: DelayNode;
  chorusLfo: OscillatorNode;
  chorusLfoGain: GainNode;
  vinylSource: AudioBufferSourceNode;
  vinylFilter: BiquadFilterNode;
  vinylGain: GainNode;
  masterGain: GainNode;
}>();

function makeDistortionCurve(amount = 30) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function createVinylBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4; // 4 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Dusty white noise background
    let noise = (Math.random() * 2 - 1) * 0.02;
    // Periodic dust cracks/clicks
    if (Math.random() < 0.00015) {
      const impulse = (Math.random() * 2 - 1) * 0.8;
      noise += impulse;
    }
    data[i] = noise;
  }
  return buffer;
}

/**
 * Applies or updates Web Audio API effects on an HTMLAudioElement.
 * @param audio The HTMLAudioElement to process.
 * @param activePlugins List of plugin IDs that are currently enabled.
 */
export const applyAudioEffects = (audio: HTMLAudioElement, activePlugins: string[]) => {
  logFunctionCall('applyAudioEffects', { src: audio.src, activePlugins });

  let cache = effectCache.get(audio);

  // Initialize Audio Nodes if not already cached
  if (!cache) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaElementSource(audio);

    // Dry / Wet Paths
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    
    // Master Output
    const masterGain = ctx.createGain();

    // 1. Tube Amp (Saturation + Lowpass warmth)
    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(40);
    distortion.oversample = '4x';
    const distFilter = ctx.createBiquadFilter();
    distFilter.type = 'lowpass';
    distFilter.frequency.value = 1600;

    // 2. Tape Delay (Delay line + feedback loop)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.45;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.4;

    // 3. Vintage Synth (Chorus Detuning via LFO-modulated delay line)
    const chorusDelay = ctx.createDelay(0.1);
    chorusDelay.delayTime.value = 0.015; // 15ms base
    const chorusLfo = ctx.createOscillator();
    chorusLfo.type = 'sine';
    chorusLfo.frequency.value = 1.2; // 1.2Hz modulation
    const chorusLfoGain = ctx.createGain();
    chorusLfoGain.gain.value = 0.003; // 3ms depth

    chorusLfo.connect(chorusLfoGain);
    chorusLfoGain.connect(chorusDelay.delayTime);
    chorusLfo.start();

    // 4. Lo-Fi Vinyl (Procedural noise buffer + bandpass filter)
    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = createVinylBuffer(ctx);
    vinylSource.loop = true;
    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.value = 1000;
    vinylFilter.Q.value = 1.0;
    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.0; // Starts silent

    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(masterGain);
    vinylSource.start();

    // Connect Node Grid
    source.connect(dryGain);
    source.connect(wetGain);

    // Delay loop connection
    wetGain.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay); // loop back
    delay.connect(masterGain);

    // Chorus path
    wetGain.connect(chorusDelay);
    chorusDelay.connect(masterGain);

    // Distortion path
    wetGain.connect(distortion);
    distortion.connect(distFilter);
    distFilter.connect(masterGain);

    // Connect dry directly to output
    dryGain.connect(ctx.destination);
    
    // Connect master to output
    masterGain.connect(ctx.destination);

    cache = {
      ctx,
      source,
      dryGain,
      wetGain,
      distortion,
      distFilter,
      delay,
      delayFeedback,
      chorusDelay,
      chorusLfo,
      chorusLfoGain,
      vinylSource,
      vinylFilter,
      vinylGain,
      masterGain
    };
    effectCache.set(audio, cache);
  }

  // Resume context if suspended (browser security policy)
  if (cache.ctx.state === 'suspended') {
    cache.ctx.resume();
  }

  // Apply eklentileri (plugins) states dynamically
  const hasVintageSynth = activePlugins.includes('vintage-synth');
  const hasTubeAmp = activePlugins.includes('tube-amp');
  const hasLofiVinyl = activePlugins.includes('lofi-vinyl');
  const hasTapeDelay = activePlugins.includes('tape-delay');

  // Dry/Wet scaling
  const isAnyPluginActive = hasVintageSynth || hasTubeAmp || hasLofiVinyl || hasTapeDelay;
  
  cache.dryGain.gain.setValueAtTime(isAnyPluginActive ? 0.4 : 1.0, cache.ctx.currentTime);
  cache.wetGain.gain.setValueAtTime(isAnyPluginActive ? 0.6 : 0.0, cache.ctx.currentTime);

  // 1. Tube Amp Saturation Gain
  cache.distFilter.frequency.setValueAtTime(hasTubeAmp ? 1600 : 20000, cache.ctx.currentTime);
  cache.wetGain.connect(hasTubeAmp ? cache.distortion : cache.masterGain);

  // 2. Tape Delay Feedback Gain
  cache.delayFeedback.gain.setValueAtTime(hasTapeDelay ? 0.45 : 0.0, cache.ctx.currentTime);

  // 3. Vintage Synth Modulation depth
  cache.chorusLfoGain.gain.setValueAtTime(hasVintageSynth ? 0.003 : 0.0, cache.ctx.currentTime);

  // 4. Lo-Fi Vinyl noise volume
  cache.vinylGain.gain.setValueAtTime(hasLofiVinyl ? 0.08 : 0.0, cache.ctx.currentTime);
};
