import { Component, For, createSignal, onMount } from 'solid-js';

interface Stat {
  value: string;
  label: string;
  icon: string;
  color: string;
}

const stats: Stat[] = [
  { value: '5', label: 'Learning Phases', icon: 'i-carbon-chart-line', color: 'text-accent-green' },
  { value: '50+', label: 'Topics Covered', icon: 'i-carbon-folder', color: 'text-primary-400' },
  { value: '20+', label: 'Algorithms', icon: 'i-carbon-code', color: 'text-accent-purple' },
  { value: '∞', label: 'Practice Problems', icon: 'i-carbon-badge', color: 'text-accent-pink' },
];

const Stats: Component = () => {
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
      { threshold: 0.2 }
    );

    if (sectionRef) {
      observer.observe(sectionRef);
    }

    return () => observer.disconnect();
  });

  return (
    <section class="py-16" ref={sectionRef}>
      <div class="container-custom">
        <div class="glass rounded-3xl p-8 md:p-12">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <For each={stats}>
              {(stat, index) => (
                <div
                  class={`text-center transition-all duration-700 ${
                    visible()
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ "transition-delay": `${index() * 100}ms` }}
                >
                  <div class={`${stat.icon} text-3xl ${stat.color} mb-3 mx-auto`} />
                  <div class={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div class="text-gray-400 text-sm">{stat.label}</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
