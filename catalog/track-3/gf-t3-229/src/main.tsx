import {createRoot} from 'react-dom/client';
import App, {ENGINE_PRIMARY_TITLE} from './App.tsx';
import './index.css';

document.title = ENGINE_PRIMARY_TITLE;

createRoot(document.getElementById('root')!).render(<App />);

