import MidiWriter from 'midi-writer-js';

export const handleDownloadMidi = (title: string | null = 'Lunara') => {
  const track1 = new MidiWriter.Track();
  const track2 = new MidiWriter.Track();

  track1.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 1})); // Piano
  track2.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 34})); // Bass

  // generate a basic C-Am-F-G chord progression and bass
  const chords = [
    ['C4', 'E4', 'G4'], // C
    ['A3', 'C4', 'E4'], // Am
    ['F3', 'A3', 'C4'], // F
    ['G3', 'B3', 'D4']  // G
  ];
  
  const bassNotes = ['C2', 'A1', 'F1', 'G1'];

  // 4 bars of progression
  for (let i = 0; i < 4; i++) {
    for (let c = 0; c < chords.length; c++) {
      // chords
      track1.addEvent(new MidiWriter.NoteEvent({pitch: chords[c], duration: '1'}));
      
      // bass
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
      track2.addEvent(new MidiWriter.NoteEvent({pitch: [bassNotes[c]], duration: '8'}));
    }
  }

  const writer = new MidiWriter.Writer([track1, track2]);
  const base64 = writer.base64();
  
  const url = `data:audio/midi;base64,${base64}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title || 'Lunara_Data'}.mid`;
  link.click();
};

