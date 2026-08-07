# 🌸 MERS Tassel — Handcrafted Accessories from Turkey

<div align="center">

**✨ Beautiful accessories crafted with love in Istanbul, Turkey ✨**

![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-green?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.14-red?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?style=for-the-badge&logo=bootstrap&logoColor=white)

</div>

---

## 📋 About

**MERS Tassel** is a full-stack e-commerce platform for selling handcrafted accessories including:

- 📿 **Necklaces** — Elegant chain & tassel designs
- 💎 **Pendants** — Crystal & gemstone pendants
- 👜 **Bag Accessories** — Charms, keychains & tassels
- ✨ **Jasuichi** — Traditional artisan pieces
- 💍 **Solid Azon** — Bold statement accessories
- 🎀 **Cute Accessories** — Adorable daily essentials

## 🏗️ Architecture

The project is split into two sections:

```
MERS_Tassel/
├── server/          # 🐍 Django + Django REST Framework (Backend API)
│   ├── mers_tassel/ # Django project settings
│   ├── products/    # Products & categories API
│   └── contact/     # Contact form API
│
├── client/          # ⚡ Next.js + Bootstrap 5 (Frontend)
│   └── src/
│       ├── app/     # Pages (Home, Products, About, Contact)
│       ├── components/ # Reusable UI components
│       └── lib/     # API utility functions
│
├── .gitignore
└── README.md
```

## 🎨 Design Features

- **Rose Gold & Plum** color palette with gold accents
- **Glassmorphism** navbar with blur effect
- **15+ CSS animations** (fade-in, float, shimmer, pulse, parallax)
- **Scroll-reveal** animations using Intersection Observer
- **Fully responsive** design for mobile, tablet, and desktop
- **Google Fonts** — Playfair Display + Poppins

## 📄 Pages

| Page | Description |
|------|-------------|
| 🏠 **Home** | Hero banner, featured products, categories, testimonials |
| 🛍️ **Products** | Product grid with category filters & search |
| 📖 **About Us** | Brand story, values, timeline, team |
| 📬 **Contact** | Contact form (posts to API), FAQ section |

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** and `pip`
- **Node.js 18+** and `npm`

### 1️⃣ Setup Backend (Django)

```bash
# Navigate to server directory
cd server

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed sample products
python manage.py seed_data

# Create admin user (optional)
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

The API will be running at **http://localhost:8000**

### 2️⃣ Setup Frontend (Next.js)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be running at **http://localhost:3000**

### 3️⃣ Visit the App

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/` | List all products |
| `GET` | `/api/products/?category=necklaces` | Filter by category |
| `GET` | `/api/products/?search=tassel` | Search products |
| `GET` | `/api/products/featured/` | Featured products |
| `GET` | `/api/products/{slug}/` | Product detail |
| `GET` | `/api/products/categories/` | All categories |
| `POST` | `/api/contact/` | Submit contact form |

## 🛠️ Tech Stack

### Backend
- **Python** — Programming language
- **Django** — Web framework
- **Django REST Framework** — API framework
- **django-cors-headers** — CORS handling
- **SQLite** — Database (dev)
- **Pillow** — Image processing

### Frontend
- **Next.js 14** — React framework (App Router)
- **Bootstrap 5** — CSS framework
- **CSS3 Animations** — Custom keyframe animations
- **JavaScript (ES6+)** — Fetch API for backend requests

## 📸 Screenshots

_Screenshots coming soon!_

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💖 Made with Love

Crafted with ❤️ in Turkey by **MERS Tassel** team.

---

<div align="center">
  <strong>⭐ Star this repo if you like it! ⭐</strong>
</div>
