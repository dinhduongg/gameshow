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
          : `radial-gradient(circle at 15% 15%, rgba(0, 242, 254, 0.18) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%), radial-gradient(circle at 50% 88%, rgba(14, 165, 233, 0.24) 0%, transparent 50%), linear-gradient(135deg, ${profile.bgColor} 0%, #071936 50%, ${profile.badgeColor} 100%)`,
      }}
    >
      {/* Đồ họa Vector Mạch Điện Tử & Lưới Kỹ Thuật Số */}
      {!profile.backgroundImage ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 242, 254, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 254, 0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        >
          <svg
            className="w-full h-full opacity-35"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient
                id="cyberGrad1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient
                id="cyberGrad2"
                x1="100%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M0 120 H180 L240 180 H420"
              stroke="url(#cyberGrad1)"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="420" cy="180" r="5" fill="#00f2fe" />
            <path
              d="M0 240 H110 L160 290 H310"
              stroke="url(#cyberGrad1)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="310" cy="290" r="4" fill="#38bdf8" />
            <path
              d="M1440 140 H1240 L1180 200 H980"
              stroke="url(#cyberGrad2)"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="980" cy="200" r="5" fill="#00f2fe" />
            <path
              d="M1440 260 H1300 L1250 310 H1110"
              stroke="url(#cyberGrad2)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="1110" cy="310" r="4" fill="#38bdf8" />
            <polygon
              points="120,680 155,660 190,680 190,720 155,740 120,720"
              stroke="#00f2fe"
              strokeWidth="1.2"
              fill="none"
              opacity="0.45"
            />
            <polygon
              points="165,710 200,690 235,710 235,750 200,770 165,750"
              stroke="#38bdf8"
              strokeWidth="1.2"
              fill="none"
              opacity="0.35"
            />
            <polygon
              points="1260,650 1295,630 1330,650 1330,690 1295,710 1260,690"
              stroke="#00f2fe"
              strokeWidth="1.2"
              fill="none"
              opacity="0.45"
            />
            <polygon
              points="1215,680 1250,660 1285,680 1285,720 1250,740 1215,720"
              stroke="#6366f1"
              strokeWidth="1.2"
              fill="none"
              opacity="0.35"
            />
            <circle
              cx="720"
              cy="450"
              r="390"
              stroke="url(#cyberGrad1)"
              strokeWidth="1"
              strokeDasharray="10 14"
              fill="none"
              opacity="0.4"
            />
            <circle
              cx="720"
              cy="450"
              r="440"
              stroke="url(#cyberGrad2)"
              strokeWidth="1"
              strokeDasharray="4 18"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>
      ) : (
        <div className="absolute inset-0 bg-slate-950/55 pointer-events-none" />
      )}

      {/* Phần trên: Huy hiệu Chuyển đổi số & Tiêu đề cuộc thi */}
      <div className="relative z-10 shrink-0 max-w-6xl mx-auto w-full text-center pt-1">
        <div
          className="inline-flex items-center gap-2.5 px-4 py-1 rounded-full bg-cyan-500/15 border text-xs font-bold tracking-widest uppercase mb-2.5 shadow-[0_0_20px_rgba(0,242,254,0.25)]"
          style={{
            borderColor: profile.accentColor,
            color: profile.accentColor,
          }}
        >
          <span>⚡ HỆ THỐNG THI TRẮC NGHIỆM CHUYỂN ĐỔI SỐ • {eventCode}</span>
        </div>

        <h1
          className="font-extrabold uppercase tracking-tight leading-tight mb-2 drop-shadow-[0_4px_24px_rgba(0,242,254,0.3)]"
          style={{
            fontFamily: profile.titleFont,
            fontSize: `clamp(26px, 4.3vw, ${profile.titleSize}px)`,
            color: profile.titleColor,
          }}
        >
          {profile.contestTitle}
        </h1>

        {/* Đường kẻ kim cương HUD */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-16 h-0.5 bg-linear-to-r from-transparent to-cyan-400" />
          <div className="w-2.5 h-2.5 rotate-45 border-2 border-cyan-400 bg-cyan-400/30" />
          <div className="w-16 h-0.5 bg-linear-to-l from-transparent to-cyan-400" />
        </div>

        <p className="text-sm md:text-lg text-cyan-100/90 font-medium max-w-3xl mx-auto truncate">
          {profile.contestSlogan}
        </p>
      </div>

      {/* Phần giữa: Lưới chọn Bộ đề (1 màn hình duy nhất, không scroll dọc) */}
      <div className="relative z-10 flex-1 min-h-0 max-w-6xl mx-auto w-full flex flex-col justify-center py-3 md:py-4 overflow-hidden">
        <div className="shrink-0 text-center mb-3">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-300 font-bold bg-slate-900/80 px-4 py-1.5 rounded-lg border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
            <span>
              {completedCount > 0
                ? `CHỌN GÓI BỘ ĐỀ (ĐÃ HOÀN THÀNH ${completedCount}/${deckNames.length})`
                : "CHỌN GÓI BỘ ĐỀ ĐỂ BẮT ĐẦU TRÌNH CHIẾU"}
            </span>
          </span>
        </div>

        {deckNames.length === 0 ? (
          <div className="bg-slate-950/90 border border-cyan-500/40 text-white rounded-2xl p-8 text-center max-w-lg mx-auto shadow-[0_0_30px_rgba(0,242,254,0.15)]">
            <h3 className="text-lg font-extrabold mb-1">
              Chưa có bộ đề thi nào trong hệ thống
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Vui lòng vào trang Quản trị để tải lên file Excel câu hỏi hoặc
              khôi phục bộ đề mẫu.
            </p>
            <button
              onClick={onOpenAdmin}
              className="px-5 py-2.5 rounded-lg bg-linear-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md transition-all duration-200 active:scale-[0.98]"
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
                  className={`group rounded-xl px-5 py-3.5 text-left flex items-center justify-between gap-2 min-h-0 overflow-hidden border-[1.5px] transition-all duration-200 ease-out ${
                    isDone
                      ? "bg-slate-950/80 border-slate-700/50 opacity-55 grayscale-50 cursor-not-allowed"
                      : "hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(0,242,254,0.32)] active:translate-y-0 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                  }`}
                  style={
                    isDone
                      ? undefined
                      : {
                          background:
                            "linear-gradient(135deg, rgba(10, 28, 64, 0.88) 0%, rgba(6, 17, 42, 0.95) 100%)",
                          borderColor: profile.accentColor + "85",
                        }
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded mb-1.5 border transition-colors duration-200"
                      style={
                        isDone
                          ? {
                              backgroundColor: "rgba(30, 41, 59, 0.8)",
                              borderColor: "rgba(100, 116, 139, 0.5)",
                              color: "#cbd5e1",
                            }
                          : {
                              backgroundColor: "rgba(6, 182, 212, 0.14)",
                              borderColor: "rgba(34, 211, 238, 0.35)",
                              color: profile.accentColor,
                            }
                      }
                    >
                      <span>
                        {isDone
                          ? "🔒 ĐÃ THI XONG"
                          : `❖ GÓI ĐỀ SỐ ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                    </div>
                    <div className="text-lg md:text-2xl font-extrabold text-white group-hover:text-cyan-200 transition-colors duration-200 truncate">
                      {name}
                    </div>
                    <div className="text-xs text-cyan-200/75 mt-0.5 truncate">
                      {isDone
                        ? `Đã hoàn thành • ${count} câu hỏi`
                        : `Ngân hàng: ${count} câu hỏi trắc nghiệm`}
                    </div>
                  </div>
                  <div
                    className="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 flex items-center justify-center font-black transition-transform duration-200 group-hover:scale-105"
                    style={
                      isDone
                        ? {
                            backgroundColor: "#1e293b",
                            border: "1px solid #475569",
                            color: "#34d399",
                          }
                        : {
                            background: `linear-gradient(135deg, ${profile.accentColor} 0%, ${profile.badgeColor} 100%)`,
                            boxShadow: "0 0 18px rgba(0, 242, 254, 0.4)",
                            color: "#020617",
                          }
                    }
                  >
                    {isDone ? "✓" : "▶"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Phần dưới: Trạng thái & Nút Quản trị */}
      <div className="relative z-10 shrink-0 max-w-6xl mx-auto w-full flex items-center justify-between text-xs text-slate-300/85 pt-2.5 border-t border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              fbConnected
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-cyan-400 shadow-[0_0_8px_#00f2fe]"
            }`}
          />
          <span>
            {fbConnected
              ? `Firebase Cloud Đã Kết Nối (${fbProjectId}) • Sẵn sàng trình chiếu`
              : "Giao diện Chuyển Đổi Số HUD • Tương thích Bút trình chiếu PowerPoint & Màn hình LED"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {completedDecks.length > 0 && (
            <button
              onClick={onUnlockAllDecks}
              className="px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-amber-950/90 text-amber-300 hover:text-amber-200 border border-amber-500/45 font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] shadow"
            >
              Mở khóa đề
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-cyan-950/90 text-cyan-200 hover:text-white border border-cyan-500/45 font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] shadow"
          >
            Quản trị (Ctrl+M)
          </button>
        </div>
      </div>
    </section>
  );
}
