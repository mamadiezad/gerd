# 🌐 Gerd — شبکه اجتماعی خصوصی (Self-hosted)

> **Gerd** یه پلتفرم ارتباطی مثل Discord/Slack هستش که روی سرور خودت نصب میکنی.
> یه نفره راه میندازه، بقیه عضو میشن — بدون تحریم، بدون فیلتر، بدون محدودیت.

## 🎯 برای کیه؟

| مورد | توضیح |
|:-----|:-------|
| 🏢 **شرکت‌ها** | پلتفرم ارتباطی داخلی برای کارمندا |
| 🛒 **VPN فروش‌ها** | کامیونیتی مشتریهات توی یه پلتفرم خصوصی |
| 🎓 **مدرسه/دانشگاه** | کانال‌های جدا برای کلاس‌ها و اساتید |
| 👨‍👩‍👧‍👦 **گروه دوستانه** | جایگزین Discord با دیتای دست خودت |

## ✨ ویژگی‌ها

| ویژگی | توضیح |
|:------|:-------|
| 📢 **کانال‌ها** | متنی، اعلامیه با پین و ریپلای |
| 💬 **چت خصوصی** | پیام مستقیم با قابلیت حذف |
| 📸 **آپلود فایل** | عکس، فیلم، ویس، PDF تا ۲۰MB |
| 🔍 **جستجو** | جستجوی پیام‌ها و کاربران |
| 🎭 **ایموجی پیکر** | ۱۵۰+ ایموجی برای انتخاب |
| ✏️ **ویرایش پیام** | پست‌ها رو بعداً ویرایش کن |
| 👤 **پروفایل** | نام نمایشی و بیوگرافی |
| 📱 **ریسپانسیو** | سازگار با موبایل |
| 🔔 **اعلان** | نوتیفیکیشن داخلی |
| 🔐 **دعوت با کد** | فقط کسایی که کد دارن میان |
| 🐳 **داکر** | نصب با یه خط فرمان |



## 🚀 Deploy

### 🚀 One-Click Deploy (روی هر سرور اوبونتو/دبیان)

همه چی اتوماتیک: نصب Docker، کلون پروژه، MongoDB، Nginx، SSL و شروع سرویس.

```bash
# روی سرور SSH کن و اینارو بزن:
wget -O deploy.sh https://raw.githubusercontent.com/mamadiezad/gerd/main/deploy.sh
bash deploy.sh
```

### کانفیگ دستی

```bash
# 1. Clone
git clone https://github.com/mamadiezad/gerd.git
cd gerd

# 2. Copy and edit config
cp gerd.conf.example gerd.conf
nano gerd.conf    # domain, email, etc

# 3. Run deployer
bash deploy.sh
```

### 🐳 نصب معمولی با Docker
```bash
docker-compose up --build -d
```

### 📦 نصب معمولی (بدون Docker)
```bash
cp .env.example .env.local
# ویرایش .env.local
npm install
npm run dev
```

### 👤 اولین کاربر
اولین کسی که ثبت‌نام میکنه، نقش **superadmin** میگیره و بقیه با کد دعوت عضو میشن.

### 📋 Logs
```bash
docker-compose logs -f app    # logs app
docker-compose logs -f mongo  # logs database
```
## 🚀 شروع سریع

### با Docker

```bash
git clone https://github.com/mamadiezad/gerd.git
cd gerd
docker-compose up --build
```

### معمولی
```bash
git clone https://github.com/mamadiezad/gerd.git  
cd gerd
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

### اولین کاربر → سوپرادمین
اولین کسی که ثبت‌نام میکنه، نقش `superadmin` میگیره.

## 🏗️ ساختار پروژه

```
gerd/
├── src/
│   ├── pages/
│   │   ├── index.tsx        # ورود/ثبت‌نام
│   │   ├── app.tsx          # صفحه اصلی (کانال‌ها + چت)
│   │   ├── admin.tsx        # پنل مدیریت کاربران
│   │   └── api/
│   │       ├── auth/        # ورود، ثبت‌نام، پروفایل
│   │       ├── channel/     # کانال‌ها
│   │       ├── post/        # پست‌ها
│   │       ├── chat/        # چت خصوصی
│   │       └── superadmin/  # مدیریت کاربران
│   └── lib/
│       ├── config.ts        # تنظیمات
│       ├── db.ts            # 7 مدل دیتابیس
│       └── auth.ts          # میدلورهای احراز هویت
├── docker-compose.yml
└── package.json
```

---

<p align="center">ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz">Mohammad</a></p>
---

<p align="center">
  ساخته شده با ❤️ توسط <a href="https://t.me/llllxyz">Mohammad</a> | 
  <a href="https://github.com/mamadiezad/gerd"></a>
</p>
