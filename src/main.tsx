import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import global styles

// This line looks for the <div id="root"></div> in your public/index.html
const rootElement = document.getElementById('root');

// This check prevents errors if the root element is not found
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Make sure your public/index.html file has a <div id='root'></div>.");
}
