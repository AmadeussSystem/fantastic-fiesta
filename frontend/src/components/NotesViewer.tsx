import { Component, For, Show, createSignal, createEffect, onMount } from 'solid-js';
import type { FileItem } from '../App';

interface NotesViewerProps {
  currentPath: string;
  selectedFile: FileItem | null;
  breadcrumbs: { name: string; path: string }[];
  viewMode: 'grid' | 'list';
  onNavigate: (path: string) => void;
  onFileClick: (file: FileItem) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClosePreview: () => void;
  getFileUrl: (path: string) => string;
}

// Helper to determine file type from extension
const getFileType = (name: string): FileItem['type'] => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['cpp', 'c', 'py', 'js', 'ts', 'tsx', 'jsx', 'java', 'rs', 'go', 'html', 'css'].includes(ext)) return 'code';
  return 'other';
};

// File icon component
const FileIcon: Component<{ type: FileItem['type']; class?: string }> = (props) => {
  const iconClass = props.class || 'w-6 h-6';
  
  switch (props.type) {
    case 'folder':
      return (
        <svg class={`${iconClass} text-yellow-500`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
        </svg>
      );
    case 'image':
      return (
        <svg class={`${iconClass} text-accent-pink`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'pdf':
      return (
        <svg class={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'code':
      return (
        <svg class={`${iconClass} text-accent-cyan`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    default:
      return (
        <svg class={`${iconClass} text-gray-400`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
};

const NotesViewer: Component<NotesViewerProps> = (props) => {
  const [items, setItems] = createSignal<FileItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [imageIndex, setImageIndex] = createSignal(0);
  const [allImages, setAllImages] = createSignal<FileItem[]>([]);
  const [zoom, setZoom] = createSignal(100);
  const [fitMode, setFitMode] = createSignal<'fit' | 'width' | 'actual'>('width');

  // Fetch directory contents from GitHub API
  const fetchDirectoryContents = async (path: string) => {
    setLoading(true);
    try {
      const apiUrl = `https://api.github.com/repos/AmadeussSystem/fantastic-fiesta/contents/${path}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const fileItems: FileItem[] = data
          .filter((item: any) => !item.name.startsWith('.') && item.name !== 'build' && !item.name.endsWith('.exe'))
          .map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type === 'dir' ? 'folder' : getFileType(item.name),
          }))
          .sort((a: FileItem, b: FileItem) => {
            // Folders first, then sort alphabetically
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
          });
        
        setItems(fileItems);
        
        // Update all images for gallery navigation
        const images = fileItems.filter(f => f.type === 'image');
        setAllImages(images);
      }
    } catch (error) {
      console.error('Error fetching directory:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    fetchDirectoryContents(props.currentPath);
  });

  // Update image index when selected file changes
  createEffect(() => {
    if (props.selectedFile?.type === 'image') {
      const idx = allImages().findIndex(img => img.path === props.selectedFile?.path);
      if (idx !== -1) setImageIndex(idx);
    }
  });

  const navigateImage = (direction: 'prev' | 'next') => {
    const images = allImages();
    if (images.length === 0) return;
    
    let newIndex = imageIndex();
    if (direction === 'prev') {
      newIndex = newIndex > 0 ? newIndex - 1 : images.length - 1;
    } else {
      newIndex = newIndex < images.length - 1 ? newIndex + 1 : 0;
    }
    
    setImageIndex(newIndex);
    props.onFileClick(images[newIndex]);
  };

  // Touch swipe state
  const [touchStart, setTouchStart] = createSignal<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const start = touchStart();
    if (!start) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = start.x - endX;
    const diffY = start.y - endY;
    
    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        navigateImage('next');
      } else {
        navigateImage('prev');
      }
    }
    setTouchStart(null);
  };

  // Keyboard navigation
  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (props.selectedFile?.type === 'image') {
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'ArrowRight') navigateImage('next');
        if (e.key === 'Escape') props.onClosePreview();
        if (e.key === '+' || e.key === '=') setZoom(z => Math.min(300, z + 25));
        if (e.key === '-') setZoom(z => Math.max(25, z - 25));
        if (e.key === '0') { setFitMode('actual'); setZoom(100); }
        if (e.key === 'w') { setFitMode('width'); setZoom(100); }
        if (e.key === 'f') { setFitMode('fit'); setZoom(100); }
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  return (
    <div class="h-full">
      {/* Header */}
      <div class="sticky top-16 z-30 glass border-b border-white/5 px-3 sm:px-6 py-3 sm:py-4">
        <div class="flex items-center justify-between gap-2">
          {/* Breadcrumbs */}
          <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto flex-1 min-w-0">
            <For each={props.breadcrumbs}>
              {(crumb, index) => (
                <>
                  <button
                    class={`hover:text-primary-400 transition-colors whitespace-nowrap ${
                      index() === props.breadcrumbs.length - 1
                        ? 'text-white font-medium'
                        : 'text-gray-400'
                    }`}
                    onClick={() => props.onNavigate(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                  <Show when={index() < props.breadcrumbs.length - 1}>
                    <span class="text-gray-600">/</span>
                  </Show>
                </>
              )}
            </For>
          </div>

          {/* View mode toggle */}
          <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span class="text-xs text-gray-500 mr-1 sm:mr-2 hidden sm:inline">{items().length} items</span>
            <button
              class={`p-2 rounded-lg transition-colors ${
                props.viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:bg-dark-200'
              }`}
              onClick={() => props.onViewModeChange('grid')}
              title="Grid view"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
              </svg>
            </button>
            <button
              class={`p-2 rounded-lg transition-colors ${
                props.viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:bg-dark-200'
              }`}
              onClick={() => props.onViewModeChange('list')}
              title="List view"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="p-3 sm:p-6">
        <Show when={loading()}>
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        <Show when={!loading() && items().length === 0}>
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p>This folder is empty</p>
          </div>
        </Show>

        <Show when={!loading() && items().length > 0}>
          {/* Grid View */}
          <Show when={props.viewMode === 'grid'}>
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              <For each={items()}>
                {(item) => (
                  <button
                    class="group p-2 sm:p-3 rounded-lg sm:rounded-xl glass-hover text-center transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    onClick={() => props.onFileClick(item)}
                  >
                    <Show when={item.type === 'image'}>
                      <div class="w-full aspect-[3/4] rounded-md sm:rounded-lg overflow-hidden mb-2 sm:mb-3 bg-dark-300 shadow-lg">
                        <img
                          src={props.getFileUrl(item.path)}
                          alt={item.name}
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Show>
                    <Show when={item.type !== 'image'}>
                      <div class="w-full aspect-[3/4] rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3 bg-dark-300/50">
                        <FileIcon type={item.type} class="w-10 h-10 sm:w-16 sm:h-16" />
                      </div>
                    </Show>
                    <p class="text-xs sm:text-sm text-gray-300 group-hover:text-white truncate px-1" title={item.name}>
                      {item.name}
                    </p>
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* List View */}
          <Show when={props.viewMode === 'list'}>
            <div class="space-y-1">
              <For each={items()}>
                {(item) => (
                  <button
                    class="w-full flex items-center gap-4 p-3 rounded-lg glass-hover text-left transition-all duration-200"
                    onClick={() => props.onFileClick(item)}
                  >
                    <Show when={item.type === 'image'}>
                      <div class="w-10 h-10 rounded-lg overflow-hidden bg-dark-300 flex-shrink-0">
                        <img
                          src={props.getFileUrl(item.path)}
                          alt={item.name}
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Show>
                    <Show when={item.type !== 'image'}>
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-dark-300/50 flex-shrink-0">
                        <FileIcon type={item.type} class="w-5 h-5" />
                      </div>
                    </Show>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-300 truncate">{item.name}</p>
                      <p class="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>

      {/* Image Preview Modal */}
      <Show when={props.selectedFile && props.selectedFile.type === 'image'}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 sm:bg-black/90 backdrop-blur-sm">
          {/* Close button */}
          <button
            class="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-2 rounded-lg bg-dark-300/80 text-white hover:bg-dark-200 transition-colors z-20"
            onClick={props.onClosePreview}
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation */}
          <Show when={allImages().length > 1}>
            <button
              class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-dark-300/80 text-white hover:bg-dark-200 active:scale-90 transition-all"
              onClick={() => navigateImage('prev')}
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-dark-300/80 text-white hover:bg-dark-200 active:scale-90 transition-all"
              onClick={() => navigateImage('next')}
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Show>

          {/* Image */}
          <div 
            class="max-w-[95vw] max-h-[95vh] flex flex-col items-center overflow-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Zoom controls */}
            <div class="fixed top-12 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-dark-300/90 backdrop-blur-sm z-20 max-w-[90vw] overflow-x-auto">
              <button
                class={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${fitMode() === 'fit' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => { setFitMode('fit'); setZoom(100); }}
              >
                Fit
              </button>
              <button
                class={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${fitMode() === 'width' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => { setFitMode('width'); setZoom(100); }}
              >
                Fit Width
              </button>
              <button
                class={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${fitMode() === 'actual' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => { setFitMode('actual'); setZoom(100); }}
              >
                100%
              </button>
              <div class="w-px h-4 bg-gray-600 mx-1 hidden sm:block" />
              <button
                class="p-1 rounded text-gray-400 hover:text-white hidden sm:block"
                onClick={() => setZoom(z => Math.max(25, z - 25))}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              <span class="text-xs sm:text-sm text-gray-300 w-10 sm:w-12 text-center hidden sm:block">{zoom()}%</span>
              <button
                class="p-1 rounded text-gray-400 hover:text-white hidden sm:block"
                onClick={() => setZoom(z => Math.min(300, z + 25))}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div 
              class="flex-1 overflow-auto p-4 flex items-start justify-center w-full"
              style={{ "max-height": "calc(95vh - 80px)" }}
            >
              <img
                src={props.getFileUrl(props.selectedFile!.path)}
                alt={props.selectedFile!.name}
                class="shadow-2xl bg-white"
                style={{
                  "max-width": fitMode() === 'fit' ? '100%' : fitMode() === 'width' ? `${zoom()}%` : 'none',
                  "max-height": fitMode() === 'fit' ? 'calc(95vh - 120px)' : 'none',
                  "width": fitMode() === 'width' ? `${zoom()}%` : fitMode() === 'actual' ? 'auto' : undefined,
                  "transform": fitMode() === 'actual' ? `scale(${zoom() / 100})` : undefined,
                  "transform-origin": "top center",
                }}
              />
            </div>
            <div class="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-center bg-dark-300/90 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl max-w-[95vw]">
              <p class="text-white font-medium text-xs sm:text-sm truncate">{props.selectedFile!.name}</p>
              <p class="text-gray-400 text-xs mt-1">
                <Show when={allImages().length > 1}>
                  <span>{imageIndex() + 1} of {allImages().length}</span>
                  <span class="mx-1 sm:mx-2">•</span>
                </Show>
                <span class="text-gray-500 hidden sm:inline">← → navigate</span>
                <span class="text-gray-500 sm:hidden">Swipe to navigate</span>
              </p>
            </div>
          </div>
        </div>
      </Show>

      {/* PDF Preview */}
      <Show when={props.selectedFile && props.selectedFile.type === 'pdf'}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-0">
          <button
            class="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-lg bg-dark-300/80 text-white hover:bg-dark-200 transition-colors z-10"
            onClick={props.onClosePreview}
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div class="w-full h-full sm:w-[90vw] sm:h-[90vh] bg-white rounded-lg overflow-hidden">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(props.getFileUrl(props.selectedFile!.path))}&embedded=true`}
              class="w-full h-full"
              title={props.selectedFile!.name}
            />
          </div>
        </div>
      </Show>

      {/* Code Preview */}
      <Show when={props.selectedFile && props.selectedFile.type === 'code'}>
        <CodePreview
          file={props.selectedFile!}
          getFileUrl={props.getFileUrl}
          onClose={props.onClosePreview}
        />
      </Show>
    </div>
  );
};

// Code preview component
const CodePreview: Component<{
  file: FileItem;
  getFileUrl: (path: string) => string;
  onClose: () => void;
}> = (props) => {
  const [code, setCode] = createSignal('Loading...');

  onMount(async () => {
    try {
      const response = await fetch(props.getFileUrl(props.file.path));
      const text = await response.text();
      setCode(text);
    } catch (error) {
      setCode('Error loading file');
    }
  });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-8">
      <div class="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] glass rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span class="text-sm text-gray-400 font-mono">{props.file.name}</span>
          </div>
          <button
            class="p-1.5 rounded-lg hover:bg-dark-200 transition-colors"
            onClick={props.onClose}
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Code content */}
        <pre class="flex-1 overflow-auto p-4 text-sm font-mono text-gray-300 bg-dark-400/50">
          <code>{code()}</code>
        </pre>
      </div>
    </div>
  );
};

export default NotesViewer;
