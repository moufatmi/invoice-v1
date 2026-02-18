import { useState, useEffect } from 'react';

export const useDevelopmentMode = () => {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    const isDevMode = import.meta.env.DEV;
    // Check if bypass flag is set in localStorage
    const hasBypass = localStorage.getItem('dev-bypass-auth') === 'true';
    
    setIsDevelopment(isDevMode && hasBypass);
  }, []);

  const enableBypass = () => {
    localStorage.setItem('dev-bypass-auth', 'true');
    setIsDevelopment(true);
  };

  const disableBypass = () => {
    localStorage.removeItem('dev-bypass-auth');
    setIsDevelopment(false);
  };

  return {
    isDevelopment,
    enableBypass,
    disableBypass
  };
};

export default useDevelopmentMode;
