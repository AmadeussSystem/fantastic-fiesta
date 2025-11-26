import { Component, For, createSignal, createEffect, onMount, Show } from 'solid-js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
  loaded?: boolean;
}

// Fetch folder contents from GitHub API
const fetchFolderContents = async (path: string): Promise<FolderNode[]> => {
  try {
    const apiUrl = `https://api.github.com/repos/AmadeussSystem/fantastic-fiesta/contents/${path}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data
        .filter((item: any) => item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'build')
        .map((item: any) => ({
          name: item.name,
          path: item.path,
          children: undefined,
          loaded: false,
        }))
        .sort((a: FolderNode, b: FolderNode) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching folder:', error);
    return [];
  }
};

const FolderItem: Component<{
  node: FolderNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  level?: number;
  onLoadChildren: (path: string) => Promise<FolderNode[]>;
}> = (props) => {
  const level = props.level || 0;
  const [expanded, setExpanded] = createSignal(false);
  const [children, setChildren] = createSignal<FolderNode[]>(props.node.children || []);
  const [loading, setLoading] = createSignal(false);
  const [loaded, setLoaded] = createSignal(props.node.loaded || false);
  
  // Auto-expand if current path is inside this folder
  createEffect(() => {
    if (props.currentPath.startsWith(props.node.path + '/') || props.currentPath === props.node.path) {
      setExpanded(true);
      if (!loaded()) {
        loadChildren();
      }
    }
  });

  const loadChildren = async () => {
    if (loaded() || loading()) return;
    setLoading(true);
    const fetchedChildren = await props.onLoadChildren(props.node.path);
    setChildren(fetchedChildren);
    setLoaded(true);
    setLoading(false);
  };

  const handleClick = async () => {
    props.onNavigate(props.node.path);
    if (!expanded()) {
      setExpanded(true);
      if (!loaded()) {
        await loadChildren();
      }
    } else {
      setExpanded(false);
    }
  };

  const isActive = () => props.currentPath === props.node.path;
  const hasChildren = () => children().length > 0 || !loaded();

  return (
    <div>
      <button
        class={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
          isActive()
            ? 'bg-primary-500/20 text-primary-400 border-l-2 border-primary-500'
            : 'text-gray-400 hover:bg-dark-200 hover:text-white'
        }`}
        style={{ "padding-left": `${level * 12 + 12}px` }}
        onClick={handleClick}
          if (hasChildren()) {
            setExpanded(!expanded());
          }
          props.onNavigate(props.node.path);
        }}
      >
        {/* Expand/Collapse icon */}
        {hasChildren() && (
          <svg
            class={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${expanded() ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        )}
        
        {/* Folder icon */}
        <svg class={`w-4 h-4 flex-shrink-0 ${isActive() ? 'text-primary-400' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
        </svg>
        
        <span class="truncate">{props.node.name}</span>
      </button>
      
      {/* Children */}
      {hasChildren() && expanded() && (
        <div class="mt-1">
          <For each={props.node.children}>
            {(child) => (
              <FolderItem
                node={child}
                currentPath={props.currentPath}
                onNavigate={props.onNavigate}
                level={level + 1}
              />
            )}
          </For>
        </div>
      )}
    </div>
  );
};

const Sidebar: Component<SidebarProps> = (props) => {
  return (
    <aside class="fixed left-0 top-16 bottom-0 w-64 glass border-r border-white/5 overflow-y-auto z-40">
      <div class="p-4">
        {/* Header */}
        <div class="flex items-center gap-2 mb-4 px-2">
          <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span class="font-semibold text-sm">Explorer</span>
        </div>
        
        {/* Folder Tree */}
        <div class="space-y-1">
          <For each={folderTree}>
            {(node) => (
              <FolderItem
                node={node}
                currentPath={props.currentPath}
                onNavigate={props.onNavigate}
              />
            )}
          </For>
        </div>
      </div>
      
      {/* Bottom info */}
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-dark-500/80 backdrop-blur-sm">
        <div class="text-xs text-gray-500">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-accent-green" />
            <span>Synced with GitHub</span>
          </div>
          <div class="text-gray-600">Handwritten notes from Scrble Ink</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
