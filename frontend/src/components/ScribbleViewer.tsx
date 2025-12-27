import { Component, createSignal, For, Show, onMount } from 'solid-js';

interface ScribbleViewerProps {
    path: string;
    catalog?: { name: string; path: string; parent: string }[];
}

type ZoomMode = 'fit-width' | 'fit-page' | 'actual' | number;

const ScribbleViewer: Component<ScribbleViewerProps> = (props) => {
    const [zoomMode, setZoomMode] = createSignal<ZoomMode>('fit-width');
    const [customZoom, setCustomZoom] = createSignal(100);

    const isPdf = () => props.path.toLowerCase().endsWith('.pdf');
    const fileName = () => props.path.split('/').pop() || '';

    // Get all related files from the same folder (for multi-page PNG viewing)
    const relatedFiles = () => {
        if (!props.catalog || isPdf()) return [props.path];

        const currentParent = props.catalog.find(item => item.path === props.path)?.parent;
        if (!currentParent) return [props.path];

        // Get all PNG/image files from the same parent folder, sorted by name
        return props.catalog
            .filter(item =>
                item.parent === currentParent &&
                !item.path.toLowerCase().endsWith('.pdf') &&
                (item.path.toLowerCase().endsWith('.png') ||
                    item.path.toLowerCase().endsWith('.jpg') ||
                    item.path.toLowerCase().endsWith('.jpeg'))
            )
            .map(item => item.path)
            .sort();
    };

    // URL encode the path to handle special characters
    const encodePath = (p: string) => {
        const parts = p.split('/');
        return parts.map(part => encodeURIComponent(part)).join('/');
    };

    const getImageStyle = () => {
        const mode = zoomMode();
        if (mode === 'fit-width') {
            return { width: '100%', height: 'auto' };
        } else if (mode === 'fit-page') {
            return { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const };
        } else if (mode === 'actual') {
            return { width: 'auto', height: 'auto' };
        } else {
            // Custom zoom percentage
            return { width: `${mode}%`, height: 'auto' };
        }
    };

    const zoomIn = () => {
        if (typeof zoomMode() === 'number') {
            setZoomMode(Math.min((zoomMode() as number) + 10, 300));
        } else {
            setCustomZoom(Math.min(customZoom() + 10, 300));
            setZoomMode(customZoom());
        }
    };

    const zoomOut = () => {
        if (typeof zoomMode() === 'number') {
            setZoomMode(Math.max((zoomMode() as number) - 10, 25));
        } else {
            setCustomZoom(Math.max(customZoom() - 10, 25));
            setZoomMode(customZoom());
        }
    };

    return (
        <div class="h-full w-full bg-[var(--obsidian-bg-primary)] flex flex-col overflow-hidden">
            {/* Header with controls */}
            <div class="flex items-center justify-between p-4 border-b border-[var(--obsidian-border)] bg-[var(--obsidian-bg-secondary)]">
                <div class="flex-1">
                    <h1 class="text-xl font-bold text-[var(--obsidian-text-normal)] truncate">
                        {isPdf() ? fileName() : `${relatedFiles().length} page${relatedFiles().length > 1 ? 's' : ''}`}
                    </h1>
                    {!isPdf() && (
                        <p class="text-sm text-[var(--obsidian-text-muted)]">
                            {props.catalog?.find(item => item.path === props.path)?.parent || 'Images'}
                        </p>
                    )}
                </div>

                {/* Zoom Controls */}
                {!isPdf() && (
                    <div class="flex items-center gap-2">
                        <button
                            onClick={zoomOut}
                            class="px-3 py-1 bg-[var(--obsidian-bg-primary)] hover:bg-[var(--obsidian-accent)] text-[var(--obsidian-text-normal)] rounded border border-[var(--obsidian-border)] transition"
                            title="Zoom Out"
                        >
                            <span class="i-carbon-zoom-out"></span>
                        </button>

                        <select
                            value={typeof zoomMode() === 'number' ? 'custom' : zoomMode()}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                if (val === 'custom') {
                                    setZoomMode(customZoom());
                                } else {
                                    setZoomMode(val as ZoomMode);
                                }
                            }}
                            class="px-3 py-1 bg-[var(--obsidian-bg-primary)] text-[var(--obsidian-text-normal)] border border-[var(--obsidian-border)] rounded"
                        >
                            <option value="fit-width">Fit Width</option>
                            <option value="fit-page">Fit Page</option>
                            <option value="actual">Actual Size</option>
                            {typeof zoomMode() === 'number' && (
                                <option value="custom">{Math.round(zoomMode() as number)}%</option>
                            )}
                        </select>

                        <button
                            onClick={zoomIn}
                            class="px-3 py-1 bg-[var(--obsidian-bg-primary)] hover:bg-[var(--obsidian-accent)] text-[var(--obsidian-text-normal)] rounded border border-[var(--obsidian-border)] transition"
                            title="Zoom In"
                        >
                            <span class="i-carbon-zoom-in"></span>
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div class="flex-1 overflow-auto bg-[var(--obsidian-bg-secondary)] p-4">
                {isPdf() ? (
                    // PDF Viewer
                    <div class="w-full h-full flex items-center justify-center">
                        <iframe
                            src={`${encodePath(props.path)}#view=FitH&toolbar=1&navpanes=1`}
                            class="w-full h-full border-0 rounded-lg shadow-xl"
                            title="PDF Viewer"
                            style={{
                                'background': 'white',
                                'min-height': '600px'
                            }}
                        />
                    </div>
                ) : (
                    // Multi-Page Image Viewer
                    <div class="flex flex-col items-center gap-6">
                        <For each={relatedFiles()}>
                            {(imagePath, index) => (
                                <div class="relative bg-white rounded-lg shadow-xl p-2" style={{ 'page-break-after': 'always' }}>
                                    {/* Page number badge */}
                                    <div class="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                                        {index() + 1} / {relatedFiles().length}
                                    </div>

                                    <img
                                        src={encodePath(imagePath)}
                                        alt={`Page ${index() + 1}`}
                                        class="rounded"
                                        style={getImageStyle()}
                                        onError={(e) => {
                                            console.error('Failed to load image:', imagePath);
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            const errorDiv = document.createElement('div');
                                            errorDiv.className = 'text-red-400 text-center p-8 bg-red-50 rounded';
                                            errorDiv.textContent = `Failed to load: ${imagePath.split('/').pop()}`;
                                            target.parentElement?.appendChild(errorDiv);
                                        }}
                                    />
                                </div>
                            )}
                        </For>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScribbleViewer;
