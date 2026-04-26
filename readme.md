<div align="center">

<br />

<img src="https://img.shields.io/badge/Lunara-v1.0-000000?style=for-the-badge&logoColor=white" alt="version" />
<img src="https://img.shields.io/badge/Built_with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
<img src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
<img src="https://img.shields.io/badge/TailwindCSS-v3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="tailwind" />
<img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="vite" />
<img src="https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="gemini" />

<br /><br />

```text
 ██╗     ██╗   ██╗███╗   ██╗█████╗ ██████╗  █████╗ 
 ██║     ██║   ██║████╗  ██║██╔══╝ ██╔══██╗██╔══██╗
 ██║     ██║   ██║██╔██╗ ██║██████╗██████╔╝███████║
 ██║     ██║   ██║██║╚██╗██║██╔═══╝██╔══██╗██╔══██║
 ███████╗╚██████╔╝██║ ╚████║██║    ██║  ██║██║  ██║
 ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝
```

### **One Interface. Infinite Melodies.** — Craft precise music prompts, generate, and visualize.

[Live App](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## ✦ What is Lunara?

**Lunara** is an advanced AI Music Prompt Builder & Visualization platform. Writing the perfect prompt for AI music generators can be a chaotic process of trial and error. Lunara steps in to provide a structured, inspiring, and seamless workflow.

Stop tracking your prompt ideas in messy text files. With Lunara, you can build dynamic song directives, get AI-powered prompt suggestions, maintain a history of your ideas, queue up tracks, and export generated songs as stunning videos with custom visualizers. 

---

<details>
<summary><strong>🇹🇷 Türkçe Açıklama</strong></summary>

<br />

**Lunara**, yapay zeka destekli müzik üretim sürecinizi kolaylaştıran gelişmiş bir prompt oluşturucu ve görselleştirme platformudur. Yapay zeka müzik üreticileri için (Suno, Udio vb.) mükemmel promptu yazmak genellikle deneme yanılmalarla dolu karmaşık bir süreçtir; Lunara bu noktada devreye girerek yapılandırılmış ve kusursuz bir iş akışı sunar.

Prompt fikirlerinizi not defterlerinde saklamayı bırakın. Lunara ile dinamik şarkı yönergeleri oluşturabilir, Gemini AI destekli prompt önerileri alabilir, geçmiş fikirlerinizi geri alıp/yineleyebilir (undo/redo), şarkılarınızı sıraya ekleyebilir ve ürettiğiniz müzikleri dalga formları (waveform) veya parçacık (particle) efektleriyle özelleştirilmiş videolar olarak dışa aktarabilirsiniz.

</details>

---

## ⚡ Features

| Feature | Description |
|---------|-------------|
| 🎛️ **Prompt Builder** | Structured section builder for moods, genres, themes, BPM, and Scales. |
| 🤖 **AI Suggestions** | Gemini-powered intelligent prompt suggestions based on your selected attributes. |
| 🎥 **Video Export** | Render audio as standard WebM videos with customizable Waveform, Bars, and Particle visualizers. |
| 🕰️ **History & Auto-save** | Undo/Redo capabilities for prompts. Never lose your creative sparks with local auto-save. |
| 🎵 **Queue System** | Add your generated tracks to a queue and let them play back seamlessly. |
| 🎹 **MIDI Support** | Extract and download Mock MIDI files directly from the app interface. |
| 🖼️ **Image Integration** | Upload reference images as part of your prompt and visualizer context. |
| ⚡ **Responsive UI** | Beautiful, modern "Glassmorphism" interface optimized for speed and creative flow. |

---

## 🖼️ Screenshots

> *(Coming soon — High-quality mockups of the Lunara interface)*

---

## 🛠️ Tech Stack

```
Frontend        →  React 18 · TypeScript (strict) · Vite
Styling         →  Tailwind CSS v3 · Lucide React (Icons)
AI Integration  →  Google Gemini API (@google/genai)
Canvas API      →  Real-time audio visualization (Bars, Waveform, Particles)
Storage         →  Local Storage (Auto-save, prompt history)
Code Quality    →  ESLint
```

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                          LUNARA CLIENT                         │
│                                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐│
│  │ Prompt Engine │  │ Queue System  │  │ Audio/Video Render  ││
│  │ (History/Sync)│  │ (State Mngt)  │  │ (Canvas API)        ││
│  └───────────────┘  └───────────────┘  └─────────────────────┘│
└───────────────────────────┬────────────────────────────────────┘
                            │ (Client-side API requests)
         ┌──────────────────┼──────────────────┐
         │                                     │
┌────────────────┐                     ┌───────────────┐
│ Google Gemini  │                     │ Local Storage │
│ (AI Prompts &  │                     │ (Auto-save &  │
│  Suggestions)  │                     │  User History)│
└────────────────┘                     └───────────────┘
```

---

## 📐 Project Structure

```text
Lunara/
├── src/
│   ├── components/
│   │   ├── PromptBuilder.tsx      # Main interface for structuring prompts
│   │   ├── ...
│   ├── services/
│   │   └── genaiService.ts        # Gemini API integration for AI suggestions
│   ├── utils/
│   │   ├── audioUtils.ts          # Audio decoding and formatting
│   │   ├── videoUtils.ts          # Canvas rendering and MediaRecorder logic
│   │   ├── midiUtils.ts           # Mock MIDI generation
│   │   └── helpers.ts             # Generic utilities
│   ├── App.tsx                    # Main application state and layout
│   ├── index.css                  # Tailwind imports and base styles
│   ├── main.tsx                   # React root entry point
│   └── constants.tsx              # Icons, tooltips, configuration dictionaries
├── index.html                     # Vite entry HTML
├── package.json                   # Dependencies & Scripts
├── tailwind.config.js             # Tailwind configuration
├── vite.config.ts                 # Vite bundler configuration
└── .env.example                   # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- Google Gemini API Key

### Local Development

```bash
# Clone the repository
git clone https://github.com/kutluhangil/Lunara.git
cd Lunara

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Gemini API key:
# VITE_GEMINI_API_KEY=your_api_key_here

# Start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `VITE_GEMINI_API_KEY` | Google Gemini API Key for prompt suggestions | ✓ |

---

## 🔒 Data & Privacy

All user prompts and generated history are stored **locally** on your device using `localStorage`. Lunara only sends data to the Google Gemini API when you explicitly request an "AI Prompt Suggestion". 

---

## 🐳 Docker Deployment

*(Not strictly required as Lunara is a client-side SPA, but can be served via Nginx)*

```bash
# Build the Vite Application
npm run build

# You can serve the /dist folder using any basic web server (e.g. Nginx, Caddy, Python http.server)
```

---

## 🗺️ Roadmap

- [x] Phase 1 — Core Prompt Builder with structured categories
- [x] Phase 2 — Video Export with audio visualization 
- [x] Phase 3 — Undo/Redo History & Auto-saving
- [x] Phase 4 — Gemini AI Prompt Suggestions
- [x] Phase 5 — Embedded Queue and Music Player
- [ ] Phase 6 — Integration with true AI Music endpoints (Suno/Udio API wrappers)
- [ ] Phase 7 — User Accounts (Supabase Auth) to sync prompts across devices
- [ ] Phase 8 — Advanced Multi-track MIDI export

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

Built with precision by [kutluhangil](https://github.com/kutluhangil)

<br />

**[lunara.app](#)**

<br />

*If you find this useful, consider giving it a ⭐*

</div>
