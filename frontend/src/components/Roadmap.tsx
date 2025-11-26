import { Component, For, createSignal, onMount } from 'solid-js';

interface Topic {
  name: string;
  completed: boolean;
  link?: string;
}

interface Phase {
  title: string;
  description: string;
  gradient: string;
  topics: Topic[];
}

const roadmapData: Phase[] = [
  {
    title: 'Phase 1: Fundamentals',
    description: 'Build a strong foundation with basic data structures and techniques',
    gradient: 'from-accent-green to-accent-cyan',
    topics: [
      { name: 'Revision', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/Revision' },
      { name: 'Two Pointers', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/TwoPointers' },
      { name: 'Sliding Window', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/Sliding%20Window' },
      { name: 'Stack & Queue', completed: true },
      { name: 'Hash Table', completed: false },
      { name: 'Binary Search', completed: false },
      { name: 'Modified Binary Search', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/Modified%20Binary%20Search' },
    ],
  },
  {
    title: 'Phase 2: Intermediate',
    description: 'Master advanced sorting and array manipulation patterns',
    gradient: 'from-primary-500 to-accent-purple',
    topics: [
      { name: 'Mergesort', completed: true },
      { name: 'Quicksort', completed: true },
      { name: 'Counting Sort', completed: true },
      { name: 'Heap Sort', completed: false },
      { name: 'Merge Intervals', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/Merge%20Intervals' },
      { name: 'Cyclic Sort', completed: true, link: 'https://github.com/AmadeussSystem/fantastic-fiesta/tree/main/Scribble/DSA%26Patterns/Arrays/Cycle%20Sort' },
      { name: 'Linked Lists', completed: false },
    ],
  },
  {
    title: 'Phase 3: Core Algorithms',
    description: 'Dive into dynamic programming and backtracking',
    gradient: 'from-accent-purple to-accent-pink',
    topics: [
      { name: 'Fibonacci with Memoization', completed: true },
      { name: 'Coin Change Problem', completed: true },
      { name: 'Kadane\'s Algorithm', completed: true },
      { name: '0-1 Knapsack', completed: true },
      { name: 'Fractional Knapsack', completed: true },
      { name: 'N Queens Puzzle', completed: false },
      { name: 'Sudoku Solver', completed: false },
    ],
  },
  {
    title: 'Phase 4: Advanced DS',
    description: 'Explore complex data structures and their applications',
    gradient: 'from-accent-pink to-accent-orange',
    topics: [
      { name: 'AVL Tree', completed: false },
      { name: 'Red-Black Tree', completed: false },
      { name: 'Segment Tree', completed: false },
      { name: 'Fenwick Tree', completed: false },
      { name: 'Min/Max Heap', completed: false },
      { name: 'Union Find', completed: false },
    ],
  },
  {
    title: 'Phase 5: Graph Theory',
    description: 'Master graph algorithms from basics to advanced',
    gradient: 'from-accent-orange to-red-500',
    topics: [
      { name: 'BFS & DFS', completed: false },
      { name: 'Dijkstra\'s Algorithm', completed: false },
      { name: 'Bellman-Ford', completed: false },
      { name: 'Floyd-Warshall', completed: false },
      { name: 'Minimum Spanning Tree', completed: false },
      { name: 'Topological Sort', completed: false },
      { name: 'Maximum Flow', completed: false },
    ],
  },
];

const Roadmap: Component = () => {
  const [visible, setVisible] = createSignal(false);
  const [activePhase, setActivePhase] = createSignal(0);
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

  const getCompletedCount = (phase: Phase) => {
    return phase.topics.filter((t) => t.completed).length;
  };

  const getProgress = (phase: Phase) => {
    return Math.round((getCompletedCount(phase) / phase.topics.length) * 100);
  };

  return (
    <section id="roadmap" class="section-padding" ref={sectionRef}>
      <div class="container-custom">
        {/* Section Header */}
        <div class="text-center mb-16">
          <span class="text-primary-400 font-semibold mb-4 block">Learning Path</span>
          <h2 class="heading-lg mb-4">
            Your <span class="gradient-text">DSA Roadmap</span>
          </h2>
          <p class="text-gray-400 max-w-2xl mx-auto">
            A structured journey from fundamentals to advanced algorithms. Track your progress and never lose sight of your goals.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8">
          {/* Phase Selector */}
          <div class="lg:col-span-4">
            <div class="glass rounded-2xl p-4 sticky top-24">
              <For each={roadmapData}>
                {(phase, index) => (
                  <button
                    class={`w-full text-left p-4 rounded-xl transition-all duration-300 mb-2 last:mb-0 ${
                      activePhase() === index()
                        ? 'bg-dark-200 border border-primary-500/50'
                        : 'hover:bg-dark-200/50'
                    } ${
                      visible()
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ "transition-delay": `${index() * 100}ms` }}
                    onClick={() => setActivePhase(index())}
                  >
                    <div class="flex items-center gap-3 mb-2">
                      <div
                        class={`w-8 h-8 rounded-lg bg-gradient-to-br ${phase.gradient} flex items-center justify-center text-sm font-bold`}
                      >
                        {index() + 1}
                      </div>
                      <span class="font-semibold text-sm">{phase.title}</span>
                    </div>
                    {/* Progress bar */}
                    <div class="ml-11">
                      <div class="h-1.5 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          class={`h-full bg-gradient-to-r ${phase.gradient} transition-all duration-500`}
                          style={{ width: `${getProgress(phase)}%` }}
                        />
                      </div>
                      <span class="text-xs text-gray-500 mt-1 block">
                        {getCompletedCount(phase)}/{phase.topics.length} completed
                      </span>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Topics Grid */}
          <div class="lg:col-span-8">
            <div
              class={`glass rounded-2xl p-6 md:p-8 transition-all duration-500 ${
                visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Phase Header */}
              <div class="mb-8">
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class={`w-10 h-10 rounded-xl bg-gradient-to-br ${roadmapData[activePhase()].gradient} flex items-center justify-center font-bold`}
                  >
                    {activePhase() + 1}
                  </div>
                  <h3 class="heading-md">{roadmapData[activePhase()].title}</h3>
                </div>
                <p class="text-gray-400 ml-13">{roadmapData[activePhase()].description}</p>
              </div>

              {/* Topics */}
              <div class="grid sm:grid-cols-2 gap-4">
                <For each={roadmapData[activePhase()].topics}>
                  {(topic, index) => (
                    <a
                      href={topic.link || '#'}
                      target={topic.link ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      class={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                        topic.completed
                          ? 'bg-accent-green/10 border border-accent-green/20 hover:border-accent-green/40'
                          : 'bg-dark-300/50 border border-white/5 hover:border-primary-500/30'
                      } ${topic.link ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ "animation-delay": `${index() * 50}ms` }}
                    >
                      <span
                        class={`text-xl ${
                          topic.completed
                            ? 'i-carbon-checkmark-filled text-accent-green'
                            : 'i-carbon-radio-button text-gray-500'
                        }`}
                      />
                      <span
                        class={`font-medium ${
                          topic.completed ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {topic.name}
                      </span>
                      {topic.link && (
                        <span class="i-carbon-arrow-right ml-auto text-gray-500" />
                      )}
                    </a>
                  )}
                </For>
              </div>

              {/* Progress Summary */}
              <div class="mt-8 pt-6 border-t border-white/5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">Phase Progress</span>
                  <span class="font-semibold">
                    <span class="text-accent-green">{getProgress(roadmapData[activePhase()])}%</span>
                    {' '}Complete
                  </span>
                </div>
                <div class="mt-2 h-2 bg-dark-400 rounded-full overflow-hidden">
                  <div
                    class={`h-full bg-gradient-to-r ${roadmapData[activePhase()].gradient} transition-all duration-500`}
                    style={{ width: `${getProgress(roadmapData[activePhase()])}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
