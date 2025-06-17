import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/* Patch: Define PUBLIC_URL globally for template compatibility */
if (typeof window !== 'undefined' && typeof window.PUBLIC_URL === 'undefined' && typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) {
  window.PUBLIC_URL = process.env.PUBLIC_URL;
}
if (typeof PUBLIC_URL === 'undefined' && typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) {
  var PUBLIC_URL = process.env.PUBLIC_URL;
}

/* Ensure there is NO accidental usage of PUBLIC_URL as a bare variable anywhere in this file.
   If introducing code that needs the public URL, always use process.env.PUBLIC_URL instead of PUBLIC_URL.
*/

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
