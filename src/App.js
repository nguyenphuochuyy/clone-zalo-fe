import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { Navigate, Route, Router, Routes } from 'react-router-dom';
import LoginPage from './pages/Login/index.js';
import HomePage from './pages/Home/index.js';
import RegisterPage from './pages/Register/index.js';
import VerifyEmailPage from './pages/VerifyEmailPage/index.js';
import VerifyTokenPage from './pages/VerifyTokenPage/index.js';
import HomeChat from './pages/HomeChat/index.js';
const { Sider, Content } = Layout;

const App = () => {
  
  const token = localStorage.getItem('token'); // Lấy token từ localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!token); // Trạng thái xác thực
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true); // Nếu có token, đặt trạng thái xác thực là true
    } else {
      setIsAuthenticated(false); // Ngược lại, đặt trạng thái xác thực là false
    }
  }
, []); // Chạy lại khi token thay đổi
  return (
      <Routes>
        {/* Route trang chủ hoặc login dựa vào trãng thái đăng nhập */}
       <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" />
            ) : (
              <HomePage />
            )
          }
        />

      <Route
          path='/chat'
          element={
            isAuthenticated ? (
              <HomeChat setIsAuthenticated={setIsAuthenticated} /> // Truyền hàm xác thực vào trang chính
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route 
          path='/login'
          element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} // Truyền hàm xác thực vào trang đăng nhập
        />
        <Route 
          path='/register'
          element={isAuthenticated ? (<Navigate to={"/home"}/> ) :<RegisterPage />} // Trang đăng ký
        />
        <Route 
          path='/verify-email'
          element={
            isAuthenticated ? (
              <Navigate to="/home" />
            ) : (
              <VerifyEmailPage />
            )
          } // Trang xác thực email
        />
        <Route 
          path='/api/auth/verify-email'
          element={ isAuthenticated ? (<Navigate to={"/home"}/> ) : <VerifyTokenPage />} // Trang xác thực token
        />
      </Routes>

 
      
    

       
  
    
 
  );
};

export default App;