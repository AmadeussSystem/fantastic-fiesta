/* @refresh reload */
import { render } from 'solid-js/web';
import 'virtual:uno.css';
import '@unocss/reset/tailwind.css';
// Load Obsidian theme CSS first for proper variable cascade
import './styles/obsidian-theme/vanilla-amoled.css';
import './styles/obsidian-snippets/index.css';
import './styles/obsidian.css';
// Load global.css last so it only affects non-Obsidian elements
import './styles/global.css';
import App from './App';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html?',
  );
}

render(() => <App />, root!);
