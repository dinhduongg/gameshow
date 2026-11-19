export interface QuestionItem {
  deck: string;
  question: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  answer: "A" | "B" | "C" | "D";
}

export interface ThemeProfile {
  id: string;
  name: string;
  contestTitle: string;
  contestSlogan: string;
  defaultTimer: number;
  allowSkipDuringCountdown: boolean; // true = Bấm Next để Skip/Chốt sớm | false = Khóa nút Next khi đang đếm ngược
  autoRevealOnTimeout: boolean; // true = Tự động mở đáp án khi về 00 | false = Hết giờ chờ MC bấm nút mở
  backgroundImage: string;
  bgColor: string;
  accentColor: string;
  badgeColor: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  questionFont: string;
  questionSize: number;
  questionBg: string;
  questionColor: string;
  optionFont: string;
  optionSize: number;
  optionBg: string;
  optionColor: string;
}

export interface FirebaseConfigData {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const STORAGE_KEYS = {
  QUESTIONS: "gameshow_stage_questions_v1",
  PROFILES: "gameshow_stage_profiles_v1",
  ACTIVE_PROFILE_ID: "gameshow_stage_active_profile_v1",
  COMPLETED_DECKS: "gameshow_stage_completed_decks_v1",
  FIREBASE_CONFIG: "gameshow_stage_fb_config_v1",
  EVENT_CODE: "gameshow_stage_event_code_v1",
  ADMIN_PIN: "gameshow_stage_admin_pin_v1",
  SOUND_ENABLED: "gameshow_stage_sound_v1",
};

export const ENV_FIREBASE_CONFIG: FirebaseConfigData = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const BUILTIN_PRESETS: Record<string, Partial<ThemeProfile>> = {
  CYBER_DIGITAL: {
    bgColor: "#020617",
    accentColor: "#00f2fe",
    badgeColor: "#0284c7",
    titleColor: "#FFFFFF",
    questionBg: "#081c42",
    questionColor: "#F8FAFC",
    optionBg: "#0c2352",
    optionColor: "#F1F5F9",
  },
  AI_QUANTUM: {
    bgColor: "#0f0524",
    accentColor: "#e879f9",
    badgeColor: "#9333ea",
    titleColor: "#FAF5FF",
    questionBg: "#1e0b40",
    questionColor: "#FAF5FF",
    optionBg: "#271052",
    optionColor: "#F3E8FF",
  },
  SMART_GOLD_HUD: {
    bgColor: "#021f1c",
    accentColor: "#fbbf24",
    badgeColor: "#d97706",
    titleColor: "#FEF3C7",
    questionBg: "#06332e",
    questionColor: "#ECFDF5",
    optionBg: "#08423b",
    optionColor: "#FFFFFF",
  },
  HOLO_BRIGHT: {
    bgColor: "#051937",
    accentColor: "#00f2fe",
    badgeColor: "#0284c7",
    titleColor: "#FFFFFF",
    questionBg: "#FFFFFF",
    questionColor: "#0F172A",
    optionBg: "#F8FAFC",
    optionColor: "#0F172A",
  },
};

export const DEFAULT_PROFILE: ThemeProfile = {
  id: "profile_stage_giadinhso_v1",
  name: "Cyber Chuyển Đổi Số - Sân Khấu HUD (Mặc định)",
  contestTitle: "CUỘC THI TRẮC NGHIỆM: GIA ĐÌNH SỐ",
  contestSlogan:
    "Kết nối yêu thương – Làm chủ công nghệ – Kiến tạo tương lai số",
  defaultTimer: 15,
  allowSkipDuringCountdown: true,
  autoRevealOnTimeout: true,
  backgroundImage: "",
  bgColor: "#020617",
  accentColor: "#00f2fe",
  badgeColor: "#0284c7",
  titleFont: "var(--font-be-vietnam), sans-serif",
  titleSize: 48,
  titleColor: "#FFFFFF",
  questionFont: "var(--font-be-vietnam), sans-serif",
  questionSize: 30,
  questionBg: "#081c42",
  questionColor: "#F8FAFC",
  optionFont: "var(--font-be-vietnam), sans-serif",
  optionSize: 22,
  optionBg: "#0c2352",
  optionColor: "#F1F5F9",
};

export const SAMPLE_QUESTIONS: QuestionItem[] = [
  // BỘ ĐỀ 1
  {
    deck: "Bộ đề 1",
    question:
      "Ứng dụng định danh điện tử quốc gia VNeID do cơ quan nào của Việt Nam phát triển và quản lý?",
    optA: "Bộ Thông tin và Truyền thông",
    optB: "Bộ Công an",
    optC: "Ngân hàng Nhà nước Việt Nam",
    optD: "Văn phòng Chính phủ",
    answer: "B",
  },
  {
    deck: "Bộ đề 1",
    question:
      "Tài khoản định danh điện tử mức độ 2 trên ứng dụng VNeID có giá trị tương đương với giấy tờ nào sau đây?",
    optA: "Chỉ dùng thay thế thẻ thư viện",
    optB: "Thẻ Căn cước công dân gắn chip",
    optC: "Chứng chỉ ngoại ngữ quốc tế",
    optD: "Bằng tốt nghiệp đại học",
    answer: "B",
  },
  {
    deck: "Bộ đề 1",
    question:
      "Nguyên tắc quan trọng nhất khi nhận được mã xác thực OTP từ ngân hàng là gì?",
    optA: "Đọc cho nhân viên tổng đài khi họ yêu cầu",
    optB: "Ghi lên mạng xã hội để lưu trữ",
    optC: "Tuyệt đối không cung cấp mã OTP cho bất kỳ ai",
    optD: "Chụp màn hình gửi cho người lạ kiểm tra",
    answer: "C",
  },
  {
    deck: "Bộ đề 1",
    question:
      "Địa chỉ truy cập chính thức của Cổng Dịch vụ công Quốc gia Việt Nam là gì?",
    optA: "dichvucong.gov.vn",
    optB: "dichvucong.com.vn",
    optC: "dichvucong.vn",
    optD: "chinhphuso.org.vn",
    answer: "A",
  },
  {
    deck: "Bộ đề 1",
    question:
      "Ngày Chuyển đổi số Quốc gia của Việt Nam được Thủ tướng Chính phủ quyết định là ngày nào hằng năm?",
    optA: "Ngày 02 tháng 9",
    optB: "Ngày 10 tháng 10",
    optC: "Ngày 20 tháng 11",
    optD: "Ngày 19 tháng 5",
    answer: "B",
  },
  // BỘ ĐỀ 2
  {
    deck: "Bộ đề 2",
    question:
      "Khi nhận được cuộc gọi tự xưng là Công an, Viện kiểm sát yêu cầu chuyển tiền để xác minh điều tra, gia đình cần làm gì?",
    optA: "Chuyển tiền ngay theo yêu cầu",
    optB: "Cung cấp mật khẩu ngân hàng cho họ",
    optC: "Bình tĩnh cúp máy và trình báo cơ quan Công an gần nhất",
    optD: "Bấm vào đường link lạ họ gửi qua Zalo",
    answer: "C",
  },
  {
    deck: "Bộ đề 2",
    question:
      "Thanh toán không dùng tiền mặt mang lại lợi ích thiết thực nào cho các hộ gia đình?",
    optA: "Nhanh chóng, chính xác, an toàn và dễ quản lý chi tiêu",
    optB: "Không cần kết nối mạng vẫn quét mã được",
    optC: "Miễn phí toàn bộ hóa đơn mua sắm",
    optD: "Không cần bảo mật điện thoại",
    answer: "A",
  },
  {
    deck: "Bộ đề 2",
    question:
      "Tính năng xác thực hai lớp (2FA) trên các ứng dụng mạng xã hội và ngân hàng có tác dụng gì?",
    optA: "Làm chậm tốc độ điện thoại",
    optB: "Tăng cường bảo mật, ngăn chặn truy cập trái phép dù lộ mật khẩu",
    optC: "Tự động đăng bài lên trang cá nhân",
    optD: "Xóa danh bạ điện thoại",
    answer: "B",
  },
  {
    deck: "Bộ đề 2",
    question:
      "Mã QR dùng trong thanh toán điện tử viết tắt từ cụm từ tiếng Anh nào?",
    optA: "Quick Response (Phản hồi nhanh)",
    optB: "Quality Record (Bản ghi chất lượng)",
    optC: "Question Reply (Trả lời câu hỏi)",
    optD: "Quick Radio (Sóng vô tuyến nhanh)",
    answer: "A",
  },
  {
    deck: "Bộ đề 2",
    question:
      "Ứng dụng nào của ngành Thuế hỗ trợ cá nhân tra cứu và quyết toán thuế thu nhập cá nhân trên điện thoại?",
    optA: "eTax Mobile",
    optB: "VNeID",
    optC: "VssID",
    optD: "EVNCPC CSKH",
    answer: "A",
  },
  // BỘ ĐỀ 3
  {
    deck: "Bộ đề 3",
    question:
      "Ba trụ cột chính của tiến trình Chuyển đổi số Quốc gia tại Việt Nam bao gồm những gì?",
    optA: "Chính phủ số, Kinh tế số và Xã hội số",
    optB: "Nông nghiệp số, Du lịch số và Thể thao số",
    optC: "Giáo dục số, Y tế số và Giao thông số",
    optD: "Thương mại số, Ngân hàng số và Giải trí số",
    answer: "A",
  },
  {
    deck: "Bộ đề 3",
    question:
      "Tổ Công nghệ số cộng đồng tại các thôn, buôn, tổ dân phố có nhiệm vụ chính là gì?",
    optA: "Bán thiết bị điện thoại di động",
    optB: "Hướng dẫn, hỗ trợ người dân cài đặt và sử dụng các nền tảng số thiết yếu",
    optC: "Thu tiền cước viễn thông hằng tháng",
    optD: "Sửa chữa phần cứng máy tính",
    answer: "B",
  },
  {
    deck: "Bộ đề 3",
    question:
      "Công nghệ giả mạo khuôn mặt và giọng nói trong các cuộc gọi video lừa đảo hiện nay thường được gọi là gì?",
    optA: "Deepfake",
    optB: "Bluetooth",
    optC: "Wi-Fi 6",
    optD: "Cloud Storage",
    answer: "A",
  },
  {
    deck: "Bộ đề 3",
    question:
      "Thẻ Căn cước công dân gắn chip điện tử lưu trữ những thông tin sinh trắc học cơ bản nào?",
    optA: "Chỉ lưu trữ chiều cao và cân nặng",
    optB: "Ảnh chân dung và vân tay của công dân",
    optC: "Lịch sử mua sắm siêu thị",
    optD: "Mật khẩu mạng xã hội",
    answer: "B",
  },
  {
    deck: "Bộ đề 3",
    question:
      "Hồ sơ sức khỏe điện tử giúp người dân và gia đình được hưởng lợi ích gì khi đi khám chữa bệnh?",
    optA: "Không cần bác sĩ khám bệnh",
    optB: "Lưu trữ lịch sử khám bệnh, tiêm chủng, đơn thuốc giúp chẩn đoán chính xác và liên thông",
    optC: "Tự động miễn phí mọi loại thuốc ngoại nhập",
    optD: "Thay thế hoàn toàn việc tập thể dục",
    answer: "B",
  },
  // BỘ ĐỀ 4
  {
    deck: "Bộ đề 4",
    question: "Một Công dân số tích cực cần trang bị những yếu tố cốt lõi nào?",
    optA: "Sở hữu càng nhiều điện thoại đắt tiền càng tốt",
    optB: "Có danh tính số (VNeID), phương tiện thanh toán số và kỹ năng an toàn thông tin",
    optC: "Dành 15 tiếng mỗi ngày để lướt mạng xã hội",
    optD: "Tham gia tất cả các hội nhóm không rõ nguồn gốc",
    answer: "B",
  },
  {
    deck: "Bộ đề 4",
    question:
      "Tiện ích Thông báo lưu trú trên ứng dụng VNeID giúp công dân thực hiện thủ tục gì?",
    optA: "Đăng ký tạm trú, khai báo lưu trú trực tuyến mà không cần đến trực tiếp cơ quan Công an",
    optB: "Đặt vé máy bay quốc tế",
    optC: "Mua bảo hiểm xe máy",
    optD: "Đăng ký lắp đặt mạng Internet",
    answer: "A",
  },
  {
    deck: "Bộ đề 4",
    question:
      "Khi bị mất điện thoại có cài đặt ứng dụng ngân hàng và VNeID, việc đầu tiên cần làm ngay là gì?",
    optA: "Chờ vài ngày xem ai nhặt được trả lại",
    optB: "Liên hệ ngay nhà mạng để khóa SIM và gọi tổng đài ngân hàng khóa khẩn cấp dịch vụ",
    optC: "Đăng bài lên Facebook kèm mật khẩu điện thoại",
    optD: "Không cần làm gì vì điện thoại đã tắt nguồn",
    answer: "B",
  },
  {
    deck: "Bộ đề 4",
    question:
      "Nền tảng học trực tuyến mở đại trà (MOOCs) giúp các thành viên trong gia đình điều gì?",
    optA: "Học tập suốt đời, nâng cao kiến thức và kỹ năng mọi lúc, mọi nơi",
    optB: "Thay thế hoàn toàn trường tiểu học",
    optC: "Chỉ dành cho các chuyên gia lập trình",
    optD: "Tự động cấp bằng đại học không cần thi",
    answer: "A",
  },
  {
    deck: "Bộ đề 4",
    question:
      "Sử dụng thiết bị thông minh (Smart Home) có kết nối Internet trong gia đình cần lưu ý điều gì về bảo mật?",
    optA: "Giữ nguyên mật khẩu mặc định của nhà sản xuất (như admin/123456)",
    optB: "Đổi mật khẩu mặc định ngay khi lắp đặt và cập nhật phần mềm chính hãng định kỳ",
    optC: "Chia sẻ quyền điều khiển camera trong nhà cho người lạ",
    optD: "Tắt hết các tính năng bảo mật Wi-Fi",
    answer: "B",
  },
  // BỘ ĐỀ 5
  {
    deck: "Bộ đề 5",
    question:
      "Chủ đề xuyên suốt của công cuộc Chuyển đổi số lấy ai làm trung tâm?",
    optA: "Lấy các tập đoàn công nghệ nước ngoài làm trung tâm",
    optB: "Lấy người dân và doanh nghiệp làm trung tâm, chủ thể và mục tiêu của sự phát triển",
    optC: "Chỉ lấy máy móc và phần mềm làm trung tâm",
    optD: "Chỉ tập trung vào khu vực đô thị lớn",
    answer: "B",
  },
  {
    deck: "Bộ đề 5",
    question:
      "Đâu là cách kiểm tra thông tin thẻ Bảo hiểm y tế đã được tích hợp khi đi khám bệnh mà không cần mang thẻ giấy?",
    optA: "Sử dụng thẻ CCCD gắn chip hoặc xuất trình trên ứng dụng VssID / VNeID",
    optB: "Đọc họ tên cho nhân viên bảo vệ",
    optC: "Mang theo hóa đơn tiền nước",
    optD: "Chụp ảnh thẻ BHYT của người khác",
    answer: "A",
  },
  {
    deck: "Bộ đề 5",
    question:
      "Khi cài đặt ứng dụng trên điện thoại Android, người dùng tuyệt đối tránh thao tác nào để không bị nhiễm mã độc?",
    optA: "Tải ứng dụng từ cửa hàng Google Play (CH Play) chính thức",
    optB: "Tải và cài đặt các file đuôi .APK trôi nổi qua đường link lạ và cấp quyền Trợ năng",
    optC: "Cập nhật hệ điều hành chính thức",
    optD: "Kiểm tra dung lượng bộ nhớ máy",
    answer: "B",
  },
  {
    deck: "Bộ đề 5",
    question:
      "Khi phát hiện trang web hoặc tài khoản mạng xã hội có dấu hiệu lừa đảo trực tuyến, người dân có thể cảnh báo tại đâu?",
    optA: "khonggianmang.vn (hoặc chongluadao.vn)",
    optB: "google.com",
    optC: "youtube.com",
    optD: "wikipedia.org",
    answer: "A",
  },
  {
    deck: "Bộ đề 5",
    question:
      "Mục tiêu cốt lõi của mô hình Gia đình số trong xã hội hiện đại là gì?",
    optA: "Mỗi thành viên chỉ giao tiếp với nhau qua tin nhắn",
    optB: "Mỗi gia đình là một tế bào số an toàn, văn minh, biết ứng dụng công nghệ để nâng cao chất lượng cuộc sống",
    optC: "Thay thế hoàn toàn các bữa cơm gia đình bằng thiết bị điện tử",
    optD: "Mua sắm thật nhiều thiết bị công nghệ đắt đỏ",
    answer: "B",
  },
];
