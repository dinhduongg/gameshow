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
          : `radial-gradient(circle at 15% 15%, rgba(0, 242, 254, 0.16) 0%, transparent 42%), linear-gradient(135deg, ${profile.bgColor} 0%, #071936 55%, ${profile.badgeColor} 100%)`,
      }}
    >
      {profile.backgroundImage && (
        <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
      )}

      {/* Header Câu hỏi & Đồng hồ đếm ngược */}
      <header className="relative z-10 shrink-0 max-w-7xl mx-auto w-full flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-1.5 h-10 rounded-full shrink-0"
            style={{ backgroundColor: profile.accentColor }}
          />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 truncate">
              {profile.contestTitle}
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-xs font-extrabold text-white">
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

        {/* Đồng hồ đếm ngược */}
        <div
          className={`flex items-center gap-4 px-5 py-2 rounded-xl border-2 shrink-0 ${
            phase === "IDLE"
              ? "bg-slate-900/95 border-cyan-400 text-cyan-300"
              : phase === "RUNNING" && timeLeft <= 5
                ? "bg-red-950/95 border-red-400 text-amber-300"
                : phase === "RUNNING"
                  ? "bg-blue-950/95 border-sky-400 text-white"
                  : phase === "TIMEOUT_WAITING"
                    ? "bg-amber-950/95 border-amber-400 text-amber-300"
                    : "bg-emerald-950/95 border-emerald-400 text-emerald-300"
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
          <div className="text-3xl md:text-4xl font-extrabold tabular-nums">
            {String(timeLeft).padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* Khung Câu hỏi & 4 Ô Đáp án (Tức thì, không animation) */}
      <main className="relative z-10 flex-1 min-h-0 max-w-7xl mx-auto w-full flex flex-col justify-center gap-4 py-2">
        <div className="flex justify-center shrink-0">
          <span className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded border bg-slate-950/80 border-cyan-500/40 text-cyan-300">
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

        <div
          className="rounded-2xl px-6 py-5 md:px-10 md:py-7 border-2 flex items-center justify-center min-h-30 md:min-h-36.25"
          style={{
            backgroundColor: profile.questionBg,
            borderColor: profile.accentColor,
          }}
        >
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
                className={`group rounded-xl p-4 md:p-5 text-left flex items-center gap-4 border-2 transition-[border-color,box-shadow,background-color] duration-200 ease-out ${
                  isCorrect
                    ? "bg-emerald-700 border-emerald-300 text-white shadow-[0_0_28px_rgba(16,185,129,0.55)]"
                    : isDimmed
                      ? "opacity-35"
                      : "hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,242,254,0.2)]"
                } ${isLockedDuringCountdown ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={
                  isCorrect
                    ? undefined
                    : {
                        backgroundColor: profile.optionBg,
                        borderColor: profile.accentColor + "75",
                      }
                }
              >
                <span
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center font-black text-xl transition-transform duration-200 group-hover:scale-105"
                  style={
                    isCorrect
                      ? { backgroundColor: "#ffffff", color: "#047857" }
                      : {
                          background: `linear-gradient(135deg, ${profile.accentColor} 0%, ${profile.badgeColor} 100%)`,
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
                  <span className="w-9 h-9 rounded-full bg-white text-emerald-700 inline-flex items-center justify-center font-black shrink-0">
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
          className="h-8 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.97]"
        >
          <span>Trang chủ</span>
        </button>

        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            disabled={currentIndex === 0 || isLockedDuringCountdown}
            onClick={handlePrevQuestion}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.95]"
            title="Câu trước"
          >
            ‹
          </button>

          <button
            disabled={isLockedDuringCountdown}
            onClick={handlePrimaryAction}
            className={`h-8 px-3.5 rounded-lg text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              phase === "IDLE"
                ? "bg-linear-to-r from-cyan-400 to-blue-600"
                : phase === "RUNNING" || phase === "TIMEOUT_WAITING"
                  ? "bg-linear-to-r from-amber-300 to-orange-500"
                  : "bg-linear-to-r from-emerald-400 to-teal-600"
            }`}
          >
            {phase === "IDLE" && "▶ Bắt đầu"}
            {phase === "RUNNING" &&
              (isLockedDuringCountdown
                ? "🔒 Đang đếm giờ..."
                : autoReveal
                  ? "✓ Skip / Chốt đáp án"
                  : "⏸ Skip / Chốt giờ")}
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
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.95]"
            title="Câu tiếp"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => loadQuestion(currentIndex)}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.95]"
            title="Đặt lại câu này (Phím R)"
          >
            ↺
          </button>
          <button
            onClick={onToggleSound}
            className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 text-xs inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.95]"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </footer>
    </section>
  );
}
