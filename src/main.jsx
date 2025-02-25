import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Check if API key is set
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey || apiKey === 'your_openai_api_key_here') {
  console.warn(
    '%c⚠️ OpenAI API Key Not Set', 
    'font-size: 14px; font-weight: bold; color: #ff9800;'
  );
  console.log(
    '%cPlease add your OpenAI API key in the .env file to enable AI search functionality.', 
    'font-size: 12px; color: #666;'
  );
  console.log(
    '%cExample: VITE_OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789', 
    'font-size: 12px; color: #666;'
  );
} else {
  console.log(
    '%c✅ OpenAI API Key found. AI search functionality is ready to use!', 
    'font-size: 14px; font-weight: bold; color: #4CAF50;'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
