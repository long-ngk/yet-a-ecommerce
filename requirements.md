# Yêu Cầu Thiết Kế Hệ Thống E-Commerce Micro-Frontends (MFEs)

## Tổng Quan Nhiệm Vụ
Thiết kế và triển khai nền tảng Thương mại điện tử dựa trên kiến trúc Micro-Frontends. Hệ thống sẽ được phân tách thành các phân hệ (domain) do các team độc lập phụ trách:
* **Shell (Ứng dụng gốc)**
* **Products (Sản phẩm)**
* **Orders (Đơn hàng)**
* **Account (Tài khoản)**
* **Checkout (Thanh toán)**

---

## Phần 1: Công Nghệ & Phân Chia Phân Hệ (Tech Stack & Core Domains)

Toàn bộ hệ thống sẽ được hiện thực hóa bằng giải pháp **Next.js Multiple Zones** để đảm bảo tính độc lập khi triển khai của từng MFE nhưng vẫn giữ trải nghiệm liền mạch.

### 1. Phân hệ Điều phối (Shell MFE)
Đóng vai trò là khung xương của toàn bộ hệ thống, chịu trách nhiệm cho các tính năng nền tảng:
* **Giao diện tổng thể (Global Layout):** Định hình bộ nhận diện, header, footer chung cho toàn trang.
* **Thanh điều hướng (Navigation Menu):** Menu chính giúp chuyển đổi qua lại giữa các MFE.
* **Quản lý phiên đăng nhập (Authentication State):** Lưu trữ và đồng bộ trạng thái đăng nhập của người dùng trên toàn hệ thống.
* **Định tuyến luồng (Routing):** Cấu hình định tuyến cấu trúc (Reverse Proxy/Zones) để phân phối request đến đúng MFE.

### 2. Phân hệ Sản phẩm (Products MFE)
Chịu trách nhiệm hiển thị và tương tác với danh mục hàng hóa:
* **Danh sách sản phẩm (Product List):** Hiển thị, bộ lọc, tìm kiếm sản phẩm.
* **Chi tiết sản phẩm (Product Detail):** Thông tin kỹ thuật, hình ảnh, giá cả của từng mặt hàng.
* **Thêm vào giỏ hàng (Add to Cart):** Kích hoạt hành động lưu trữ sản phẩm vào giỏ.

### 3. Phân hệ Quản lý Đơn hàng (Orders MFE)
Chịu trách nhiệm theo duyệt lịch sử mua sắm:
* **Danh sách đơn hàng (Order List):** Tổng hợp các đơn hàng đã và đang xử lý.
* **Chi tiết đơn hàng (Order Detail):** Trạng thái vận chuyển, thông tin thanh toán và các mặt hàng trong từng hóa đơn cụ thể.

### 4. Phân hệ Tài khoản (Account MFE)
Tập trung vào trải nghiệm cá nhân hóa của người dùng:
* **Thông tin người dùng (User Information):** Hiển thị hồ sơ cá nhân.
* **Cập nhật hồ sơ (Update Profile):** Cho phép chỉnh sửa thông tin liên hệ, địa chỉ, ảnh đại diện.

### 5. Phân hệ Thanh toán (Checkout MFE)
Xử lý chặng cuối của luồng mua sắm (Conversion Funnel):
* **Giỏ hàng (Shopping Cart):** Quản lý số lượng, xóa hoặc sửa đổi các mặt hàng đã chọn.
* **Tóm tắt thanh toán (Checkout Summary):** Tính toán tổng tiền, áp mã giảm giá và hoàn tất thủ tục đặt hàng.

---

## Phần 2: Cơ Chế Giao Tiếp Giữa Các MFE (Communication Techniques)

Để các ứng dụng Next.js độc lập có thể trao đổi dữ liệu mượt mà, yêu cầu triển khai **tối thiểu 2 trong số các cơ chế** sau:

* **Sự kiện tùy biến (Custom Events):** Sử dụng `CustomEvent` của Browser để truyền nhận dữ liệu bất đồng bộ giữa các vùng chạy (Runtime).
* **Trạng thái qua URL (URL State):** Tận dụng Query Parameters để đồng bộ hoặc truyền trạng thái khi chuyển trang (Ví dụ: `?cart_id=...` hoặc `?filter=...`).
* **Kho lưu trữ chia sẻ (Shared Store):** Thiết lập giải pháp quản lý trạng thái tập trung có khả năng chia sẻ xuyên biên giới các MFE (như LocalStorage/SessionStorage, Cookies hoặc Module Federation Shared Store).

---

## Phần 3: Thư Viện Giao Diện Dùng Chung (Shared UI Component Library)

Xây dựng các thành phần giao diện tái sử dụng (Reusable Components) để đảm bảo tính đồng bộ về UI/UX trên tất cả các Zone:

* **Button:** Component nút bấm chuẩn hóa (hỗ trợ nhiều loại variant: Primary, Secondary, Disabled...).
* **Card:** Khung hiển thị thông tin dạng khối (ứng dụng cho Product Card, Order Card).
* **Header:** Thành phần đầu trang dùng chung cho các phân hệ cần tái sử dụng bố cục.
* **Badge:** Biểu tượng hiển thị số lượng hoặc trạng thái (ví dụ: số lượng item trong giỏ hàng, trạng thái đơn hàng).