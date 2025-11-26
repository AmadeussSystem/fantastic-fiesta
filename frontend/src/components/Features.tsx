import { Component, For, createSignal, onMount } from 'solid-js';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: 'i-carbon-tree-view',
    title: 'Structured Learning Path',
    description: 'Follow a carefully crafted roadmap from basics to advanced algorithms, organized in logical phases.',
    gradient: 'from-accent-green to-accent-cyan',
  },
  {
    icon: 'i-carbon-sync',
    title: 'Auto-Sync Notes',
    description: 'Your handwritten notes from Scrble Ink are automatically synced to GitHub when you study.',
    gradient: 'from-primary-500 to-accent-purple',
  },
  {
    icon: 'i-carbon-analytics',
    title: 'Progress Tracking',
    description: 'Track your completion status across all topics with visual checkmarks and statistics.',
    gradient: 'from-accent-purple to-accent-pink',
  },
  {
    icon: 'i-carbon-code',
    title: 'Code Solutions',
    description: 'Access C++ implementations for each pattern, from sliding window to dynamic programming.',
    gradient: 'from-accent-orange to-red-500',
  },
  {
    icon: 'i-carbon-flash',
    title: 'Quick Reference',
    description: 'Instant access to pattern templates and algorithm implementations when you need them.',
    gradient: 'from-accent-cyan to-accent-blue',
  },
  {
    icon: 'i-carbon-rocket',
    title: 'Interview Ready',
    description: 'Cover all essential topics needed for technical interviews at top tech companies.',
    gradient: 'from-accent-pink to-accent-purple',
  },
];

const Features: Component = () => {
  const [visible, setVisible] = createSignal(false);
  let sectionRef: HTMLElement | undefined;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef) {
      observer.observe(sectionRef);
    }

    return () => observer.disconnect();
  });

  return (
    <section id="features" class="section-padding" ref={sectionRef}>
      <div class="container-custom">
        {/* Section Header */}
        <div class="text-center mb-16">
          <span class="text-primary-400 font-semibold mb-4 block">Features</span>
          <h2 class="heading-lg mb-4">
            Everything you need to{' '}
            <span class="gradient-text">master DSA</span>
          </h2>
          <p class="text-gray-400 max-w-2xl mx-auto">
            A comprehensive toolkit designed to accelerate your learning and keep you organized throughout your DSA journey.
          </p>
        </div>

        {/* Features Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={features}>
            {(feature, index) => (
              <div
                class={`card group cursor-default transition-all duration-500 ${
                  visible()
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ "transition-delay": `${index() * 100}ms` }}
              >
                {/* Icon */}
                <div
                  class={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span class={`${feature.icon} text-xl text-white`} />
                </div>

                {/* Content */}
                <h3 class="heading-md mb-2 group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p class="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect line */}
                <div class="mt-4 h-0.5 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent w-0 group-hover:w-full transition-all duration-500" />
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};

export default Features;
