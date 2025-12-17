import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('🌟 SMART-Admin starting...');
console.log('📍 Root element:', document.getElementById("root"));

createRoot(document.getElementById("root")!).render(<App />);

console.log('✨ React app rendered');
