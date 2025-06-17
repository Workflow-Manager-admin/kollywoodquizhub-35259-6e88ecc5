import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Replace PUBLIC_URL with process.env.PUBLIC_URL if used anywhere
// (No such use in this file, but placeholder for safety.)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
