# 🔧 Hướng dẫn Setup Environment Variables

## ✅ REQUIRED - BẮT BUỘC (App sẽ không chạy được nếu thiếu)

### 1. `NEXT_PUBLIC_MINIKIT_PROJECT_ID` ⭐⭐⭐
**Mục đích:** Project ID từ Coinbase Developer Platform để sử dụng MiniKit  
**Nơi dùng:** `components/providers.tsx` - MiniKitProvider  
**Cách lấy:**
1. Đăng ký tại: https://portal.cdp.coinbase.com/products/onchainkit
2. Tạo project mới
3. Copy **Project ID** (không phải API Key)

**Ví dụ:**
```env
NEXT_PUBLIC_MINIKIT_PROJECT_ID=abc123xyz456
```

---

### 2. `NEYNAR_API_KEY` ⭐⭐⭐
**Mục đích:** API key để authenticate users qua Neynar  
**Nơi dùng:** `lib/neynar.ts` - fetchUser() để lấy thông tin Farcaster user  
**Cách lấy:**
1. Đăng ký tại: https://neynar.com
2. Tạo API key trong dashboard
3. Copy API key

**Ví dụ:**
```env
NEYNAR_API_KEY=NEYNAR_API_KEY_abc123xyz456
```

**📌 Giải thích chi tiết:**
- **Neynar là gì?** Infrastructure platform cho Farcaster, cung cấp API để query dữ liệu Farcaster
- **Nhiệm vụ trong app:**
  1. **Lấy thông tin user từ FID:** Khi user sign in, bạn chỉ có `fid` (Farcaster ID). Neynar API giúp lấy thêm: username, display_name, pfp_url, **custody_address** (wallet address)
  2. **Verify signature:** Cần `custody_address` để verify signature có đúng của user không
- **Flow hoạt động:**
  ```
  User sign in → Frontend gửi fid + signature
  → Backend gọi Neynar API với NEYNAR_API_KEY
  → Lấy custody_address từ Neynar
  → Verify signature với custody_address
  → Tạo JWT token nếu hợp lệ
  ```
- **Tại sao cần?** Không có Neynar → không có `custody_address` → không verify được signature → authentication fail
- **Có thể thay thế?** Có thể dùng Farcaster Hub API trực tiếp (phức tạp hơn) hoặc Quick Auth (không cần Neynar), nhưng Neynar là cách đơn giản và phổ biến nhất

---

### 3. `JWT_SECRET` ⭐⭐⭐
**Mục đích:** Secret key để sign JWT tokens cho authentication  
**Nơi dùng:** 
- `middleware.ts` - verify JWT
- `app/api/auth/sign-in/route.ts` - sign JWT token

**Cách tạo:**
```bash
# Cách 1: OpenSSL (khuyến nghị)
openssl rand -base64 32

# Cách 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Cách 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Ví dụ:**
```env
JWT_SECRET=aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA=
```

**📌 Giải thích chi tiết:**
- **JWT_SECRET là gì?** Symmetric secret key (cùng key để sign và verify) dùng để:
  - **Sign:** Tạo JWT token khi user sign in
  - **Verify:** Xác thực JWT token khi user gọi API
- **Khác với Private Key của ví:**
  | JWT_SECRET | Private Key của Ví |
  |------------|-------------------|
  | Symmetric key (cùng key sign/verify) | Asymmetric key (private/public pair) |
  | Server giữ (chỉ server biết) | User giữ (chỉ user biết) |
  | Tạo session tokens | Sign blockchain transactions |
  | Nếu lộ → attacker tạo fake tokens | Nếu lộ → mất tiền trong ví |
- **Nhiệm vụ trong app:**
  1. **Khi user sign in:** Server tạo JWT token chứa thông tin user (fid, walletAddress) và dùng `JWT_SECRET` để **sign** token
  2. **Khi user gọi API:** Server dùng `JWT_SECRET` để **verify** token có hợp lệ không
- **Flow hoạt động:**
  ```
  User Sign In:
  1. User sign message với private key của ví (blockchain)
  2. Server verify signature với custody_address
  3. Server tạo JWT token với JWT_SECRET ← ĐÂY
  4. Gửi token về client (cookie)
  
  User gọi API:
  1. Client gửi token lên server
  2. Server verify token với JWT_SECRET ← ĐÂY
  3. Nếu hợp lệ → cho phép truy cập
  ```
- **Lưu ở đâu?**
  - **Local:** File `.env.local` (không commit vào git)
  - **Production:** Environment Variables trên hosting platform (Vercel/Netlify)
- **Mỗi app = 1 JWT_SECRET khác nhau:**
  - ✅ Mỗi app/project nên có `JWT_SECRET` riêng
  - ✅ Bảo mật tốt hơn (nếu một app lộ → app khác vẫn an toàn)
  - ✅ Tokens của app A không thể dùng cho app B
- **Bảo mật:**
  - ⚠️ Giữ bí mật: không commit vào git, không share
  - ⚠️ Dùng random string dài (32+ ký tự)
  - ⚠️ Khác nhau cho mỗi môi trường (dev/prod)

---

### 4. `NEXT_PUBLIC_URL` ⭐⭐⭐
**Mục đích:** URL của app (dùng cho frame metadata, notifications, etc)  
**Nơi dùng:**
- `app/page.tsx` - Frame metadata
- `lib/warpcast.ts` - Account association
- `lib/notification-client.ts` - Notifications

**Development:**
```env
# Local development (sẽ cần tunnel để test với Farcaster)
NEXT_PUBLIC_URL=http://localhost:3000

# Hoặc dùng ngrok/localtunnel
NEXT_PUBLIC_URL=https://xxxx.ngrok.io
```

**Production:**
```env
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

---

## ⚠️ OPTIONAL - TÙY CHỌN (Có thể bỏ qua)

### 5. `REDIS_URL` & `REDIS_TOKEN` ⚠️
**Mục đích:** Redis database cho notifications và webhooks  
**Nơi dùng:** `lib/redis.ts` - Background notifications  
**Tình trạng:** Có warning nhưng app vẫn chạy được (không crash)

**Cách setup (Upstash - Free tier):**
1. Đăng ký tại: https://upstash.com
2. Tạo Redis database
3. Copy URL và Token

**Ví dụ:**
```env
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-redis-token-here
```

**Có thể bỏ qua nếu:** Không cần notifications/webhooks

---

### 6. `NEXT_PUBLIC_FARCASTER_HEADER`, `PAYLOAD`, `SIGNATURE` ⚠️
**Mục đích:** Account association để users có thể "add" app vào profile  
**Nơi dùng:** `lib/warpcast.ts` - Generate manifest  
**Tình trạng:** Chỉ cần khi PUBLISH app lên Farcaster

**Cách lấy (SAU KHI CÓ NEXT_PUBLIC_URL):**
1. Deploy app hoặc dùng tunnel (ngrok)
2. Truy cập: https://warpcast.com/~/developers/mini-apps/manifest
3. Paste URL của bạn
4. Generate và copy 3 giá trị: `header`, `payload`, `signature`

**Ví dụ:**
```env
NEXT_PUBLIC_FARCASTER_HEADER=eyJmaBBiOjE3MzE4LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NzYwQjA0NDc5NjM4MTExNzNmRjg3YDPBYzA5OEJBQ0YxNzNCYkU0OCJ9
NEXT_PUBLIC_FARCASTER_PAYLOAD=eyJkb21haW4iOiJ4BWl0bGlzdC1xcy52ZXJjZWwuYXBwIn7
NEXT_PUBLIC_FARCASTER_SIGNATURE=MHhmNGQzN2M2OTk4NDIwZDNjZWVjYTNiODllYzJkMjAwOTkyMDEwOGVhNTFlYWI3NjAyN2QyMmM1MDVhNzIyMWY2NTRiYmRlZmQ0NGQwOWNiY2M2NmI2B7VmNGZiMmZiOGYzNDVjODVmNmQ3ZTVjNzI3OWNmMGY4ZTA2ODYzM2FjZjFi
```

**Có thể bỏ qua nếu:** Chỉ test local, chưa publish

---

### 7. `NEXT_PUBLIC_APP_ENV` ⚠️
**Mục đích:** Environment mode (development/production)  
**Nơi dùng:** `components/Eruda/index.tsx` - Debug tool  
**Default:** `"development"` (tự động nếu không set)

**Ví dụ:**
```env
NEXT_PUBLIC_APP_ENV=development
# hoặc
NEXT_PUBLIC_APP_ENV=production
```

**Có thể bỏ qua:** Sẽ dùng default "development"

---

## 📝 File .env.local Mẫu (Tối Thiểu)

```env
# ============================================
# REQUIRED - BẮT BUỘC PHẢI CÓ
# ============================================

# MiniKit Project ID
NEXT_PUBLIC_MINIKIT_PROJECT_ID=your-project-id-here

# Neynar API Key
NEYNAR_API_KEY=your-neynar-api-key-here

# JWT Secret (generate random)
JWT_SECRET=your-random-secret-at-least-32-chars-long

# App URL
NEXT_PUBLIC_URL=http://localhost:3000

# ============================================
# OPTIONAL - CÓ THỂ BỎ QUA
# ============================================

# Redis (chỉ cần nếu dùng notifications)
# REDIS_URL=
# REDIS_TOKEN=

# Farcaster Account Association (chỉ cần khi publish)
# NEXT_PUBLIC_FARCASTER_HEADER=
# NEXT_PUBLIC_FARCASTER_PAYLOAD=
# NEXT_PUBLIC_FARCASTER_SIGNATURE=

# Environment (có default)
# NEXT_PUBLIC_APP_ENV=development
```

---

## 🚀 Quick Start Checklist

- [ ] ✅ Lấy `NEXT_PUBLIC_MINIKIT_PROJECT_ID` từ Coinbase Developer Platform
- [ ] ✅ Lấy `NEYNAR_API_KEY` từ Neynar
- [ ] ✅ Tạo `JWT_SECRET` bằng openssl
- [ ] ✅ Set `NEXT_PUBLIC_URL` (localhost cho dev)
- [ ] ⚠️ (Optional) Setup Redis nếu cần notifications
- [ ] ⚠️ (Optional) Generate Farcaster credentials khi publish

---

## ❓ Troubleshooting

**App không chạy được?**
- Kiểm tra 4 biến REQUIRED đã có đầy đủ chưa
- Kiểm tra format không có khoảng trắng thừa
- Restart dev server sau khi thêm env vars

**Authentication không hoạt động?**
- Kiểm tra `NEYNAR_API_KEY` đúng chưa (có thể test bằng cách gọi Neynar API trực tiếp)
- Kiểm tra `JWT_SECRET` đủ dài (32+ chars) và không có khoảng trắng
- Kiểm tra `JWT_SECRET` giống nhau giữa sign-in và middleware (nếu khác → verify fail)
- Xem console log để debug: `Failed to fetch Farcaster user on Neynar` → NEYNAR_API_KEY sai

**Notifications không hoạt động?**
- Kiểm tra `REDIS_URL` và `REDIS_TOKEN` đã set chưa
- App vẫn chạy được nếu không có Redis (chỉ không có notifications)

