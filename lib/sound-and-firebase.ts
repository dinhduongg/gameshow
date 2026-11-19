import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Firestore,
} from "firebase/firestore";
import {
  FirebaseConfigData,
  QuestionItem,
  ThemeProfile,
} from "./types-and-data";

// ============================================================================
// 1. BỘ TỔNG HỢP ÂM THANH HỘI TRƯỜNG (WEB AUDIO API)
// ============================================================================
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(820, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      320,
      this.ctx.currentTime + 0.055,
    );
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playUrgentTick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    [0, 0.13].forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(
        idx === 0 ? 980 : 1240,
        this.ctx.currentTime + offset,
      );
      gain.gain.setValueAtTime(0.32, this.ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + offset + 0.09,
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + offset);
      osc.stop(this.ctx.currentTime + offset + 0.1);
    });
  }

  playTimeoutBuzzer() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    [0, 0.22].forEach((offset, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(
        i === 0 ? 440 : 330,
        this.ctx.currentTime + offset,
      );
      gain.gain.setValueAtTime(0.24, this.ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + offset + 0.2,
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + offset);
      osc.stop(this.ctx.currentTime + offset + 0.22);
    });
  }

  playRevealSuccess() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const start = this.ctx.currentTime + i * 0.055;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  }
}

export const soundEngine = new SoundSynthesizer();

// ============================================================================
// 2. KẾT NỐI FIREBASE FIRESTORE LƯU TRỮ DỮ LIỆU BAN TỔ CHỨC
// ============================================================================
let cachedDb: Firestore | null = null;

export function getFirebaseFirestore(
  cfg: FirebaseConfigData,
): Firestore | null {
  if (!cfg.apiKey || !cfg.projectId) return null;
  try {
    let app: FirebaseApp;
    if (getApps().length === 0) {
      app = initializeApp(cfg);
    } else {
      app = getApp();
    }
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (error) {
    console.error("Firebase init error:", error);
    return null;
  }
}

export async function pushStageDataToCloud(
  cfg: FirebaseConfigData,
  eventCode: string,
  payload: { questions: QuestionItem[]; activeProfile: ThemeProfile },
) {
  const db = cachedDb || getFirebaseFirestore(cfg);
  if (!db) throw new Error("Chưa cấu hình hoặc kết nối được Firebase");
  const docRef = doc(db, "gameshow_events", eventCode.trim().toUpperCase());
  await setDoc(docRef, {
    questions: payload.questions,
    activeProfile: payload.activeProfile,
    updatedAt: Date.now(),
  });
}

export async function pullStageDataFromCloud(
  cfg: FirebaseConfigData,
  eventCode: string,
): Promise<{
  questions?: QuestionItem[];
  activeProfile?: ThemeProfile;
} | null> {
  const db = cachedDb || getFirebaseFirestore(cfg);
  if (!db) throw new Error("Chưa cấu hình hoặc kết nối được Firebase");
  const docRef = doc(db, "gameshow_events", eventCode.trim().toUpperCase());
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as {
    questions?: QuestionItem[];
    activeProfile?: ThemeProfile;
  };
}
