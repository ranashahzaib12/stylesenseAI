import React, { useState } from 'react';
import AuthLayout from './Auth/AuthLayout';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => setIsLoginView(!isLoginView);

  return (
    <AuthLayout>
      {isLoginView ? (
        <LoginForm onSwitchToRegister={toggleView} />
      ) : (
        <RegisterForm onSwitchToLogin={toggleView} />
      )}
    </AuthLayout>
  );
};

export default AuthPage;
