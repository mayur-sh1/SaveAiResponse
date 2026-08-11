import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Converter from './pages/Converter';

function App() {
  const [view, setView] = useState('home');
  const [theme, setTheme] = useState(() => localStorage.getItem('sar-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sar-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  if (view === 'convert') {
    return <Converter onBack={() => setView('home')} theme={theme} toggleTheme={toggleTheme} />;
  }

  return <Home onConvertClick={() => setView('convert')} theme={theme} toggleTheme={toggleTheme} />;
}

export default App;