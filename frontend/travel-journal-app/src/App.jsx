import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import React from 'react'


import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Home from "./pages/Home/Home";
import LandingPage from "./pages/Home/LandingPage";

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
        <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" exact element={<Home />} />
          <Route path="/login" exact element={<Login />} />
          <Route path="/signup" exact element={<SignUp />} />
        </Routes>
      </Router>
    </div>
  )
}

//Define the root component to handle the initial redirect 
const Root = () => {
  //check  if token exists in localstorage
  const isAuthenticated = !!localStorage.getItem("token");

  //Redirect to dashboard if authenticated, otherwise to login
  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ): (
    <Navigate to="/login" />
  );
};

export default App