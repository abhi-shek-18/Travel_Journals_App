import React from 'react';
import { useNavigate } from 'react-router-dom';


const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/signup');

  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to Travel Journal</h1>
      <p className="landing-description">
        Capture and cherish your travel memories. Join us to create your own travel story!
      </p>
      <div className="button-container">
        <button className="landing-button" onClick={handleLogin}>
          Login
        </button>
        <button className="landing-button" onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
