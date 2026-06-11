import { Component, For, Show, createSignal, createEffect, onMount } from 'solid-js';
import type { FileItem } from '../App';
import { apiUrl } from '../config';

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

// Detect if mobile device
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const NotesViewer: Component<NotesViewerProps> = (props) => {
  const [items, setItems] = createSignal<FileItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [imageIndex, setImageIndex] = createSignal(0);
  const [allImages, setAllImages] = createSignal<FileItem[]>([]);
  // Default 150% for mobile, 100% for desktop
  const [zoom, setZoom] = createSignal(isMobile() ? 150 : 100);
  const [zoomLocked, setZoomLocked] = createSignal(false); // Lock zoom feature
  const [fitMode, setFitMode] = createSignal<'fit' | 'width' | 'actual'>('width');
  
  // Ref to image scroll container for resetting position
  let scrollContainerRef: HTMLDivElement | undefined;
  // Refs for each image to scroll to
  const imageRefs: HTMLDivElement[] = [];

  // Fetch directory contents from GitHub API
  const fetchDirectoryContents = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl(path));
      
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
    } catch (err: any) {
      console.error('Error fetching directory:', err);
      setError(err?.message || 'Failed to load notes. Check your connection.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    setError(null);
    fetchDirectoryContents(props.currentPath);
  });

  // Update image index when selected file changes and scroll to that image
  createEffect(() => {
    if (props.selectedFile?.type === 'image') {
      const idx = allImages().findIndex(img => img.path === props.selectedFile?.path);
      if (idx !== -1) {
        setImageIndex(idx);
        // Scroll to the selected image after a brief delay for rendering
        setTimeout(() => {
          if (imageRefs[idx]) {
            imageRefs[idx].scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }, 100);
      }
    }
  });

  // Track which image is currently visible during scroll
  const handleScroll = () => {
    if (!scrollContainerRef) return;
    const scrollTop = scrollContainerRef.scrollTop;
    const containerHeight = scrollContainerRef.clientHeight;
    
    // Find which image is most visible
    for (let i = 0; i < imageRefs.length; i++) {
      const ref = imageRefs[i];
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const containerRect = scrollContainerRef.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        
        // If this image's top is near the top of the viewport
        if (relativeTop <= containerHeight / 3 && relativeTop + rect.height > 0) {
          if (imageIndex() !== i) {
            setImageIndex(i);
          }
          break;
        }
      }
    }
  };

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
    
    // Scroll to the target image
    if (imageRefs[newIndex]) {
      imageRefs[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Touch swipe state for navigation
  const [touchStart, setTouchStart] = createSignal<{ x: number; y: number } | null>(null);
  // Pinch zoom state
  const [initialPinchDistance, setInitialPinchDistance] = createSignal<number | null>(null);
  const [initialZoom, setInitialZoom] = createSignal(100);

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pinch if zoom is NOT locked
    if (e.touches.length === 2) {
      if (zoomLocked()) {
        // When locked, don't initialize pinch - just ignore
        return;
      }
      // Pinch start
      e.preventDefault();
      setInitialPinchDistance(getDistance(e.touches));
      setInitialZoom(zoom());
    } else if (e.touches.length === 1) {
      // Swipe start
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Block all pinch zoom if locked
    if (zoomLocked()) {
      setInitialPinchDistance(null); // Clear any pending pinch
      return;
    }
    
    if (e.touches.length === 2 && initialPinchDistance()) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialPinchDistance()!;
      const newZoom = Math.min(400, Math.max(50, initialZoom() * scale));
      setZoom(Math.round(newZoom));
      setFitMode('width'); // Switch to width mode for custom zoom
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    // Reset pinch state
    if (initialPinchDistance()) {
      setInitialPinchDistance(null);
      return;
    }
    
    const start = touchStart();
    if (!start) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = start.x - endX;
    const diffY = start.y - endY;
    
    // Only swipe if horizontal movement is greater than vertical and zoom is at 100%
    if (zoom() <= 100 && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
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
          {/* Skeleton loading cards */}
          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            <For each={Array.from({ length: 8 })}>
              {() => (
                <div class="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-dark-300/30 animate-pulse">
                  <div class="w-full aspect-[3/4] rounded-md sm:rounded-lg bg-dark-200/50 mb-2 sm:mb-3" />
                  <div class="h-4 bg-dark-200/50 rounded w-3/4 mx-auto" />
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!loading() && error()}>
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg class="w-16 h-16 mb-4 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="mb-2">{error()}</p>
            <button
              class="px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
              onClick={() => { setError(null); fetchDirectoryContents(props.currentPath); }}
            >
              Retry
            </button>
          </div>
        </Show>

        <Show when={!loading() && !error() && items().length === 0}>
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p>This folder is empty</p>
          </div>
        </Show>

        <Show when={!loading() && !error() && items().length > 0}>
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
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='2' y='3' width='20' height='18' rx='2'/%3E%3Cline x1='2' y1='8' x2='22' y2='8'/%3E%3Cline x1='2' y1='13' x2='22' y2='13'/%3E%3Cline x1='2' y1='18' x2='22' y2='18'/%3E%3C/svg%3E";
                          }}
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
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='2' y='3' width='20' height='18' rx='2'/%3E%3Cline x1='2' y1='8' x2='22' y2='8'/%3E%3Cline x1='2' y1='13' x2='22' y2='13'/%3E%3Cline x1='2' y1='18' x2='22' y2='18'/%3E%3C/svg%3E";
                          }}
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

      {/* Image Preview Modal - Continuous Scroll View (like PDF) */}
      <Show when={props.selectedFile && props.selectedFile.type === 'image'}>
        <div class="fixed inset-0 z-50 bg-black image-viewer-container">
          {/* Close button */}
          <button
            class="fixed top-2 right-2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-90 transition-all z-30"
            onClick={props.onClosePreview}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Continuous scroll container for all images */}
          <div 
            ref={scrollContainerRef}
            class="w-full h-full overflow-auto modal-scroll"
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Zoom controls bar */}
            <div class="fixed top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 rounded-full bg-black/80 backdrop-blur-sm z-20">
              {/* Zoom out button */}
              <button
                class={`p-2 rounded-full text-white hover:bg-white/20 active:scale-90 transition-all ${zoomLocked() ? 'opacity-50' : ''}`}
                onClick={() => !zoomLocked() && setZoom(z => Math.max(50, z - 25))}
                disabled={zoomLocked()}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              
              {/* Zoom level indicator */}
              <span class="text-sm text-white font-bold w-14 text-center">{zoom()}%</span>
              
              {/* Zoom in button */}
              <button
                class={`p-2 rounded-full text-white hover:bg-white/20 active:scale-90 transition-all ${zoomLocked() ? 'opacity-50' : ''}`}
                onClick={() => !zoomLocked() && setZoom(z => Math.min(400, z + 25))}
                disabled={zoomLocked()}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              {/* Divider */}
              <div class="w-px h-5 bg-white/30 mx-1" />
              
              {/* Lock zoom button */}
              <button
                class={`p-2 rounded-full transition-all active:scale-90 ${zoomLocked() ? 'bg-primary-500 text-white' : 'text-white/80 hover:bg-white/20'}`}
                onClick={() => setZoomLocked(!zoomLocked())}
                title={zoomLocked() ? 'Unlock zoom' : 'Lock zoom'}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <Show when={zoomLocked()}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </Show>
                  <Show when={!zoomLocked()}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </Show>
                </svg>
              </button>
            </div>

            {/* All images stacked vertically - continuous scroll */}
            <div class="flex flex-col items-center pt-14 pb-20">
              <For each={allImages()}>
                {(image, index) => (
                  <div 
                    ref={(el) => imageRefs[index()] = el}
                    class="w-full flex flex-col items-center"
                  >
                    {/* Page indicator */}
                    <div class="w-full py-2 text-center bg-black/50 sticky top-12 z-10">
                      <span class="text-xs text-gray-400">
                        Page {index() + 1} of {allImages().length}
                      </span>
                      <span class="text-xs text-gray-600 ml-2 hidden sm:inline">
                        {image.name}
                      </span>
                    </div>
                    
                    {/* Image */}
                    <img
                      src={props.getFileUrl(image.path)}
                      alt={image.name}
                      class="bg-white block mb-4"
                      draggable={false}
                      loading={index() < 3 ? "eager" : "lazy"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.minHeight = '200px';
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='2' y='3' width='20' height='18' rx='2'/%3E%3Cline x1='2' y1='8' x2='22' y2='8'/%3E%3Cline x1='2' y1='13' x2='22' y2='13'/%3E%3Cline x1='2' y1='18' x2='22' y2='18'/%3E%3C/svg%3E";
                      }}
                      style={{
                        "width": `${zoom()}vw`,
                        "max-width": "none",
                      }}
                    />
                  </div>
                )}
              </For>
            </div>
            
            {/* Bottom info bar */}
            <div class="fixed bottom-0 left-0 right-0 text-center bg-gradient-to-t from-black via-black/80 to-transparent px-4 py-3 pt-8 z-20">
              <p class="text-white font-medium text-sm">
                <span class="text-primary-400 font-bold">{imageIndex() + 1}</span>
                <span class="text-gray-400"> / {allImages().length}</span>
              </p>
              <p class="text-gray-500 text-xs mt-1">
                Scroll to view all pages
                <Show when={zoomLocked()}>
                  <span class="mx-1">•</span>
                  <span class="text-primary-400">Zoom locked</span>
                </Show>
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
