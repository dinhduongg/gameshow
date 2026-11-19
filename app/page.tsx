"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_PROFILE,
  ENV_FIREBASE_CONFIG,
  FirebaseConfigData,
  QuestionItem,
  SAMPLE_QUESTIONS,
  STORAGE_KEYS,
  ThemeProfile,
} from "@/lib/types-and-data";
import {
  getFirebaseFirestore,
  pullStageDataFromCloud,
  pushStageDataToCloud,
  soundEngine,
} from "@/lib/sound-and-firebase";
import HomeLobby from "@/components/HomeLobby";
import QuizStage from "@/components/QuizStage";
import AdminPanel from "@/components/AdminPanel";

export default function StageGameshowApp() {
  const [view, setView] = useState<"home" | "quiz" | "admin">("home");
  const [questions, setQuestions] = useState<QuestionItem[]>(SAMPLE_QUESTIONS);
  const [profiles, setProfiles] = useState<ThemeProfile[]>([DEFAULT_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState<string>(
    DEFAULT_PROFILE.id,
  );
  const [completedDecks, setCompletedDecks] = useState<string[]>([]);
  const [activeDeckName, setActiveDeckName] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Bảo mật mã PIN Admin (Mặc định: 1234)
  const [adminPin, setAdminPin] = useState<string>("1234");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");

  // Firebase Cloud
  const [fbConfig, setFbConfig] =
    useState<FirebaseConfigData>(ENV_FIREBASE_CONFIG);
  const [fbConnected, setFbConnected] = useState<boolean>(false);
  const [eventCode, setEventCode] = useState<string>("GIADINHSO2026");

  // Toast thông báo
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: "success" | "error" | "info" }[]
  >([]);

  const notify = useCallback(
    (msg: string, type: "success" | "error" | "info" = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3000,
      );
    },
    [],
  );

  // Khôi phục dữ liệu từ LocalStorage khi mở trang
  useEffect(() => {
    try {
      const savedQ = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (savedQ) setQuestions(JSON.parse(savedQ));

      const savedP = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedP) setProfiles(JSON.parse(savedP));

      const savedActiveId = localStorage.getItem(
        STORAGE_KEYS.ACTIVE_PROFILE_ID,
      );
      if (savedActiveId) setActiveProfileId(savedActiveId);

      const savedDone = localStorage.getItem(STORAGE_KEYS.COMPLETED_DECKS);
      if (savedDone) setCompletedDecks(JSON.parse(savedDone));

      const savedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
      if (savedPin !== null) setAdminPin(savedPin);

      const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      if (savedSound !== null) {
        const enabled = savedSound === "true";
        setSoundEnabled(enabled);
        soundEngine.enabled = enabled;
      }

      const savedEvent = localStorage.getItem(STORAGE_KEYS.EVENT_CODE);
      if (savedEvent) setEventCode(savedEvent);

      const savedFb = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      if (savedFb) {
        const parsedFb = JSON.parse(savedFb);
        if (parsedFb.apiKey && parsedFb.projectId) setFbConfig(parsedFb);
      }
    } catch (e) {
      console.warn("LocalStorage read warning:", e);
    }
  }, []);

  // Kiểm tra kết nối Firebase mỗi khi config thay đổi
  useEffect(() => {
    if (fbConfig.apiKey && fbConfig.projectId) {
      const db = getFirebaseFirestore(fbConfig);
      setFbConnected(Boolean(db));
    } else {
      setFbConnected(false);
    }
  }, [fbConfig]);

  const activeProfile: ThemeProfile = {
    ...DEFAULT_PROFILE,
    ...(profiles.find((p) => p.id === activeProfileId) || profiles[0]),
  };

  const groupedDecks = questions.reduce(
    (acc, q) => {
      const key = (q.deck || "Bộ đề chung").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    },
    {} as Record<string, QuestionItem[]>,
  );

  const openAdmin = useCallback(() => {
    if (!adminPin || isAdminUnlocked) {
      setView("admin");
      return;
    }
    setPinInput("");
    setShowPinModal(true);
  }, [adminPin, isAdminUnlocked]);

  // Phím tắt Ctrl + M mở nhanh trang Quản trị
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (view === "admin") setView("home");
        else openAdmin();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, openAdmin]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Thông báo Toast */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg border text-xs font-bold shadow-xl ${
              t.type === "success"
                ? "bg-emerald-900 border-emerald-500 text-white"
                : t.type === "error"
                  ? "bg-red-900 border-red-500 text-white"
                  : "bg-slate-800 border-cyan-500 text-cyan-200"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* Modal nhập mã PIN Admin */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput === adminPin) {
                setIsAdminUnlocked(true);
                setShowPinModal(false);
                setView("admin");
                notify("Đã mở khóa trang Quản trị!", "success");
              } else {
                notify("Mã PIN không chính xác!", "error");
                setPinInput("");
              }
            }}
            className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
                BẢO MẬT QUẢN TRỊ
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Nhập mã PIN Ban tổ chức
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mã PIN mặc định ban đầu: <b>1234</b>
              </p>
            </div>
            <input
              type="password"
              autoFocus
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-center text-xl font-black tracking-[0.4em] text-cyan-300 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-linear-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-extrabold"
              >
                Mở khóa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MÀN HÌNH 1: SẢNH CHỜ */}
      {view === "home" && (
        <HomeLobby
          profile={activeProfile}
          groupedDecks={groupedDecks}
          completedDecks={completedDecks}
          fbConnected={fbConnected}
          fbProjectId={fbConfig.projectId}
          eventCode={eventCode}
          onStartDeck={(deckName) => {
            setActiveDeckName(deckName);
            setView("quiz");
          }}
          onUnlockAllDecks={() => {
            setCompletedDecks([]);
            localStorage.setItem(
              STORAGE_KEYS.COMPLETED_DECKS,
              JSON.stringify([]),
            );
            notify("Đã mở khóa lại toàn bộ các bộ đề!", "success");
          }}
          onOpenAdmin={openAdmin}
        />
      )}

      {/* MÀN HÌNH 2: TRÌNH CHIẾU CÂU HỎI SÂN KHẤU */}
      {view === "quiz" && (
        <QuizStage
          profile={activeProfile}
          deckName={activeDeckName}
          questions={groupedDecks[activeDeckName] || []}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundEngine.enabled = next;
            localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(next));
            if (next) soundEngine.playTick();
          }}
          onCompleteDeck={(deckName) => {
            if (!completedDecks.includes(deckName)) {
              const next = [...completedDecks, deckName];
              setCompletedDecks(next);
              localStorage.setItem(
                STORAGE_KEYS.COMPLETED_DECKS,
                JSON.stringify(next),
              );
            }
            notify(`Đã hoàn thành và khóa "${deckName}"!`, "success");
            setView("home");
          }}
          onExitHome={() => setView("home")}
        />
      )}

      {/* MÀN HÌNH 3: QUẢN TRỊ ADMIN */}
      {view === "admin" && (
        <AdminPanel
          questions={questions}
          onUpdateQuestions={(nextQ, resetDone) => {
            setQuestions(nextQ);
            localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(nextQ));
            if (resetDone) {
              setCompletedDecks([]);
              localStorage.setItem(
                STORAGE_KEYS.COMPLETED_DECKS,
                JSON.stringify([]),
              );
            }
          }}
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={(id) => {
            setActiveProfileId(id);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
          }}
          onUpdateActiveProfile={(patch) => {
            setProfiles((prev) => {
              const next = prev.map((p) =>
                p.id === activeProfile.id ? { ...p, ...patch } : p,
              );
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(next));
              return next;
            });
          }}
          onSaveNewProfile={(name) => {
            const cloned: ThemeProfile = {
              ...activeProfile,
              id: "profile_" + Date.now(),
              name,
            };
            const next = [...profiles, cloned];
            setProfiles(next);
            setActiveProfileId(cloned.id);
            localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(next));
            localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, cloned.id);
            notify(`Đã lưu hồ sơ "${name}"!`, "success");
          }}
          onDeleteCurrentProfile={() => {
            const next = profiles.filter((p) => p.id !== activeProfile.id);
            setProfiles(next);
            setActiveProfileId(next[0].id);
            localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(next));
            notify("Đã xóa hồ sơ giao diện!", "info");
          }}
          completedDecks={completedDecks}
          onUnlockAllDecks={() => {
            setCompletedDecks([]);
            localStorage.setItem(
              STORAGE_KEYS.COMPLETED_DECKS,
              JSON.stringify([]),
            );
            notify("Đã mở khóa lại toàn bộ bộ đề!", "success");
          }}
          fbConfig={fbConfig}
          onUpdateFbConfig={(cfg) => {
            setFbConfig(cfg);
            localStorage.setItem(
              STORAGE_KEYS.FIREBASE_CONFIG,
              JSON.stringify(cfg),
            );
          }}
          fbConnected={fbConnected}
          eventCode={eventCode}
          onUpdateEventCode={(code) => {
            setEventCode(code);
            localStorage.setItem(STORAGE_KEYS.EVENT_CODE, code);
          }}
          onPushCloud={async () => {
            try {
              await pushStageDataToCloud(fbConfig, eventCode, {
                questions,
                activeProfile,
              });
              notify(
                "Đã đẩy toàn bộ Bộ đề & Giao diện lên Firebase Cloud!",
                "success",
              );
            } catch (e: unknown) {
              notify((e as Error)?.message || "Lỗi đồng bộ Cloud!", "error");
            }
          }}
          onPullCloud={async () => {
            try {
              const data = await pullStageDataFromCloud(fbConfig, eventCode);
              if (!data) {
                notify(
                  "Chưa tìm thấy dữ liệu của mã sự kiện này trên Cloud!",
                  "info",
                );
                return;
              }
              if (data.questions) {
                setQuestions(data.questions);
                localStorage.setItem(
                  STORAGE_KEYS.QUESTIONS,
                  JSON.stringify(data.questions),
                );
              }
              if (data.activeProfile) {
                setProfiles((prev) => {
                  const next = prev.map((p) =>
                    p.id === activeProfile.id
                      ? { ...p, ...data.activeProfile }
                      : p,
                  );
                  localStorage.setItem(
                    STORAGE_KEYS.PROFILES,
                    JSON.stringify(next),
                  );
                  return next;
                });
              }
              notify(
                "Đã tải bộ đề & giao diện từ Firebase Cloud về máy!",
                "success",
              );
            } catch (e: unknown) {
              notify(
                (e as Error)?.message || "Lỗi tải dữ liệu từ Cloud!",
                "error",
              );
            }
          }}
          adminPin={adminPin}
          onUpdateAdminPin={(pin) => {
            setAdminPin(pin);
            localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
          }}
          onNotify={notify}
          onReturnHome={() => setView("home")}
        />
      )}
    </main>
  );
}
