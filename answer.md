                                                                                                                      
  1. Về scope sử dụng:                                                                                                  
    - Tôi muốn một hệ thống có thể dùng lại cho các dự án khác (mua nhà, sinh con, du lịch...)?                                                                                                             
    - Có bao nhiêu người sẽ dùng app này? -> cả gia đình                                           
  2. Về Google Sheets làm Database:                                                                                     
    - Bạn có thực sự cần Google Sheets làm "source of truth" không? Hay chỉ cần export/import từ Sheets? 
		Tôi cần google sheet để kéo data real time về như khi tôi đưa file đi thu thập ý kiến có ai đi tham dự không để nắm số lượng real time, và cũng cần import/export từ sheets luôn                       
  3. Về tính năng ưu tiên:                                                                                              
    - Trong các tính năng (Task, Budget, Guest, Timeline) Tôi muốn mọi thứ đáp ứng đủ mọi tiêu chí đã xây dựng thì tất cả đều quan trọng áp dụng được                             
    - Deadline thực tế của dự án này là khi nào?  Thoải mái thời gian                                                                      
                                                                                                                        
  Đánh giá ý tưởng ban đầu                                                                                              
                                                                                                                        
  Điểm tốt ✓                                                                                                            
                                                                                                                        
  - Phân tách rõ các module (Task, Guest, Budget)                                                                       
  - Có timeline management với Gantt/Calendar view                                                                      
  - Automation với Google Apps Script                                                                                   
                                                                                                                        
  Điểm cần cải thiện ✗                                                                                                  
                                                                                                                        
  1. Google Sheets làm Database - Rủi ro cao:                                                                           
  - Rate limit: 100 requests/100 seconds/user                                                                           
  - Concurrent writes có thể gây data conflicts                                                                         
  - Không có transactions, rollback                                                                                     
  - Schema không strict → dễ nhập sai data                                                                              
                                                                                                                        
  Đề xuất: Dùng Supabase (PostgreSQL miễn phí) làm DB chính, sync 1 chiều sang Google Sheets để bạn vẫn xem được trên   
  Sheets khi cần.                                                                                                       
                                                                                                                        
  2. Thiếu Authentication:                                                                                              
  - Idea không đề cập ai được phép truy cập. Này là ứng dụng quản lý nên phần nào của bản thân thì có thể truy cập thoải mái còn người khác sẽ không truy cập được nếu chưa có sự cấp quyền                                                                         
  - Nếu deploy public thì ai cũng xem được danh sách khách mời-> cần cấp quyền                                                        
                                                                                                                        
  3. Thiếu Offline Support:                                                                                             
  - Khi đi phát thiệp ở vùng mạng yếu → app không dùng được                                                             
  - Check-in ngày cưới mà mất mạng = thảm họa                                                                           
                                                                                                                        
  4. Thiếu tính năng quan trọng:                                                                                        
  - Báo cáo & Analytics: So sánh budget vs actual                                                                       
  - Collaboration: Assign task cho người khác, comments                                                                 
  - Notifications: Push notification thay vì chỉ email                                                                  
  - Photo/File attachments: Lưu ảnh venue, hợp đồng                                                                     
  - Template: Bộ task mẫu cho đám cưới để không phải nhập từ đầu                                                        
                                                                                                                        
  Đề xuất kiến trúc mới                                                                                                 
                                                                                                                        
  ┌─────────────────────────────────────────────────────────────┐                                                       
  │                      Next.js App                            │                                                       
  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │                                                        
  │  │Dashboard│ │  Tasks  │ │ Guests  │ │ Budget  │           │                                                        
  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │                                                        
  └─────────────────────────────────────────────────────────────┘                                                       
                              │                                                                                         
                              ▼                                                                                         
  ┌─────────────────────────────────────────────────────────────┐                                                       
  │                    Supabase                                 │                                                       
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │                                                        
  │  │PostgreSQL│  │   Auth   │  │ Realtime │                  │                                                        
  │  └──────────┘  └──────────┘  └──────────┘                  │                                                        
  └─────────────────────────────────────────────────────────────┘                                                       
                              │                                                                                         
                ┌─────────────┴─────────────┐                                                                           
                ▼                           ▼                                                                           
       ┌────────────────┐          ┌────────────────┐                                                                   
       │  Google Sheets │          │  Google Forms  │                                                                   
       │  (Export/View) │          │    (RSVP)      │                                                                   
       └────────────────┘          └────────────────┘                                                                   
                                                                                                                        
  Tính năng đề xuất thêm                                                                                                
  ┌──────────────────┬──────────────────────────────────────────┬────────────┐                                          
  │    Tính năng     │                  Mô tả                   │  Ưu tiên   │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ PWA + Offline    │ Dùng được khi mất mạng, sync khi có mạng │ Cao        │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ QR Check-in      │ Mỗi khách có QR riêng, scan để check-in  │ Cao        │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ Budget Analytics │ Biểu đồ chi tiêu theo category           │ Trung bình │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ Task Templates   │ Bộ task mẫu cho đám cưới chuẩn           │ Trung bình │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ Multi-language   │ Tiếng Việt + Tiếng Anh                   │ Thấp       │                                          
  ├──────────────────┼──────────────────────────────────────────┼────────────┤                                          
  │ Photo Gallery    │ Lưu ảnh venue, váy cưới, etc.            │ Thấp       │                                          
  └──────────────────┴──────────────────────────────────────────┴────────────┘                                          
  ---                                                                                                                   
  Bạn nghĩ sao về những đề xuất này? Đặc biệt là việc thay Google Sheets bằng Supabase - bạn có thể chấp nhận được      
  không?
	Ở đây tôi muốn dùng google sheet là để tôi tạo form khảo sát lấy số lượng + tên người tham dự rồi mới lưu lại file sheet từ file sheet real time đó tôi sẽ update lại vào hệ thống để quản lý cho tiện đỡ mất công