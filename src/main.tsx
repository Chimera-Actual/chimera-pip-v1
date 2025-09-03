import { createRoot } from 'react-dom/client'
import { enableMapSet } from 'immer'
import App from './App.tsx'
import './index.css'

// Enable Immer MapSet plugin for Zustand store
enableMapSet()

createRoot(document.getElementById("root")!).render(<App />);
