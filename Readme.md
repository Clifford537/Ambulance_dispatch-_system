# 🚑 Emergency Dispatch System

## 📌 Project Overview
This is an **Emergency Dispatch System** built using **Node.js, Express, and MongoDB**. It allows admins to manage **ambulances, drivers, medics, and incidents**, while users can report incidents and request emergency assistance.

## ✨ Features
- **User Authentication** (Admin, Dispatcher, User, Driver, Medic)
- **Manage Users** (Register, Login, Role-based Access Control)
- **Ambulance Management** (CRUD Operations)
- **Driver & Medic Management** (Assign from Users, Update Roles)
- **Incident Reporting & Management**
- **Geospatial Queries** (Incident Location Tracking)
- **Admin Privileges** (Only Admins can delete/update certain records)

## 🏗️ Tech Stack
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Token)
- **Geolocation:** MongoDB 2dsphere index
- **Validation:** Express Validator, Bcrypt

## 🚀 Setup & Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Clifford537/Ambulance_dispatch-_system.git
cd Ambulance_dispatch-_system
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Setup Environment Variables
Create a **.env** file in the root directory and add:
```env
PORT=5000
MONGO_URI=mongodb+srv://your-mongodb-uri
JWT_SECRET=your_secret_key
```

### 4️⃣ Run the Server
```sh
npm start
```

Server runs on **http://127.0.0.1:5000**

## 🔗 API Endpoints

### **User Management**
| Method | Endpoint          | Description          | Access |
|--------|------------------|----------------------|--------|
| POST   | /api/users/register | Register a new user | Public |
| POST   | /api/users/login    | User login          | Public |

### **Driver Management**
| Method | Endpoint         | Description                      | Access |
|--------|-----------------|----------------------------------|--------|
| POST   | /api/drivers/create | Create a new driver (select from users) | Admin |
| GET    | /api/drivers       | Get all drivers                 | Admin |
| PUT    | /api/drivers/:id   | Update driver details           | Admin |
| DELETE | /api/drivers/:id   | Remove driver role from user    | Admin |

### **Medic Management**
| Method | Endpoint         | Description                      | Access |
|--------|-----------------|----------------------------------|--------|
| POST   | /api/medics/create | Create a new medic (select from users) | Admin |
| GET    | /api/medics       | Get all medics                 | Admin |
| PUT    | /api/medics/:id   | Update medic details           | Admin |
| DELETE | /api/medics/:id   | Remove medic role from user    | Admin |

### **Incident Management**
| Method | Endpoint           | Description                  | Access |
|--------|-------------------|------------------------------|--------|
| POST   | /api/incidents/create | Report a new incident       | Logged-in User |
| GET    | /api/incidents/view   | Get all incidents          | Admin |
| DELETE | /api/incidents/:id | Delete an incident          | Admin |

## 🛡️ Authentication & Authorization
- **JWT-based authentication** is used to protect routes.
- **Admin-only routes** ensure restricted access for sensitive operations.

## 📌 Contribution
1. Fork the repo
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request 🎉

## 📜 License
This project is licensed under the MIT License.

## 🌟 Support
For any issues, feel free to create an **issue** or open a **discussion** in this repository.

---
🚀 Happy Coding!

