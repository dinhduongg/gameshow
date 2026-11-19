"use client";

import { QuestionItem, ThemeProfile } from "@/lib/types-and-data";

interface HomeLobbyProps {
  profile: ThemeProfile;
  groupedDecks: Record<string, QuestionItem[]>;
  completedDecks: string[];
  fbConnected: boolean;
  fbProjectId?: string;
  eventCode: string;
  onStartDeck: (deckName: string) => void;
  onUnlockAllDecks: () => void;
  onOpenAdmin: () => void;
}

function computeOptimalDeckGrid(count: number) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count === 3) return { cols: 3, rows: 1 };
  if (count === 4) return { cols: 4, rows: 1 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 8) return { cols: 4, rows: 2 };
  if (count <= 12) return { cols: 4, rows: 3 };
  if (count <= 15) return { cols: 5, rows: 3 };
  if (count <= 20) return { cols: 5, rows: 4 };
  const cols = Math.ceil(Math.sqrt(count * 1.6));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

export default function HomeLobby({
  profile,
  groupedDecks,
  completedDecks,
  fbConnected,
  fbProjectId,
  eventCode,
  onStartDeck,
  onUnlockAllDecks,
  onOpenAdmin,
}: HomeLobbyProps) {
  const deckNames = Object.keys(groupedDecks);
  const { cols, rows } = computeOptimalDeckGrid(deckNames.length);
  const completedCount = deckNames.filter((n) =>
    completedDecks.includes(n),
  ).length;

  return (
    <section
      className="relative h-screen w-screen flex flex-col justify-between px-6 py-4 md:px-10 md:py-6 overflow-hidden select-none"
      style={{
        background: profile.backgroundImage
          ? `url('${profile.backgroundImage}') center/cover no-repeat`
          : `radial-gradient(circle at 15% 15%, rgba(0, 242, 254, 0.18) 0%, transparent 42%), radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%), linear-gradient(135deg, ${profile.bgColor} 0%, #071936 55%, ${profile.badgeColor} 100%)`,
      }}
    >
      {profile.backgroundImage && (
        <div className="absolute inset-0 bg-slate-950/55 pointer-events-none" />
      )}

      {/* Phần trên: Tiêu đề cuộc thi */}
      <div className="relative z-10 shrink-0 max-w-6xl mx-auto w-full text-center pt-1">
        <div
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/75 border text-xs font-extrabold tracking-widest uppercase mb-2"
          style={{
            borderColor: profile.accentColor,
            color: profile.accentColor,
          }}
        >
          <span>HỆ THỐNG TRÌNH CHIẾU HỘI TRƯỜNG • MÃ SỰ KIỆN: {eventCode}</span>
        </div>

        <h1
          className="font-extrabold uppercase tracking-tight leading-tight mb-1.5"
          style={{
            fontFamily: profile.titleFont,
            fontSize: `clamp(26px, 4.3vw, ${profile.titleSize}px)`,
            color: profile.titleColor,
          }}
        >
          {profile.contestTitle}
        </h1>

        <p className="text-sm md:text-lg text-cyan-100/90 font-medium max-w-3xl mx-auto truncate">
          {profile.contestSlogan}
        </p>
      </div>

      {/* Phần giữa: Lưới chọn Bộ đề (Vừa khít 1 màn hình, không scroll dọc) */}
      <div className="relative z-10 flex-1 min-h-0 max-w-6xl mx-auto w-full flex flex-col justify-center py-3 overflow-hidden">
        <div className="shrink-0 text-center mb-3">
          <span className="inline-block text-xs uppercase tracking-widest text-cyan-300 font-bold bg-slate-950/80 px-4 py-1.5 rounded-lg border border-cyan-400/40">
            {completedCount > 0
              ? `CHỌN GÓI BỘ ĐỀ (ĐÃ HOÀN THÀNH ${completedCount}/${deckNames.length})`
              : "CHỌN GÓI BỘ ĐỀ ĐỂ BẮT ĐẦU TRÌNH CHIẾU"}
          </span>
        </div>

        {deckNames.length === 0 ? (
          <div className="bg-slate-950/90 border border-cyan-500/40 text-white rounded-2xl p-8 text-center max-w-lg mx-auto">
            <h3 className="text-lg font-extrabold mb-1">
              Chưa có bộ đề thi nào
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Vui lòng vào trang Quản trị để tải file Excel câu hỏi hoặc khôi
              phục bộ đề mẫu.
            </p>
            <button
              onClick={onOpenAdmin}
              className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md hover:shadow-cyan-400/30 transition-all duration-200 active:scale-[0.98]"
            >
              Mở trang Quản trị
            </button>
          </div>
        ) : (
          <div
            className="flex-1 min-h-0 w-full grid gap-3 md:gap-4"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              maxHeight: rows === 1 ? "210px" : rows === 2 ? "350px" : "100%",
            }}
          >
            {deckNames.map((name, idx) => {
              const isDone = completedDecks.includes(name);
              const count = groupedDecks[name].length;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={isDone}
                  onClick={() => onStartDeck(name)}
                  className={`group rounded-xl px-5 py-3.5 text-left flex items-center justify-between gap-2 min-h-0 overflow-hidden border transition-all duration-200 ease-out ${
                    isDone
                      ? "bg-slate-900/75 border-slate-700 opacity-55 cursor-not-allowed"
                      : "bg-slate-950/85 hover:bg-slate-900/95 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/15 active:translate-y-0 cursor-pointer shadow-lg"
                  }`}
                  style={{
                    borderColor: isDone
                      ? undefined
                      : profile.accentColor + "85",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded mb-1.5 bg-slate-900 border border-slate-700 transition-colors duration-200"
                      style={{
                        color: isDone ? "#94a3b8" : profile.accentColor,
                      }}
                    >
                      {isDone
                        ? "ĐÃ THI XONG"
                        : `GÓI ĐỀ SỐ ${String(idx + 1).padStart(2, "0")}`}
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-white group-hover:text-cyan-200 transition-colors duration-200 truncate">
                      {name}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 truncate">
                      {isDone
                        ? `Đã hoàn thành • ${count} câu`
                        : `Ngân hàng: ${count} câu hỏi`}
                    </div>
                  </div>
                  <div
                    className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-black transition-transform duration-200 group-hover:scale-105"
                    style={{
                      background: isDone
                        ? "#334155"
                        : `linear-gradient(135deg, ${profile.accentColor} 0%, ${profile.badgeColor} 100%)`,
                      color: isDone ? "#34d399" : "#020617",
                    }}
                  >
                    {isDone ? "✓" : "▶"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Phần dưới: Trạng thái Cloud & Nút Quản trị */}
      <div className="relative z-10 shrink-0 max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-slate-300 pt-2.5 border-t border-cyan-500/20">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              fbConnected ? "bg-emerald-400" : "bg-cyan-400"
            }`}
          />
          <span>
            {fbConnected
              ? `Firebase Cloud Đã Kết Nối (${fbProjectId})`
              : "Chế độ Cục bộ • Tương thích Bút trình chiếu PowerPoint"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {completedDecks.length > 0 && (
            <button
              onClick={onUnlockAllDecks}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-amber-950 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Mở khóa đề
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-600 hover:border-cyan-400/70 font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            Quản trị (Ctrl+M)
          </button>
        </div>
      </div>
    </section>
  );
}
