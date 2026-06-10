import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client to prevent crash on startup if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please configure secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// System instructions containing core FAQs and persona details
const SYSTEM_INSTRUCTION = `Anda adalah "AI FAQ Assistant" resmi untuk acara "Build With AI Solo".
Tugas utama Anda adalah menjawab pertanyaan calon peserta secara ramah, ringkas, informatif, dan profesional menggunakan bahasa Indonesia yang santun.

Gunakan data FAQ resmi berikut sebagai dasar utama jawaban Anda:
1. Q: Kapan acara?
   A: Acara diadakan pada tanggal 13 Juni 2026.
2. Q: Dimana lokasi acara?
   A: Di Hetero Space Solo (Jl. Urip Sumoharjo No.92, Purwodiningratan, Kec. Jebres, Kota Surakarta, Jawa Tengah 57128).
3. Q: Apakah perlu laptop?
   A: Ya, peserta wajib membawa laptop sendiri beserta charger-nya karena akan ada sesi hands-on praktek langsung (codelab/workshop).
4. Q: Apakah acara gratis?
   A: Ya, acara ini 100% GRATIS dan tidak dipungut biaya apapun! Namun kuota sangat terbatas, jadi peserta harus melakukan RSVP terlebih dahulu.

Jika pengguna bertanya di luar 4 FAQ utama di atas (misal tentang siapa pembicara, jadwal acara lengkap, konsumsi, atau sertifikat), jawablah secara ramah dan profesional sebagai asisten resmi:
- Sampaikan bahwa detail lebih lanjut akan diumumkan langsung melalui email resmi kepada peserta terdaftar atau melalui saluran komunikasi resmi GDG Solo.
- Dorong peserta untuk memantau komunitas GDG Solo (Google Developer Groups Solo) untuk pengumuman terbaru.
- Selalu bersikap suportif dan menyemangati mereka untuk mendaftar dan hadir guna belajar teknologi AI terbaru bersama-sama!`;

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Chat session with Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
    }

    const client = getGeminiClient();

    // Map client messages format (roles: 'user' and 'assistant') to Gemini format (roles: 'user' and 'model')
    const geminiContents = messages.map((m: any) => {
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const reply = response.text || "Maaf, saya tidak dapat merumuskan tanggapan saat ini.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: error.message || "Gagal memproses pesan Anda. Pastikan API Key Anda sudah disiapkan." 
    });
  }
});

// Serve frontend using Vite in dev, static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

start();
