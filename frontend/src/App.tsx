import { Component, createSignal, createResource, Show } from 'solid-js';
import Sidebar from './components/Sidebar';
import MarkdownViewer from './components/MarkdownViewer';
import ScribbleViewer from './components/ScribbleViewer';
import './styles/obsidian.css';

interface CatalogItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  source: string;
  parent: string;
}

interface Catalog {
  obsidian: CatalogItem[];
  scribble: CatalogItem[];
}

const App: Component = () => {
  const [catalog] = createResource<Catalog>(async () => {
    try {
      const res = await fetch('catalog.json');
      if (!res.ok) throw new Error('Catalog not found');
      return await res.json();
    } catch (e) {
      console.error(e);
      // Fallback or empty state
      return { obsidian: [], scribble: [] };
    }
  });

  const [currentNote, setCurrentNote] = createSignal<{ path: string; type: string } | null>(null);

  const handleSelect = (path: string, source: string) => {
    setCurrentNote({ path, type: source });
  };

  return (
    <div class="h-screen w-screen flex bg-[#1e1e1e] text-[#dcddde] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        catalog={catalog() || { obsidian: [], scribble: [] }}
        onSelect={handleSelect}
        currentPath={currentNote()?.path || ''}
      />

      {/* Main Content */}
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <Show when={currentNote()} fallback={
          <div class="flex-1 flex items-center justify-center text-[#858585]">
            <div class="text-center">
              <h2 class="text-2xl font-bold mb-2">Select a note to view</h2>
              <p>Choose from Obsidian or Scribble notes in the sidebar</p>
            </div>
          </div>
        }>
          <Show when={currentNote()?.type === 'obsidian'}>
            <MarkdownViewer path={currentNote()!.path} />
          </Show>
          <Show when={currentNote()?.type === 'scribble'}>
            <ScribbleViewer
              path={currentNote()!.path}
              catalog={catalog()?.scribble}
            />
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default App;
