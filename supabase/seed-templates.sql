-- Seed system templates for Phase 2
-- Run this in Supabase SQL Editor after creating the templates table

INSERT INTO templates (name, type, description, tasks, budget_categories, is_system) VALUES

-- Wedding Template
('Đám cưới - Chuẩn bị toàn diện', 'wedding', 'Template hoàn chỉnh cho việc lên kế hoạch đám cưới với đầy đủ các công việc và danh mục ngân sách',
'[
  {"title": "Chọn ngày cưới và đặt lịch", "category": "Lên kế hoạch", "priority": "urgent"},
  {"title": "Lập danh sách khách mời", "category": "Khách mời", "priority": "high"},
  {"title": "Tìm và đặt địa điểm tổ chức", "category": "Địa điểm", "priority": "urgent", "estimated_cost": 50000000},
  {"title": "Chọn và đặt nhà hàng/tiệc", "category": "Địa điểm", "priority": "high", "estimated_cost": 100000000},
  {"title": "Thuê wedding planner (nếu cần)", "category": "Lên kế hoạch", "priority": "medium", "estimated_cost": 20000000},
  {"title": "Chọn váy cưới/vest", "category": "Trang phục", "priority": "high", "estimated_cost": 30000000},
  {"title": "Đặt nhiếp ảnh & quay phim", "category": "Lưu niệm", "priority": "high", "estimated_cost": 25000000},
  {"title": "Thiết kế và in thiệp cưới", "category": "Khách mời", "priority": "medium", "estimated_cost": 5000000},
  {"title": "Đặt hoa và trang trí", "category": "Trang trí", "priority": "medium", "estimated_cost": 15000000},
  {"title": "Book ban nhạc/DJ", "category": "Giải trí", "priority": "medium", "estimated_cost": 10000000},
  {"title": "Đặt xe cưới", "category": "Vận chuyển", "priority": "medium", "estimated_cost": 5000000},
  {"title": "Làm tóc và makeup", "category": "Trang phục", "priority": "medium", "estimated_cost": 5000000},
  {"title": "Chuẩn bị quà cảm ơn khách", "category": "Khách mời", "priority": "low", "estimated_cost": 10000000},
  {"title": "Gửi thiệp mời", "category": "Khách mời", "priority": "high"},
  {"title": "Theo dõi RSVP", "category": "Khách mời", "priority": "high"},
  {"title": "Xác nhận sắp xếp bàn tiệc", "category": "Địa điểm", "priority": "medium"},
  {"title": "Tổng duyệt trước ngày cưới", "category": "Lên kế hoạch", "priority": "high"},
  {"title": "Chuẩn bị nhẫn cưới", "category": "Trang phục", "priority": "urgent", "estimated_cost": 20000000}
]'::jsonb,
'[
  {"name": "Địa điểm & Tiệc", "allocated_amount": 150000000, "color": "#ef4444"},
  {"name": "Trang phục & Làm đẹp", "allocated_amount": 50000000, "color": "#f97316"},
  {"name": "Nhiếp ảnh & Lưu niệm", "allocated_amount": 30000000, "color": "#eab308"},
  {"name": "Trang trí & Hoa", "allocated_amount": 20000000, "color": "#22c55e"},
  {"name": "Giải trí", "allocated_amount": 15000000, "color": "#3b82f6"},
  {"name": "Khách mời & Quà", "allocated_amount": 20000000, "color": "#8b5cf6"},
  {"name": "Khác", "allocated_amount": 15000000, "color": "#6b7280"}
]'::jsonb,
TRUE),

-- House Purchase Template
('Mua nhà - Quy trình đầy đủ', 'house', 'Template cho quá trình tìm kiếm và mua nhà với các bước chi tiết',
'[
  {"title": "Xác định ngân sách và khả năng tài chính", "category": "Tài chính", "priority": "urgent"},
  {"title": "Nghiên cứu khu vực muốn mua", "category": "Tìm kiếm", "priority": "high"},
  {"title": "Liên hệ ngân hàng về vay mua nhà", "category": "Tài chính", "priority": "high"},
  {"title": "Chuẩn bị hồ sơ vay vốn", "category": "Tài chính", "priority": "high"},
  {"title": "Tìm môi giới bất động sản", "category": "Tìm kiếm", "priority": "medium"},
  {"title": "Xem nhà và so sánh các lựa chọn", "category": "Tìm kiếm", "priority": "high"},
  {"title": "Kiểm tra pháp lý bất động sản", "category": "Pháp lý", "priority": "urgent"},
  {"title": "Đàm phán giá", "category": "Giao dịch", "priority": "high"},
  {"title": "Đặt cọc", "category": "Giao dịch", "priority": "urgent", "estimated_cost": 100000000},
  {"title": "Ký hợp đồng mua bán", "category": "Pháp lý", "priority": "urgent"},
  {"title": "Hoàn tất thủ tục vay", "category": "Tài chính", "priority": "high"},
  {"title": "Thanh toán và nhận nhà", "category": "Giao dịch", "priority": "urgent"},
  {"title": "Sang tên sổ đỏ", "category": "Pháp lý", "priority": "high", "estimated_cost": 50000000},
  {"title": "Sửa chữa/cải tạo (nếu cần)", "category": "Cải tạo", "priority": "medium", "estimated_cost": 100000000},
  {"title": "Mua sắm nội thất", "category": "Nội thất", "priority": "medium", "estimated_cost": 150000000},
  {"title": "Chuyển nhà", "category": "Chuyển nhà", "priority": "medium", "estimated_cost": 10000000}
]'::jsonb,
'[
  {"name": "Giá nhà", "allocated_amount": 3000000000, "color": "#ef4444"},
  {"name": "Đặt cọc", "allocated_amount": 300000000, "color": "#f97316"},
  {"name": "Phí pháp lý & Thuế", "allocated_amount": 100000000, "color": "#eab308"},
  {"name": "Sửa chữa & Cải tạo", "allocated_amount": 200000000, "color": "#22c55e"},
  {"name": "Nội thất", "allocated_amount": 200000000, "color": "#3b82f6"},
  {"name": "Phí môi giới", "allocated_amount": 50000000, "color": "#8b5cf6"},
  {"name": "Khác", "allocated_amount": 50000000, "color": "#6b7280"}
]'::jsonb,
TRUE),

-- Travel Template
('Du lịch - Kế hoạch chi tiết', 'travel', 'Template lập kế hoạch chuyến du lịch hoàn hảo',
'[
  {"title": "Chọn điểm đến và thời gian", "category": "Lên kế hoạch", "priority": "urgent"},
  {"title": "Nghiên cứu điểm đến", "category": "Lên kế hoạch", "priority": "high"},
  {"title": "Đặt vé máy bay/tàu xe", "category": "Di chuyển", "priority": "urgent", "estimated_cost": 10000000},
  {"title": "Đặt khách sạn/chỗ ở", "category": "Chỗ ở", "priority": "urgent", "estimated_cost": 8000000},
  {"title": "Làm visa (nếu cần)", "category": "Giấy tờ", "priority": "urgent", "estimated_cost": 2000000},
  {"title": "Mua bảo hiểm du lịch", "category": "Giấy tờ", "priority": "high", "estimated_cost": 500000},
  {"title": "Lập lịch trình chi tiết", "category": "Lên kế hoạch", "priority": "high"},
  {"title": "Đặt tour/hoạt động", "category": "Hoạt động", "priority": "medium", "estimated_cost": 5000000},
  {"title": "Chuẩn bị hành lý", "category": "Chuẩn bị", "priority": "medium"},
  {"title": "Đổi tiền/mang thẻ quốc tế", "category": "Tài chính", "priority": "high"},
  {"title": "Thông báo ngân hàng về chuyến đi", "category": "Tài chính", "priority": "medium"},
  {"title": "Sạc pin thiết bị điện tử", "category": "Chuẩn bị", "priority": "low"},
  {"title": "In vé và giấy tờ quan trọng", "category": "Giấy tờ", "priority": "medium"},
  {"title": "Cài app bản đồ offline", "category": "Chuẩn bị", "priority": "low"}
]'::jsonb,
'[
  {"name": "Vé máy bay/Di chuyển", "allocated_amount": 15000000, "color": "#ef4444"},
  {"name": "Chỗ ở", "allocated_amount": 10000000, "color": "#f97316"},
  {"name": "Ăn uống", "allocated_amount": 5000000, "color": "#eab308"},
  {"name": "Hoạt động & Tour", "allocated_amount": 8000000, "color": "#22c55e"},
  {"name": "Mua sắm", "allocated_amount": 5000000, "color": "#3b82f6"},
  {"name": "Visa & Bảo hiểm", "allocated_amount": 3000000, "color": "#8b5cf6"},
  {"name": "Dự phòng", "allocated_amount": 4000000, "color": "#6b7280"}
]'::jsonb,
TRUE),

-- Event Template
('Sự kiện - Tổ chức chuyên nghiệp', 'event', 'Template tổ chức sự kiện từ A đến Z',
'[
  {"title": "Xác định mục tiêu và quy mô sự kiện", "category": "Lên kế hoạch", "priority": "urgent"},
  {"title": "Lập ngân sách chi tiết", "category": "Tài chính", "priority": "urgent"},
  {"title": "Chọn ngày và địa điểm", "category": "Địa điểm", "priority": "urgent"},
  {"title": "Đặt địa điểm", "category": "Địa điểm", "priority": "high", "estimated_cost": 20000000},
  {"title": "Lập danh sách khách mời", "category": "Khách mời", "priority": "high"},
  {"title": "Thiết kế chương trình", "category": "Nội dung", "priority": "high"},
  {"title": "Mời diễn giả/nghệ sĩ", "category": "Nội dung", "priority": "high", "estimated_cost": 15000000},
  {"title": "Thiết kế và in ấn tài liệu", "category": "Marketing", "priority": "medium", "estimated_cost": 3000000},
  {"title": "Đặt catering/đồ ăn", "category": "F&B", "priority": "high", "estimated_cost": 10000000},
  {"title": "Thuê âm thanh ánh sáng", "category": "Kỹ thuật", "priority": "high", "estimated_cost": 8000000},
  {"title": "Trang trí sự kiện", "category": "Trang trí", "priority": "medium", "estimated_cost": 5000000},
  {"title": "Gửi thư mời", "category": "Khách mời", "priority": "high"},
  {"title": "Theo dõi đăng ký", "category": "Khách mời", "priority": "medium"},
  {"title": "Họp tổng duyệt", "category": "Lên kế hoạch", "priority": "high"},
  {"title": "Setup ngày sự kiện", "category": "Kỹ thuật", "priority": "urgent"},
  {"title": "Chụp ảnh/quay phim sự kiện", "category": "Marketing", "priority": "medium", "estimated_cost": 5000000}
]'::jsonb,
'[
  {"name": "Địa điểm", "allocated_amount": 25000000, "color": "#ef4444"},
  {"name": "F&B (Ăn uống)", "allocated_amount": 15000000, "color": "#f97316"},
  {"name": "Kỹ thuật & Âm thanh", "allocated_amount": 10000000, "color": "#eab308"},
  {"name": "Diễn giả & Nghệ sĩ", "allocated_amount": 20000000, "color": "#22c55e"},
  {"name": "Trang trí", "allocated_amount": 8000000, "color": "#3b82f6"},
  {"name": "Marketing & In ấn", "allocated_amount": 5000000, "color": "#8b5cf6"},
  {"name": "Dự phòng", "allocated_amount": 7000000, "color": "#6b7280"}
]'::jsonb,
TRUE);
