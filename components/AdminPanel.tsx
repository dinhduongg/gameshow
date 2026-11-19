"use client";

import { soundEngine } from "@/lib/sound-and-firebase";
import {
  BUILTIN_PRESETS,
  FirebaseConfigData,
  QuestionItem,
  SAMPLE_QUESTIONS,
  ThemeProfile,
} from "@/lib/types-and-data";
import React, { useState } from "react";
import * as XLSX from "xlsx";

interface AdminPanelProps {
  questions: QuestionItem[];
  onUpdateQuestions: (
    nextQuestions: QuestionItem[],
    resetCompleted?: boolean,
  ) => void;
  profiles: ThemeProfile[];
  activeProfile: ThemeProfile;
  onSelectProfile: (id: string) => void;
  onUpdateActiveProfile: (patch: Partial<ThemeProfile>) => void;
  onSaveNewProfile: (name: string) => void;
  onDeleteCurrentProfile: () => void;
  completedDecks: string[];
  onUnlockAllDecks: () => void;
  fbConfig: FirebaseConfigData;
  onUpdateFbConfig: (cfg: FirebaseConfigData) => void;
  fbConnected: boolean;
  eventCode: string;
  onUpdateEventCode: (code: string) => void;
  onPushCloud: () => Promise<void>;
  onPullCloud: () => Promise<void>;
  adminPin: string;
  onUpdateAdminPin: (pin: string) => void;
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
  onReturnHome: () => void;
}

export default function AdminPanel({
  questions,
  onUpdateQuestions,
  profiles,
  activeProfile,
  onSelectProfile,
  onUpdateActiveProfile,
  onSaveNewProfile,
  onDeleteCurrentProfile,
  completedDecks,
  onUnlockAllDecks,
  fbConfig,
  onUpdateFbConfig,
  fbConnected,
  eventCode,
  onUpdateEventCode,
  onPushCloud,
  onPullCloud,
  adminPin,
  onUpdateAdminPin,
  onNotify,
  onReturnHome,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "questions" | "theme" | "cloud" | "hardware"
  >("questions");
  const [deckFilter, setDeckFilter] = useState<string>("ALL");
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [remoteStatus, setRemoteStatus] = useState<{
    title: string;
    detail: string;
    color: string;
  }>({
    title: "Bấm vào khung này rồi nhấn nút trên bút trình chiếu...",
    detail: "Hỗ trợ: PageDown, PageUp, Mũi tên Trái/Phải, Space, Enter",
    color: "text-slate-700",
  });

  // Nhóm câu hỏi theo bộ đề
  const groupedDecks = questions.reduce(
    (acc, q) => {
      const key = (q.deck || "Bộ đề chung").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    },
    {} as Record<string, QuestionItem[]>,
  );

  const deckNames = Object.keys(groupedDecks);

  // Xuất file Excel mẫu
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(
      SAMPLE_QUESTIONS.map((q) => ({
        "Bộ đề": q.deck,
        "Câu hỏi": q.question,
        "Đáp án A": q.optA,
        "Đáp án B": q.optB,
        "Đáp án C": q.optC,
        "Đáp án D": q.optD,
        "Đáp án đúng": q.answer,
      })),
    );
    ws["!cols"] = [
      { wch: 14 },
      { wch: 60 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 28 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bo_De_Hoi_Truong");
    XLSX.writeFile(wb, "Mau_Bo_De_Gameshow.xlsx");
    onNotify("Đã tải file Excel mẫu (.xlsx)!", "success");
  };

  // Đọc file Excel tải lên
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: "",
      });

      const parsed: QuestionItem[] = [];
      rows.forEach((row: unknown) => {
        const r = row as Record<string, unknown>;
        const deck = String(r["Bộ đề"] || r["Bo de"] || "Bộ đề 1").trim();
        const question = String(r["Câu hỏi"] || r["Cau hoi"] || "").trim();
        const optA = String(r["Đáp án A"] || r["Dap an A"] || "").trim();
        const optB = String(r["Đáp án B"] || r["Dap an B"] || "").trim();
        const optC = String(r["Đáp án C"] || r["Dap an C"] || "").trim();
        const optD = String(r["Đáp án D"] || r["Dap an D"] || "").trim();
        let ans = String(r["Đáp án đúng"] || r["Dap an dung"] || "A")
          .trim()
          .toUpperCase();
        if (!["A", "B", "C", "D"].includes(ans)) ans = "A";
        if (question) {
          parsed.push({
            deck,
            question,
            optA,
            optB,
            optC,
            optD,
            answer: ans as "A" | "B" | "C" | "D",
          });
        }
      });

      if (parsed.length === 0) {
        onNotify("File Excel không có dữ liệu câu hỏi hợp lệ!", "error");
        return;
      }

      onUpdateQuestions(parsed, true);
      onNotify(
        `Đã nạp thành công ${parsed.length} câu hỏi từ Excel!`,
        "success",
      );
    } catch {
      onNotify(
        "Lỗi đọc file Excel, vui lòng kiểm tra định dạng .xlsx!",
        "error",
      );
    } finally {
      e.target.value = "";
    }
  };

  // Nén & upload ảnh nền sân khấu
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_W = 1600;
        const MAX_H = 900;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) {
          h *= MAX_W / w;
          w = MAX_W;
        }
        if (h > MAX_H) {
          w *= MAX_H / h;
          h = MAX_H;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        onUpdateActiveProfile({
          backgroundImage: canvas.toDataURL("image/jpeg", 0.8),
        });
        onNotify("Đã cập nhật hình nền sân khấu!", "success");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <section className="min-h-screen w-full bg-slate-100 text-slate-900">
      {/* Header Admin */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 md:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-extrabold tracking-tight">
              TRANG QUẢN TRỊ TRÌNH CHIẾU HỘI TRƯỜNG
            </h1>
            <p className="text-xs text-slate-400">
              Quản lý Bộ đề Excel • Giao diện Sân khấu • Đồng bộ Firebase Cloud
            </p>
          </div>

          <button
            onClick={() => {
              onNotify("Đã lưu cấu hình!", "success");
              onReturnHome();
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm cursor-pointer shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]"
          >
            Lưu & Về Trang chủ
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Thanh chuyển Tab */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
          {[
            { id: "questions", label: "1. Ngân hàng Bộ đề (Excel)" },
            { id: "theme", label: "2. Giao diện & Quy tắc Đồng hồ" },
            { id: "cloud", label: "3. Đồng bộ Firebase Cloud" },
            { id: "hardware", label: "4. Mã PIN, Loa & Remote" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() =>
                setActiveTab(
                  t.id as "questions" | "theme" | "cloud" | "hardware",
                )
              }
              className={`flex-1 min-w-45 py-2.5 px-4 rounded-lg font-bold text-xs md:text-sm cursor-pointer transition-all duration-200 ${
                activeTab === t.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: QUẢN LÝ BỘ ĐỀ EXCEL */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Nạp câu hỏi từ File Excel (.xlsx)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cột chuẩn:{" "}
                  <b>
                    Bộ đề | Câu hỏi | Đáp án A | Đáp án B | Đáp án C | Đáp án D
                    | Đáp án đúng
                  </b>
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  Số bộ đề: <b>{deckNames.length}</b>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Tổng câu hỏi: <b>{questions.length}</b>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Tải file Excel mẫu (.xlsx)
              </button>

              <label className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98]">
                Upload file Excel bộ đề mới
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  onUpdateQuestions(SAMPLE_QUESTIONS, true);
                  onNotify("Đã khôi phục bộ đề mẫu!", "success");
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Khôi phục bộ đề mẫu
              </button>

              <button
                onClick={onUnlockAllDecks}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Mở khóa lại tất cả bộ đề
              </button>

              <button
                onClick={() => {
                  onUpdateQuestions([], true);
                  onNotify("Đã xóa sạch toàn bộ dữ liệu câu hỏi!", "info");
                }}
                className="px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-600 border border-red-300 text-red-700 hover:text-white font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Xóa sạch dữ liệu
              </button>
            </div>

            {/* Danh sách các gói bộ đề */}
            <div className="flex flex-wrap gap-2">
              {deckNames.map((dName) => (
                <div
                  key={dName}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-xs font-bold text-slate-800 transition-colors duration-150"
                >
                  <span>
                    {dName} ({groupedDecks[dName].length} câu)
                  </span>
                  {completedDecks.includes(dName) && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                      Đã thi
                    </span>
                  )}
                  <button
                    onClick={() => {
                      onUpdateQuestions(
                        questions.filter((q) => q.deck !== dName),
                        false,
                      );
                      onNotify(`Đã xóa "${dName}"!`, "info");
                    }}
                    className="text-slate-400 hover:text-red-600 ml-1 cursor-pointer transition-colors duration-150"
                    title="Xóa lẻ bộ đề này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Bảng xem trước câu hỏi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Xem trước câu hỏi
                </span>
                <select
                  value={deckFilter}
                  onChange={(e) => setDeckFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-bold bg-white cursor-pointer transition-colors duration-150"
                >
                  <option value="ALL">Tất cả bộ đề ({deckNames.length})</option>
                  {deckNames.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-95">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-800 text-white text-xs uppercase sticky top-0">
                    <tr>
                      <th className="p-3 w-12">#</th>
                      <th className="p-3 w-28">Bộ đề</th>
                      <th className="p-3">Nội dung câu hỏi</th>
                      <th className="p-3 w-80">4 Phương án</th>
                      <th className="p-3 w-24 text-center">Đáp án</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(deckFilter === "ALL"
                      ? questions
                      : questions.filter((q) => q.deck === deckFilter)
                    ).map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 text-xs text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-3 text-xs font-bold text-blue-800">
                          {q.deck}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {q.question}
                        </td>
                        <td className="p-3 text-xs text-slate-600 space-y-0.5">
                          <div>
                            <b>A:</b> {q.optA}
                          </div>
                          <div>
                            <b>B:</b> {q.optB}
                          </div>
                          <div>
                            <b>C:</b> {q.optC}
                          </div>
                          <div>
                            <b>D:</b> {q.optD}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                            {q.answer}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GIAO DIỆN & QUY TẮC ĐỒNG HỒ */}
        {activeTab === "theme" && (
          <div className="space-y-6">
            {/* Hồ sơ cuộc thi & Quy tắc điều khiển đồng hồ */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-extrabold text-slate-900">
                Hồ sơ Cuộc thi & Quy tắc Đồng hồ Sân khấu
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <select
                    value={activeProfile.id}
                    onChange={(e) => onSelectProfile(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 hover:border-slate-400 text-sm font-bold bg-slate-50 cursor-pointer transition-colors duration-150"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {profiles.length > 1 && (
                    <button
                      onClick={onDeleteCurrentProfile}
                      className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-bold cursor-pointer transition-colors duration-150"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Nhập tên hồ sơ cuộc thi mới..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none text-sm transition-colors duration-150"
                  />
                  <button
                    onClick={() => {
                      if (!newProfileName.trim()) return;
                      onSaveNewProfile(newProfileName.trim());
                      setNewProfileName("");
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
                  >
                    Lưu thành hồ sơ mới
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tên cuộc thi
                  </label>
                  <input
                    type="text"
                    value={activeProfile.contestTitle}
                    onChange={(e) =>
                      onUpdateActiveProfile({ contestTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Khẩu hiệu / Slogan
                  </label>
                  <input
                    type="text"
                    value={activeProfile.contestSlogan}
                    onChange={(e) =>
                      onUpdateActiveProfile({ contestSlogan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Thời gian đếm ngược (giây)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={activeProfile.defaultTimer}
                      onChange={(e) =>
                        onUpdateActiveProfile({
                          defaultTimer: Math.max(
                            5,
                            Number(e.target.value) || 15,
                          ),
                        })
                      }
                      className="w-20 px-3 py-2 rounded-lg border border-slate-300 text-sm font-extrabold text-center"
                    />
                    {[10, 15, 20, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          onUpdateActiveProfile({ defaultTimer: sec })
                        }
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors duration-150"
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quy tắc 1: Hành vi khi đang đếm ngược */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-extrabold uppercase text-slate-600">
                  Quy tắc 1: Khi đồng hồ đang chạy đếm ngược, bấm nút Next /
                  Remote sẽ:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      onUpdateActiveProfile({ allowSkipDuringCountdown: true })
                    }
                    className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 ${
                      activeProfile.allowSkipDuringCountdown !== false
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={activeProfile.allowSkipDuringCountdown !== false}
                      readOnly
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        Cho phép Skip / Chốt giờ sớm
                      </div>
                      <div className="text-xs text-slate-600">
                        Dừng đồng hồ ngay lập tức khi các đội thi trả lời xong
                        trước thời gian quy định.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      onUpdateActiveProfile({ allowSkipDuringCountdown: false })
                    }
                    className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 ${
                      activeProfile.allowSkipDuringCountdown === false
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={activeProfile.allowSkipDuringCountdown === false}
                      readOnly
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        Khóa nút Next đến khi hết giờ
                      </div>
                      <div className="text-xs text-slate-600">
                        Bấm Next / Remote khi đang đếm ngược sẽ không xảy ra gì
                        cả (chống bấm nhầm).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quy tắc 2: Hành vi khi đồng hồ về 00 */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-extrabold uppercase text-slate-600">
                  Quy tắc 2: Khi đồng hồ đếm ngược kết thúc (về 00):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      onUpdateActiveProfile({ autoRevealOnTimeout: true })
                    }
                    className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 ${
                      activeProfile.autoRevealOnTimeout !== false
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={activeProfile.autoRevealOnTimeout !== false}
                      readOnly
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        Tự động hiện đáp án đúng ngay
                      </div>
                      <div className="text-xs text-slate-600">
                        Đồng hồ về 00 sẽ phát chuông và tự bật sáng phương án
                        chính xác ngay lập tức.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      onUpdateActiveProfile({ autoRevealOnTimeout: false })
                    }
                    className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-start gap-3 transition-all duration-200 ${
                      activeProfile.autoRevealOnTimeout === false
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={activeProfile.autoRevealOnTimeout === false}
                      readOnly
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        Chờ MC / Điều khiển bấm nút mới mở
                      </div>
                      <div className="text-xs text-slate-600">
                        Chỉ báo HẾT GIỜ; đáp án đúng chỉ hiển thị khi bấm nút
                        hoặc bấm Remote.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng màu, Hình nền & Font chữ từng thành phần */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Màu sắc, Hình nền & Phông chữ
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "CYBER_DIGITAL", label: "Cyber Chuyển Đổi Số" },
                    { key: "AI_QUANTUM", label: "AI Quantum" },
                    { key: "SMART_GOLD_HUD", label: "Smart Gold" },
                    { key: "HOLO_BRIGHT", label: "Holo Bright" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        onUpdateActiveProfile(BUILTIN_PRESETS[p.key]);
                        onNotify(`Đã áp dụng chủ đề ${p.label}!`, "success");
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold cursor-pointer transition-all duration-150 active:scale-[0.97]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]">
                  Upload ảnh nền sân khấu
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => onUpdateActiveProfile({ backgroundImage: "" })}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold cursor-pointer transition-colors duration-150"
                >
                  Dùng nền mặc định
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {/* 1. Tiêu đề */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-extrabold text-xs uppercase text-slate-700">
                    1. Tiêu đề Cuộc thi
                  </div>
                  <select
                    value={activeProfile.titleFont}
                    onChange={(e) =>
                      onUpdateActiveProfile({ titleFont: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold bg-white cursor-pointer"
                  >
                    <option value="var(--font-be-vietnam), sans-serif">
                      Be Vietnam Pro
                    </option>
                    <option value="var(--font-montserrat), sans-serif">
                      Montserrat
                    </option>
                    <option value="var(--font-lexend), sans-serif">
                      Lexend
                    </option>
                    <option value="var(--font-inter), sans-serif">Inter</option>
                  </select>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Cỡ chữ: {activeProfile.titleSize}px</span>
                    <input
                      type="color"
                      value={activeProfile.titleColor}
                      onChange={(e) =>
                        onUpdateActiveProfile({ titleColor: e.target.value })
                      }
                      className="cursor-pointer"
                    />
                  </div>
                  <input
                    type="range"
                    min={28}
                    max={72}
                    value={activeProfile.titleSize}
                    onChange={(e) =>
                      onUpdateActiveProfile({
                        titleSize: Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* 2. Câu hỏi */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-extrabold text-xs uppercase text-slate-700">
                    2. Khung Câu hỏi
                  </div>
                  <select
                    value={activeProfile.questionFont}
                    onChange={(e) =>
                      onUpdateActiveProfile({ questionFont: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold bg-white cursor-pointer"
                  >
                    <option value="var(--font-be-vietnam), sans-serif">
                      Be Vietnam Pro
                    </option>
                    <option value="var(--font-lexend), sans-serif">
                      Lexend
                    </option>
                    <option value="var(--font-inter), sans-serif">Inter</option>
                    <option value="var(--font-montserrat), sans-serif">
                      Montserrat
                    </option>
                  </select>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Cỡ chữ: {activeProfile.questionSize}px</span>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        title="Màu nền khung"
                        value={activeProfile.questionBg}
                        onChange={(e) =>
                          onUpdateActiveProfile({ questionBg: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                      <input
                        type="color"
                        title="Màu chữ"
                        value={activeProfile.questionColor}
                        onChange={(e) =>
                          onUpdateActiveProfile({
                            questionColor: e.target.value,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={48}
                    value={activeProfile.questionSize}
                    onChange={(e) =>
                      onUpdateActiveProfile({
                        questionSize: Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* 3. Đáp án */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-extrabold text-xs uppercase text-slate-700">
                    3. Bốn Ô Đáp án
                  </div>
                  <select
                    value={activeProfile.optionFont}
                    onChange={(e) =>
                      onUpdateActiveProfile({ optionFont: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold bg-white cursor-pointer"
                  >
                    <option value="var(--font-be-vietnam), sans-serif">
                      Be Vietnam Pro
                    </option>
                    <option value="var(--font-lexend), sans-serif">
                      Lexend
                    </option>
                    <option value="var(--font-inter), sans-serif">Inter</option>
                    <option value="var(--font-montserrat), sans-serif">
                      Montserrat
                    </option>
                  </select>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Cỡ chữ: {activeProfile.optionSize}px</span>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        title="Màu nền ô"
                        value={activeProfile.optionBg}
                        onChange={(e) =>
                          onUpdateActiveProfile({ optionBg: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                      <input
                        type="color"
                        title="Màu chữ"
                        value={activeProfile.optionColor}
                        onChange={(e) =>
                          onUpdateActiveProfile({ optionColor: e.target.value })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={36}
                    value={activeProfile.optionSize}
                    onChange={(e) =>
                      onUpdateActiveProfile({
                        optionSize: Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ĐỒNG BỘ FIREBASE CLOUD */}
        {activeTab === "cloud" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Kho Lưu Trữ Đám Mây Firebase (Đồng bộ giữa máy ở nhà & máy hội
                  trường)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập thông số từ <b>Firebase Console → Project Settings</b>{" "}
                  (hoặc cấu hình biến môi trường{" "}
                  <code>NEXT_PUBLIC_FIREBASE_*</code> trên Vercel).
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  fbConnected
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {fbConnected ? "● ĐÃ KẾT NỐI FIREBASE" : "○ CHƯA KẾT NỐI"}
              </span>
            </div>

            <div className="max-w-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Sự Kiện / Hội Thi (Dùng chung giữa các máy)
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) =>
                  onUpdateEventCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-black tracking-widest uppercase text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { key: "apiKey", label: "API Key *", ph: "AIzaSy..." },
                {
                  key: "projectId",
                  label: "Project ID *",
                  ph: "gia-dinh-so-2026",
                },
                {
                  key: "authDomain",
                  label: "Auth Domain",
                  ph: "gia-dinh-so.firebaseapp.com",
                },
                {
                  key: "storageBucket",
                  label: "Storage Bucket",
                  ph: "gia-dinh-so.appspot.com",
                },
                {
                  key: "messagingSenderId",
                  label: "Messaging Sender ID",
                  ph: "123456789",
                },
                { key: "appId", label: "App ID", ph: "1:123456:web:abcdef" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block font-bold text-slate-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.ph}
                    value={
                      (fbConfig as unknown as Record<string, string>)[field.key]
                    }
                    onChange={(e) =>
                      onUpdateFbConfig({
                        ...fbConfig,
                        [field.key]: e.target.value.trim(),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={isSyncing}
                onClick={async () => {
                  setIsSyncing(true);
                  await onPushCloud();
                  setIsSyncing(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                {isSyncing
                  ? "Đang đồng bộ..."
                  : "⬆ Đẩy Bộ đề & Giao diện lên Cloud"}
              </button>

              <button
                disabled={isSyncing}
                onClick={async () => {
                  setIsSyncing(true);
                  await onPullCloud();
                  setIsSyncing(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                {isSyncing
                  ? "Đang tải..."
                  : "⬇ Tải Bộ đề & Giao diện từ Cloud về máy"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MÃ PIN, LOA & REMOTE */}
        {activeTab === "hardware" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Mã PIN Khóa Trang Quản trị
              </h2>
              <p className="text-xs text-slate-500">
                Tránh người lạ bấm nhầm khi chạy public trên Vercel. Để trống
                nếu muốn tắt khóa PIN.
              </p>
              <input
                type="text"
                maxLength={8}
                value={adminPin}
                onChange={(e) => onUpdateAdminPin(e.target.value)}
                placeholder="VD: 1234"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Kiểm tra Loa Hội trường
              </h2>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => soundEngine.playTick()}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  Tiếng đếm giây
                </button>
                <button
                  onClick={() => soundEngine.playUrgentTick()}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  5 giây cuối
                </button>
                <button
                  onClick={() => soundEngine.playTimeoutBuzzer()}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  Còi hết giờ
                </button>
                <button
                  onClick={() => soundEngine.playRevealSuccess()}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  Mở đáp án đúng
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Test Bút trình chiếu (Remote)
              </h2>
              <div
                tabIndex={0}
                onKeyDown={(e) => {
                  e.preventDefault();
                  const keyName = e.key === " " ? "Space" : e.key;
                  if (
                    ["PageDown", "ArrowRight", " ", "Enter"].includes(e.key)
                  ) {
                    setRemoteStatus({
                      title: `✓ TÍN HIỆU TỚI (NEXT) [${keyName}]`,
                      detail: "Hoạt động tốt!",
                      color: "text-emerald-700",
                    });
                    soundEngine.playTick();
                  } else if (["PageUp", "ArrowLeft"].includes(e.key)) {
                    setRemoteStatus({
                      title: `↺ TÍN HIỆU LÙI (BACK) [${keyName}]`,
                      detail: "Hoạt động tốt!",
                      color: "text-amber-700",
                    });
                    soundEngine.playTick();
                  }
                }}
                className="p-4 rounded-xl border-2 border-dashed border-blue-400 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 focus:bg-blue-100 outline-none text-center cursor-pointer space-y-1 transition-all duration-200"
              >
                <div className={`text-xs font-extrabold ${remoteStatus.color}`}>
                  {remoteStatus.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  {remoteStatus.detail}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
