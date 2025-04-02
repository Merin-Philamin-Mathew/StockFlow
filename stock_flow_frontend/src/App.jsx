// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage/>
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/products" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" state={{ activeTab: "products" }} />
          </ProtectedRoute>
        } />
        {/* <Route path="/categories" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" state={{ activeTab: "categories" }} />
          </ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" state={{ activeTab: "stock" }} />
          </ProtectedRoute>
        } /> */}
      </Routes>
    </Router>
  );
}

export default App;