"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QuestionItem, ThemeProfile } from "@/lib/types-and-data";
import { soundEngine } from "@/lib/sound-and-firebase";

interface QuizStageProps {
  profile: ThemeProfile;
  deckName: string;
  questions: QuestionItem[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCompleteDeck: (deckName: string) => void;
  onExitHome: () => void;
}

export default function QuizStage({
  profile,
  deckName,
  questions,
  soundEnabled,
  onToggleSound,
  onCompleteDeck,
  onExitHome,
}: QuizStageProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<
    "IDLE" | "RUNNING" | "TIMEOUT_WAITING" | "REVEALED"
  >("IDLE");
  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(5, Number(profile.defaultTimer) || 15),
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];
  const allowSkip = profile.allowSkipDuringCountdown !== false;
  const autoReveal = profile.autoRevealOnTimeout !== false;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revealAnswer = useCallback(() => {
    stopTimer();
    setPhase("REVEALED");
    soundEngine.playRevealSuccess();
  }, [stopTimer]);

  const enterTimeoutWaiting = useCallback(() => {
    stopTimer();
    setPhase("TIMEOUT_WAITING");
    soundEngine.playTimeoutBuzzer();
  }, [stopTimer]);

  const loadQuestion = useCallback(
    (idx: number) => {
      stopTimer();
      setCurrentIndex(idx);
      setPhase("IDLE");
      setTimeLeft(Math.max(5, Number(profile.defaultTimer) || 15));
    },
    [stopTimer, profile.defaultTimer],
  );

  const startCountdown = useCallback(() => {
    if (phase === "RUNNING") return;
    setPhase("RUNNING");
    soundEngine.playTick();

    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next > 5) {
          soundEngine.playTick();
        } else if (next > 0 && next <= 5) {
          soundEngine.playUrgentTick();
        } else if (next <= 0) {
          if (autoReveal) {
            setTimeout(() => revealAnswer(), 0);
          } else {
            setTimeout(() => enterTimeoutWaiting(), 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [phase, stopTimer, autoReveal, revealAnswer, enterTimeoutWaiting]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      loadQuestion(currentIndex + 1);
    } else {
      onCompleteDeck(deckName);
    }
  }, [currentIndex, questions.length, loadQuestion, onCompleteDeck, deckName]);

  const handlePrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      loadQuestion(currentIndex - 1);
    }
  }, [currentIndex, loadQuestion]);

  // Luồng điều khiển thông minh cho nút chính & Remote PowerPoint
  const handlePrimaryAction = useCallback(() => {
    if (phase === "IDLE") {
      startCountdown();
    } else if (phase === "RUNNING") {
      // Kiểm tra cấu hình: Cho phép Skip hay Khóa nút Next khi đang đếm ngược
      if (!allowSkip) return;
      if (autoReveal) {
        revealAnswer();
      } else {
        enterTimeoutWaiting();
      }
    } else if (phase === "TIMEOUT_WAITING") {
      revealAnswer();
    } else if (phase === "REVEALED") {
      handleNextQuestion();
    }
  }, [
    phase,
    allowSkip,
    autoReveal,
    startCountdown,
    revealAnswer,
    enterTimeoutWaiting,
    handleNextQuestion,
  ]);

  // Lắng nghe phím tắt & Bút trình chiếu PowerPoint (Remote)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["PageDown", "ArrowRight", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        handlePrimaryAction();
      } else if (["PageUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        if (phase === "RUNNING" && !allowSkip) return;
        handlePrevQuestion();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        loadQuestion(currentIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        stopTimer();
        onExitHome();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handlePrimaryAction,
    handlePrevQuestion,
    loadQuestion,
    currentIndex,
    phase,
    allowSkip,
    stopTimer,
    onExitHome,
  ]);

  if (!currentQ) return null;

  const isLockedDuringCountdown = phase === "RUNNING" && !allowSkip;

  return (
    <section
      className="relative h-screen w-screen flex flex-col justify-between px-5 py-4 md:px-10 md:py-5 overflow-hidden select-none"
      style={{
        background: profile.backgroundImage
          ? `url('${profile.backgroundImage}') center/cover no-repeat`
          : `radial-gradient(circle at 15% 15%, rgba(0, 242, 254, 0.18) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%), radial-gradient(circle at 50% 88%, rgba(14, 165, 233, 0.24) 0%, transparent 50%), linear-gradient(135deg, ${profile.bgColor} 0%, #071936 50%, ${profile.badgeColor} 100%)`,
      }}
    >
      {/* Lưới kỹ thuật số nền màn hình thi */}
      {!profile.backgroundImage ? (
        <div
          className="absolute inset-0 pointer-events-none opacity-75"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 242, 254, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 254, 0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
      )}

      {/* Header Câu hỏi & Đồng hồ đếm ngược HUD */}
      <header className="relative z-10 shrink-0 max-w-7xl mx-auto w-full flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-1.5 h-10 rounded-full shrink-0 shadow-[0_0_12px_#00f2fe]"
            style={{ backgroundColor: profile.accentColor }}
          />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300/90 truncate">
              {profile.contestTitle}
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-xs font-extrabold text-white tracking-wide">
                {deckName.toUpperCase()}
              </span>
              <span className="text-sm font-bold text-slate-200">
                Câu{" "}
                <span
                  className="font-black text-base"
                  style={{ color: profile.accentColor }}
                >
                  {String(currentIndex + 1).padStart(2, "0")}
                </span>{" "}
                / {String(questions.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Đồng hồ đếm ngược HUD phát sáng */}
        <div
          className={`flex items-center gap-4 px-5 py-2 rounded-xl border-2 shrink-0 ${
            phase === "IDLE"
              ? "bg-slate-900/95 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              : phase === "RUNNING" && timeLeft <= 5
                ? "bg-red-950/95 border-red-400 text-amber-300 shadow-[0_0_28px_rgba(239,68,68,0.6)]"
                : phase === "RUNNING"
                  ? "bg-blue-950/95 border-sky-400 text-white shadow-[0_0_25px_rgba(56,189,248,0.45)]"
                  : phase === "TIMEOUT_WAITING"
                    ? "bg-amber-950/95 border-amber-400 text-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.55)]"
                    : "bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
          }`}
        >
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest font-extrabold">
              {phase === "IDLE" && "CHỜ BẮT ĐẦU"}
              {phase === "RUNNING" &&
                (timeLeft <= 5 ? "SẮP HẾT GIỜ" : "ĐANG TÍNH GIỜ")}
              {phase === "TIMEOUT_WAITING" && "HẾT GIỜ • CHỜ MỞ"}
              {phase === "REVEALED" && "ĐÃ MỞ ĐÁP ÁN"}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              GIÂY ĐẾM NGƯỢC
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight">
            {String(timeLeft).padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* Khung Câu hỏi HUD (có 4 góc định vị Sci-Fi) & 4 Ô Đáp án */}
      <main className="relative z-10 flex-1 min-h-0 max-w-7xl mx-auto w-full flex flex-col justify-center gap-4 md:gap-5 py-2">
        <div className="flex justify-center shrink-0">
          <span
            className={`text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded border ${
              phase === "REVEALED"
                ? "text-emerald-300 bg-emerald-950/90 border-emerald-400"
                : phase === "TIMEOUT_WAITING"
                  ? "text-amber-300 bg-amber-950/90 border-amber-400"
                  : phase === "RUNNING"
                    ? "text-amber-300 bg-slate-950/80 border-amber-400/50"
                    : "text-cyan-300 bg-slate-950/75 border-cyan-500/40"
            }`}
          >
            {phase === "IDLE" && "Đang chờ MC đọc đề"}
            {phase === "RUNNING" &&
              (isLockedDuringCountdown
                ? "Đang tính giờ (Đã khóa Skip đến hết giờ)"
                : "Đang tính thời gian suy nghĩ...")}
            {phase === "TIMEOUT_WAITING" &&
              "ĐÃ HẾT GIỜ! CHỜ MC / ĐIỀU KHIỂN ẤN NÚT ĐỂ MỞ ĐÁP ÁN"}
            {phase === "REVEALED" &&
              `ĐÁP ÁN CHÍNH XÁC: PHƯƠNG ÁN ${currentQ.answer}`}
          </span>
        </div>

        {/* Khung Câu hỏi HUD 4 góc định vị */}
        <div
          className="relative rounded-2xl px-6 py-5 md:px-10 md:py-7 border-[1.5px] flex items-center justify-center min-h-30 md:min-h-36.25"
          style={{
            backgroundColor: profile.questionBg,
            borderColor: profile.accentColor,
            boxShadow:
              "0 0 32px rgba(0, 242, 254, 0.16), inset 0 0 24px rgba(0, 242, 254, 0.08)",
          }}
        >
          {/* 4 góc định vị HUD */}
          <span
            className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-[3px] border-l-[3px] rounded-tl-lg pointer-events-none"
            style={{ borderColor: profile.accentColor }}
          />
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-[3px] border-r-[3px] rounded-tr-lg pointer-events-none"
            style={{ borderColor: profile.accentColor }}
          />
          <span
            className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-[3px] border-l-[3px] rounded-bl-lg pointer-events-none"
            style={{ borderColor: profile.accentColor }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-[3px] border-r-[3px] rounded-br-lg pointer-events-none"
            style={{ borderColor: profile.accentColor }}
          />

          <h2
            className="text-center font-bold leading-snug"
            style={{
              fontFamily: profile.questionFont,
              fontSize: `clamp(20px, 2.5vw, ${profile.questionSize}px)`,
              color: profile.questionColor,
            }}
          >
            {currentQ.question}
          </h2>
        </div>

        {/* Lưới 4 phương án A, B, C, D */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const isRevealed = phase === "REVEALED";
            const isCorrect = isRevealed && currentQ.answer === letter;
            const isDimmed = isRevealed && currentQ.answer !== letter;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (isLockedDuringCountdown) return;
                  if (phase !== "REVEALED") revealAnswer();
                }}
                className={`rounded-xl p-4 md:p-5 text-left flex items-center gap-4 border-[1.5px] ${
                  isCorrect
                    ? "border-2 border-emerald-400 text-white shadow-[0_0_32px_rgba(16,185,129,0.55)]"
                    : isDimmed
                      ? "opacity-35 grayscale-35"
                      : "shadow-[0_8px_24px_rgba(2,6,23,0.55)] hover:border-cyan-300"
                } ${isLockedDuringCountdown ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={
                  isCorrect
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(4, 92, 66, 0.96), rgba(5, 130, 92, 0.98))",
                      }
                    : {
                        backgroundColor: profile.optionBg,
                        borderColor: profile.accentColor + "70",
                      }
                }
              >
                <span
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center font-black text-xl"
                  style={
                    isCorrect
                      ? {
                          backgroundColor: "#ffffff",
                          color: "#047857",
                          boxShadow: "0 0 14px rgba(255, 255, 255, 0.8)",
                        }
                      : {
                          background: `linear-gradient(135deg, ${profile.accentColor} 0%, ${profile.badgeColor} 100%)`,
                          boxShadow: "0 0 16px rgba(0, 242, 254, 0.35)",
                          color: "#020617",
                        }
                  }
                >
                  {letter}
                </span>

                <span
                  className="flex-1 font-semibold leading-snug"
                  style={{
                    fontFamily: profile.optionFont,
                    fontSize: `clamp(16px, 1.8vw, ${profile.optionSize}px)`,
                    color: isCorrect ? "#ffffff" : profile.optionColor,
                  }}
                >
                  {currentQ[`opt${letter}` as keyof QuestionItem]}
                </span>

                {isCorrect && (
                  <span className="w-9 h-9 rounded-full bg-white text-emerald-700 inline-flex items-center justify-center font-black shrink-0 shadow">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Thanh điều khiển tối giản 1 hàng ngang duy nhất */}
      <footer className="relative z-10 shrink-0 max-w-7xl mx-auto w-full flex items-center justify-between gap-2 pt-2 border-t border-cyan-500/20 flex-nowrap">
        <button
          onClick={() => {
            stopTimer();
            onExitHome();
          }}
          className="h-8 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <span>Trang chủ</span>
        </button>

        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            disabled={currentIndex === 0 || isLockedDuringCountdown}
            onClick={handlePrevQuestion}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title="Câu trước"
          >
            ‹
          </button>

          <button
            disabled={isLockedDuringCountdown}
            onClick={handlePrimaryAction}
            className={`h-8 px-3.5 rounded-lg text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              phase === "IDLE"
                ? "bg-linear-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 shadow-[0_0_12px_rgba(0,242,254,0.3)]"
                : phase === "RUNNING" || phase === "TIMEOUT_WAITING"
                  ? "bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_14px_rgba(245,158,11,0.4)]"
                  : "bg-linear-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            }`}
          >
            {phase === "IDLE" && "▶ Bắt đầu"}
            {phase === "RUNNING" &&
              (isLockedDuringCountdown
                ? "🔒 Đang đếm giờ..."
                : autoReveal
                  ? "✓ Chốt đáp án"
                  : "⏸ Chốt giờ")}
            {phase === "TIMEOUT_WAITING" && "★ Hiện đáp án"}
            {phase === "REVEALED" &&
              (currentIndex >= questions.length - 1
                ? "⚑ Hoàn thành"
                : "Câu tiếp ›")}
          </button>

          <button
            disabled={
              currentIndex >= questions.length - 1 || isLockedDuringCountdown
            }
            onClick={handleNextQuestion}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title="Câu tiếp"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => loadQuestion(currentIndex)}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title="Đặt lại câu này (Phím R)"
          >
            ↺
          </button>
          <button
            onClick={onToggleSound}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </footer>
    </section>
  );
}
