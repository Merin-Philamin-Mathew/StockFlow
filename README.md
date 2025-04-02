# StockFlow

StockFlow is a **Product Inventory System** with **Stock Management** that allows users to create, list, and manage products along with their variants and stock levels. The project consists of a **Django** backend and a **React.js** frontend hosted on **AWS** and **Vercel**, respectively.

## Features
- **Product Management**: Create, update, and list products.
- **Variant & Sub-Variant Handling**: Manage different product variations.
- **Stock Management**: Add and remove stock levels efficiently.
- **Authentication**: Secure API access.
- **Pagination & Error Handling**: Optimized queries and responses.
- **Logging & Monitoring**: API usage tracking.

---

## **Tech Stack**
### Backend:
- **Django & Django REST Framework**
- **PostgreSQL**
- **Gunicorn & Nginx**
- **AWS EC2 (Hosting)**

### Frontend:
- **React.js** (Vite + Tailwind CSS)
- **Redux for State Management**
- **Vercel (Hosting)**

---

## **Setup & Installation**

### **Backend Setup (Django)**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/StockFlowBackend.git
   cd StockFlowBackend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the root directory with the following values:
   ```env
   SECRET_KEY=your_secret_key
   DEBUG=False
   ALLOWED_HOSTS=your_domain.com
   POSTGRES_DB=stockflow
   POSTGRES_USER=your_user
   POSTGRES_PASSWORD=your_password
   DB_HOST=your_db_host
   DB_PORT=5432
   CSRF_COOKIE_DOMAIN=your_domain.com
   CSRF_COOKIE_SECURE=True
   SESSION_COOKIE_SECURE=True
   ```

5. **Apply migrations and create a superuser:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run the server locally:**
   ```bash
   python manage.py runserver
   ```

### **Frontend Setup (React.js)**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/StockFlowFrontend.git
   cd StockFlowFrontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://api-stock-flow.merinphilamin.site
   ```

4. **Run the frontend locally:**
   ```bash
   npm run dev
   ```

---

## **Deployment**

### **Backend Deployment (AWS + Gunicorn + Nginx)**
1. **Copy files to the server:**
   ```bash
   scp -r StockFlowBackend ubuntu@your-aws-ip:/home/ubuntu/
   ```

2. **Restart services:**
   ```bash
   sudo systemctl restart gunicorn
   sudo systemctl restart nginx
   ```

### **Frontend Deployment (Vercel)**
1. **Login to Vercel:**
   ```bash
   vercel login
   ```
2. **Deploy the project:**
   ```bash
   vercel --prod
   ```

---

## **API Endpoints**

### **1. Create Product**
**Endpoint:** `POST /api/products/`
```json
{
    "name": "Shirt",
    "variants": [
        { "name": "size", "options": ["S", "M", "L"] },
        { "name": "color", "options": ["Red", "Blue", "Black"] }
    ]
}
```

### **2. List Products**
**Endpoint:** `GET /api/products/`

### **3. Add Stock (Purchase)**
**Endpoint:** `POST /api/stock/add/`
```json
{
    "product_id": "123",
    "variant_id": "abc",
    "quantity": 10
}
```

### **4. Remove Stock (Sale)**
**Endpoint:** `POST /api/stock/remove/`
```json
{
    "product_id": "123",
    "variant_id": "abc",
    "quantity": 5
}
```

---

## **Improvements & Future Enhancements**
- **Category Management**: Categorize products.
- **Product Image Upload**: Track product images.
- **Authentication & Authorization**: Secure user roles.

---

## **Contributing**
If you’d like to contribute, feel free to open an issue or submit a pull request.

---
