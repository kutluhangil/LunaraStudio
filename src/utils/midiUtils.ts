export const generateMockMidiBase64 = (): string => {
  // A minimal valid MIDI file in base64 (one track, no events, just headers)
  return "TVRoZAAAAAYAAAABAAEA/01UcmtzAAAADv8vMgD/WAQEAhgIAP9/AA==";
};

export const handleDownloadMidi = (title: string | null) => {
  const base64 = generateMockMidiBase64();
  const url = `data:audio/midi;base64,${base64}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title || 'Lunara'}.mid`;
  link.click();
};
