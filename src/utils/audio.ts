// Efek suara taktil (Web Audio API) + pembacaan teks (TTS dengan fallback server).

class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Gentle tactile button tap click
  playTap() {
    try {
      this.initCtx();
      if (!this.ctx) {
        return;
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        120,
        this.ctx.currentTime + 0.05
      );

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + 0.05
      );

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio not permitted or supported
    }
  }

  // Cheerful correct chime
  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) {
        return;
      }
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) {
          return;
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  // Gentle low tone for incorrect or retry
  playSoftError() {
    try {
      this.initCtx();
      if (!this.ctx) {
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // Card flip whoosh
  playFlip() {
    try {
      this.initCtx();
      if (!this.ctx) {
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }
}

export const soundEffects = new SoundManager();
export type { SpeakOptions } from "../lib/speech";

/**
 * Utilitas pembacaan suara (Text-to-Speech).
 *
 * Implementasinya hidup di `lib/speech.ts` karena kini punya **dua jalur**:
 * Web Speech API perangkat dan fallback server (Gemini TTS) untuk WebView
 * Android/APK yang tidak punya mesin suara. Modul ini hanya menjadi pintu depan
 * yang stabil bagi komponen UI, agar `speakText`/`stopSpeech` tetap satu tempat.
 *
 * Re-export dari satu modul ini disengaja (bukan barrel umum): seluruh UI sudah
 * mengimpor `speakText`/`stopSpeech` dari sini, sehingga memindahkan implementasi
 * ke `lib/speech.ts` tidak memaksa menyentuh setiap komponen.
 */
// biome-ignore lint/performance/noBarrelFile: sengaja — menjaga impor lama komponen tetap valid tanpa mengubah puluhan berkas.
export {
  pickVoice,
  speakSequence,
  speakText,
  stopSpeech,
} from "../lib/speech";
