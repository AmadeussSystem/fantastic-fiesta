import { Component, For, createSignal, createMemo } from 'solid-js';

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

interface SidebarProps {
  catalog: Catalog;
  onSelect: (path: string, type: 'obsidian' | 'scribble') => void;
  currentPath: string;
}

interface TreeNode {
  name: string;
  path?: string;
  children: Map<string, TreeNode>;
  files: CatalogItem[];
  isExpanded: boolean;
}

const Sidebar: Component<SidebarProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'obsidian' | 'scribble'>('obsidian');
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(new Set());

  const items = () => {
    if (!props.catalog) return [];
    return props.catalog[activeTab()] || [];
  };

  // Build folder tree from flat list
  const folderTree = createMemo(() => {
    const root: TreeNode = { name: '', children: new Map(), files: [], isExpanded: true };

    items().forEach(item => {
      if (item.parent === '') {
        // Root level file
        root.files.push(item);
      } else {
        // Nested file - create folder structure
        const parts = item.parent.split('/');
        let currentNode = root;

        parts.forEach((part, index) => {
          if (!currentNode.children.has(part)) {
            currentNode.children.set(part, {
              name: part,
              path: parts.slice(0, index + 1).join('/'),
              children: new Map(),
              files: [],
              isExpanded: false
            });
          }
          currentNode = currentNode.children.get(part)!;
        });

        currentNode.files.push(item);
      }
    });

    return root;
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const FolderNode: Component<{ node: TreeNode; level: number }> = (nodeProps) => {
    const isExpanded = () => expandedFolders().has(nodeProps.node.path || '');
    const hasContent = () => nodeProps.node.files.length > 0 || nodeProps.node.children.size > 0;

    return (
      <>
        {/* Render folders */}
        <For each={Array.from(nodeProps.node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]))}>
          {([folderName, childNode]) => (
            <>
              <div
                class="flex items-center gap-2 cursor-pointer p-2 rounded text-sm mb-1 text-[var(--obsidian-text-normal)] hover:bg-[var(--obsidian-bg-primary)]"
                style={{ 'padding-left': `${nodeProps.level * 12 + 8}px` }}
                onClick={() => toggleFolder(childNode.path!)}
              >
                <span class={isExpanded() && expandedFolders().has(childNode.path!) ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'} />
                <span class="i-carbon-folder" />
                <span class="truncate">{folderName}</span>
              </div>
              {expandedFolders().has(childNode.path!) && (
                <FolderNode node={childNode} level={nodeProps.level + 1} />
              )}
            </>
          )}
        </For>

        {/* Render files */}
        <For each={nodeProps.node.files.sort((a, b) => a.name.localeCompare(b.name))}>
          {(item) => (
            <div
              class={`
                cursor-pointer p-2 rounded text-sm mb-1 truncate
                ${props.currentPath === item.path
                  ? 'bg-[var(--obsidian-accent)] text-white'
                  : 'text-[var(--obsidian-text-normal)] hover:bg-[var(--obsidian-bg-primary)]'}
              `}
              style={{ 'padding-left': `${nodeProps.level * 12 + 32}px` }}
              onClick={() => props.onSelect(item.path, activeTab())}
              title={item.name}
            >
              <div class="flex items-center gap-2">
                <span class="i-carbon-document" />
                {item.name}
              </div>
            </div>
          )}
        </For>
      </>
    );
  };

  return (
    <div class="w-64 h-full bg-[var(--obsidian-bg-secondary)] border-r border-[var(--obsidian-border)] flex flex-col">
      {/* Tabs */}
      <div class="flex border-b border-[var(--obsidian-border)]">
        <button
          class={`flex-1 p-3 text-sm font-medium transition-colors ${activeTab() === 'obsidian'
            ? 'bg-[var(--obsidian-bg-primary)] text-[var(--obsidian-accent)] border-b-2 border-[var(--obsidian-accent)]'
            : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-normal)]'
            }`}
          onClick={() => setActiveTab('obsidian')}
        >
          Obsidian
        </button>
        <button
          class={`flex-1 p-3 text-sm font-medium transition-colors ${activeTab() === 'scribble'
            ? 'bg-[var(--obsidian-bg-primary)] text-[var(--obsidian-accent)] border-b-2 border-[var(--obsidian-accent)]'
            : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-normal)]'
            }`}
          onClick={() => setActiveTab('scribble')}
        >
          Scribble
        </button>
      </div>

      {/* File Tree */}
      <div class="flex-1 overflow-y-auto p-2">
        <FolderNode node={folderTree()} level={0} />
        {items().length === 0 && (
          <div class="p-4 text-center text-[var(--obsidian-text-muted)] text-sm">
            No notes found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
