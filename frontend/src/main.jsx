import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable copying of UI text across the entire application
document.addEventListener('copy', (e) => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', '');
    }
    return false;
  }
});

document.addEventListener('cut', (e) => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    e.preventDefault();
    return false;
  }
});

document.addEventListener('selectstart', (e) => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    e.preventDefault();
    return false;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
