import { Component, createSignal, Show } from 'solid-js';
import { GITHUB_CONFIG, rawUrl } from './config';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotesViewer from './components/NotesViewer';

export interface FileItem {
  name: string;
  path: string;
  type: 'folder' | 'image' | 'pdf' | 'code' | 'other';
}

// GitHub raw content URL is now driven by config.ts

const App: Component = () => {
  const [currentPath, setCurrentPath] = createSignal('Scribble');
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = createSignal(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [lastSynced, setLastSynced] = createSignal<Date | null>(null);

  const breadcrumbs = () => {
    const parts = currentPath().split('/');
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/'),
    }));
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateTo(file.path);
    } else {
      setSelectedFile(file);
    }
  };

  const getFileUrl = (path: string) => rawUrl(path.split('/').map(p => encodeURIComponent(p)).join('/'));

  return (
    <div class="min-h-screen bg-dark-500 text-white flex flex-col">
      {/* Background effects */}
      <div class="fixed inset-0 bg-grid pointer-events-none opacity-50" />
      <div class="gradient-blob w-96 h-96 bg-primary-500/20 top-0 -left-48 fixed" />
      <div class="gradient-blob w-80 h-80 bg-accent-purple/15 bottom-0 -right-40 fixed" />
      
      {/* Content */}
      <div class="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          sidebarOpen={sidebarOpen()} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen())} 
        />
        
        <div class="flex flex-1 pt-16">
          {/* Sidebar - overlay on mobile, fixed on desktop */}
          <Show when={sidebarOpen()}>
            {/* Mobile overlay backdrop */}
            <div 
              class="fixed inset-0 bg-black/50 z-30 lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            />
            <Sidebar 
              currentPath={currentPath()}
              onNavigate={(path) => {
                navigateTo(path);
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            />
          </Show>
          
          {/* Main Content */}
          <main class={`flex-1 transition-all duration-300 ${sidebarOpen() ? 'lg:ml-64' : 'ml-0'}`}>
            <NotesViewer
              currentPath={currentPath()}
              selectedFile={selectedFile()}
              breadcrumbs={breadcrumbs()}
              viewMode={viewMode()}
              onNavigate={navigateTo}
              onFileClick={handleFileClick}
              onViewModeChange={setViewMode}
              onClosePreview={() => setSelectedFile(null)}
              getFileUrl={getFileUrl}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
