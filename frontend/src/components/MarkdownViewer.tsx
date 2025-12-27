import { Component, createResource, createEffect, createSignal } from 'solid-js';
import { marked } from 'marked';
import matter from 'gray-matter';
// Import Obsidian vault CSS snippets first
import '../styles/obsidian-snippets/index.css';
// Then import our obsidian.css to override with simple !important styles
import '../styles/obsidian.css';

interface MarkdownViewerProps {
    path: string;
}

const fetchMarkdown = async (path: string) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Note not found');
    return response.text();
};

const MarkdownViewer: Component<MarkdownViewerProps> = (props) => {
    const [content] = createResource(() => props.path, fetchMarkdown);
    const [html, setHtml] = createSignal('');
    const [cssClasses, setCssClasses] = createSignal<string[]>([]);
    const [frontmatter, setFrontmatter] = createSignal<Record<string, any>>({});

    createEffect(async () => {
        const rawMarkdown = content();
        if (rawMarkdown) {
            try {
                // Parse frontmatter
                const { data, content: markdownContent } = matter(rawMarkdown);

                // Extract CSS classes from frontmatter
                let classes: string[] = [];
                if (data.cssclasses) {
                    if (typeof data.cssclasses === 'string') {
                        classes = data.cssclasses.split(',').map((c: string) => c.trim());
                    } else if (Array.isArray(data.cssclasses)) {
                        classes = data.cssclasses;
                    }
                } else if (data.cssclass) {
                    // Also support singular 'cssclass'
                    classes = [data.cssclass];
                }

                setCssClasses(classes);
                setFrontmatter(data);

                // Debug logging
                console.log('Frontmatter data:', data);
                console.log('Extracted CSS classes:', classes);

                // Parse and render markdown (without frontmatter)
                const parsed = await marked.parse(markdownContent);
                setHtml(parsed);
            } catch (error) {
                console.error('Error parsing markdown frontmatter:', error);
                console.log('Raw markdown:', rawMarkdown);

                // Fallback: try to render without frontmatter parsing
                try {
                    // Remove frontmatter manually if present
                    let contentWithoutFrontmatter = rawMarkdown;
                    if (rawMarkdown.startsWith('---')) {
                        // Find the end of frontmatter
                        const endOfFrontmatter = rawMarkdown.indexOf('---', 3);
                        if (endOfFrontmatter !== -1) {
                            contentWithoutFrontmatter = rawMarkdown.substring(endOfFrontmatter + 3).trim();
                        }
                    }

                    const parsed = await marked.parse(contentWithoutFrontmatter);
                    setHtml(parsed);
                    setCssClasses([]);
                    setFrontmatter({});
                } catch (fallbackError) {
                    console.error('Error in fallback parsing:', fallbackError);
                    setHtml(`<p class="text-red-400">Error rendering markdown. Check console for details.</p>`);
                }
            }
        } else {
            setHtml('');
            setCssClasses([]);
            setFrontmatter({});
        }
    });

    // Build class string
    const containerClasses = () => {
        const baseClasses = ['obsidian-theme', 'w-full', 'h-full', 'p-8', 'overflow-y-auto'];
        const customClasses = cssClasses();
        const allClasses = [...baseClasses, ...customClasses].join(' ');
        console.log('Container classes:', allClasses);
        return allClasses;
    };

    return (
        <div class={containerClasses()}>
            <div class="max-w-4xl mx-auto">
                <h1 class="mb-6">
                    {props.path.split('/').pop()?.replace('.md', '')}
                </h1>
                {/* Show frontmatter tags if they exist */}
                {frontmatter().tags && (
                    <div class="mb-4 flex flex-wrap gap-2">
                        {Array.isArray(frontmatter().tags)
                            ? frontmatter().tags.map((tag: string) => (
                                <span class="px-2 py-1 text-xs bg-[var(--obsidian-accent)]/20 text-[var(--obsidian-accent)] rounded">
                                    #{tag}
                                </span>
                            ))
                            : null
                        }
                    </div>
                )}
                <div
                    class="markdown-body"
                    innerHTML={html()}
                >
                    {content.loading && <p>Loading note...</p>}
                    {content.error && <p class="text-red-400">Error loading note: {(content.error as Error).message}</p>}
                </div>
            </div>
        </div>
    );
};

export default MarkdownViewer;
