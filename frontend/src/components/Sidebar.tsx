import { Component, For, createSignal, createEffect } from 'solid-js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

const folderTree: FolderNode[] = [
  {
    name: 'Scribble',
    path: 'Scribble',
    children: [
      {
        name: 'DSA&Patterns',
        path: 'Scribble/DSA&Patterns',
        children: [
          { name: 'Arrays', path: 'Scribble/DSA&Patterns/Arrays', children: [
            { name: 'Cycle Sort', path: 'Scribble/DSA&Patterns/Arrays/Cycle Sort' },
            { name: 'Merge Intervals', path: 'Scribble/DSA&Patterns/Arrays/Merge Intervals' },
            { name: 'Modified Binary Search', path: 'Scribble/DSA&Patterns/Arrays/Modified Binary Search' },
            { name: 'Quicksort', path: 'Scribble/DSA&Patterns/Arrays/Quicksort' },
            { name: 'Revision', path: 'Scribble/DSA&Patterns/Arrays/Revision' },
            { name: 'Sliding Window', path: 'Scribble/DSA&Patterns/Arrays/Sliding Window' },
            { name: 'TwoPointers', path: 'Scribble/DSA&Patterns/Arrays/TwoPointers' },
          ]},
          { name: 'Bit Manipulation', path: 'Scribble/DSA&Patterns/Bit Manipulation' },
          { name: 'CP', path: 'Scribble/DSA&Patterns/CP' },
          { name: 'DevOps', path: 'Scribble/DSA&Patterns/DevOps' },
          { name: 'IneuRon DSA', path: 'Scribble/DSA&Patterns/IneuRon DSA' },
          { name: 'Linked List', path: 'Scribble/DSA&Patterns/Linked List' },
          { name: 'RNN', path: 'Scribble/DSA&Patterns/RNN' },
          { name: 'Semester-5', path: 'Scribble/DSA&Patterns/Semester-5', children: [
            { name: 'Algorithms', path: 'Scribble/DSA&Patterns/Semester-5/Algorithms' },
            { name: 'Full Stack', path: 'Scribble/DSA&Patterns/Semester-5/Full Stack', children: [
              { name: 'Week-1', path: 'Scribble/DSA&Patterns/Semester-5/Full Stack/Week-1' },
              { name: 'Week-2', path: 'Scribble/DSA&Patterns/Semester-5/Full Stack/Week-2' },
              { name: 'Week-3 React', path: 'Scribble/DSA&Patterns/Semester-5/Full Stack/Week-3 React' },
            ]},
            { name: 'Machine Learning', path: 'Scribble/DSA&Patterns/Semester-5/Machine Learning' },
          ]},
        ],
      },
    ],
  },
];

const FolderItem: Component<{
  node: FolderNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  level?: number;
}> = (props) => {
  const level = props.level || 0;
  const [expanded, setExpanded] = createSignal(props.currentPath.startsWith(props.node.path));
  
  createEffect(() => {
    if (props.currentPath.startsWith(props.node.path)) {
      setExpanded(true);
    }
  });

  const isActive = () => props.currentPath === props.node.path;
  const hasChildren = () => props.node.children && props.node.children.length > 0;

  return (
    <div>
      <button
        class={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
          isActive()
            ? 'bg-primary-500/20 text-primary-400 border-l-2 border-primary-500'
            : 'text-gray-400 hover:bg-dark-200 hover:text-white'
        }`}
        style={{ "padding-left": `${level * 12 + 12}px` }}
        onClick={() => {
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
