# 🗄️ NoCode Database Builder

> A Figma-style visual database schema designer for MySQL and MongoDB — no coding required!

![Status](https://img.shields.io/badge/Status-Under%20Development-yellow?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🚧 Currently Under Development

This project is actively being built. Stay tuned for updates!

---

## 🎯 What is this?

**NoCode Database Builder** is a web application that lets you visually design database schemas using a drag-and-drop interface — similar to Figma, but for databases!

### Key Features (Planned)

| Feature | Description |
|---------|-------------|
| 🖼️ **Infinite Canvas** | Pan and zoom through your database design |
| 📦 **Drag & Drop** | Drag tables/collections from sidebar onto canvas |
| ✏️ **Visual Editing** | Add columns, set data types, define constraints |
| 🔗 **Relationship Builder** | Create foreign keys (MySQL) or references (MongoDB) visually |
| 💾 **Auto-Save** | Real-time persistence of your work |
| 📤 **Export** | Generate SQL or JSON/Mongoose schemas |
| 🔄 **Real-time Sync** | Collaborate with Socket.IO |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js | React framework |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| shadcn/ui | UI components |
| React Flow | Canvas/nodes |
| React DnD | Drag and drop |
| Zustand | State management |
| Socket.IO Client | Real-time updates |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database |
| JWT + bcrypt | Authentication |
| Socket.IO | Real-time sync |
| Zod | Validation |

### Schema Generation
- Custom **SQL Generator** for MySQL
- Custom **JSON/Mongoose Schema Generator** for MongoDB

---

## 📁 Project Structure

```
nocode_db_generator/
├── frontend/          # Next.js application
│   ├── src/
│   │   └── app/       # App router pages
│   └── public/        # Static assets
│
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Database configuration
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── .env           # Environment variables
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TousifTamboli/nocode_db_generator.git
   cd nocode_db_generator
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your MongoDB URI and JWT secret
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open in browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

*More endpoints coming soon...*

---

## 🎨 Supported Databases

| Database | Table/Collection | Relationships | Export Format |
|----------|------------------|---------------|---------------|
| MySQL | Tables with columns | Foreign Keys | SQL DDL |
| MongoDB | Collections with fields | References/Embedded | JSON Schema / Mongoose |

---

## 🗺️ Roadmap

- [x] Project setup
- [x] Backend authentication (JWT)
- [ ] Frontend authentication UI
- [ ] Database type selector
- [ ] Infinite canvas workspace
- [ ] Drag & drop tables/collections
- [ ] Column/field editor
- [ ] Relationship builder
- [ ] SQL generator
- [ ] MongoDB schema generator
- [ ] Export functionality
- [ ] Real-time collaboration

---

## 👨‍💻 Author

**Tousif Tamboli**

- GitHub: [@TousifTamboli](https://github.com/TousifTamboli)

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <b>⭐ Star this repo if you find it interesting!</b>
</p>
