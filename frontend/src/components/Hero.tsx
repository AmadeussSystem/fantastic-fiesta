import { Component, createSignal, onMount } from 'solid-js';

const Hero: Component = () => {
  const [visible, setVisible] = createSignal(false);

  onMount(() => {
    setTimeout(() => setVisible(true), 100);
  });

  return (
    <section class="min-h-screen flex items-center justify-center section-padding pt-32">
      <div class="container-custom">
        <div class="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            class={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 transition-all duration-700 ${
              visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span class="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span class="text-sm text-gray-300">
              Auto-syncing your learning progress
            </span>
          </div>

          {/* Main Heading */}
          <h1
            class={`heading-xl mb-6 transition-all duration-700 delay-100 ${
              visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Master{' '}
            <span class="gradient-text animate-gradient">Data Structures</span>
            <br />
            <span class="text-gray-300">&</span>{' '}
            <span class="gradient-text animate-gradient">Algorithms</span>
          </h1>

          {/* Subtitle */}
          <p
            class={`text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            A comprehensive learning roadmap with automatic note synchronization.
            Track your progress from fundamentals to advanced algorithms.
          </p>

          {/* CTA Buttons */}
          <div
            class={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
              visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a href="#roadmap" class="btn-primary flex items-center gap-2 group">
              <span>Start Learning</span>
              <span class="i-carbon-arrow-right group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/AmadeussSystem/fantastic-fiesta"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary flex items-center gap-2"
            >
              <span class="i-carbon-logo-github" />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Hero Visual */}
          <div
            class={`relative transition-all duration-1000 delay-500 ${
              visible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Glow effect behind */}
            <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-purple/20 to-accent-pink/20 blur-3xl" />
            
            {/* Code preview card */}
            <div class="relative glass rounded-2xl p-6 md:p-8 glow">
              {/* Window controls */}
              <div class="flex items-center gap-2 mb-6">
                <div class="w-3 h-3 rounded-full bg-red-500" />
                <div class="w-3 h-3 rounded-full bg-yellow-500" />
                <div class="w-3 h-3 rounded-full bg-green-500" />
                <span class="ml-4 text-sm text-gray-500 font-mono">roadmap.md</span>
              </div>

              {/* Code content */}
              <div class="text-left font-mono text-sm md:text-base space-y-2">
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">01</span>
                  <span class="text-accent-purple">## Phase 1:</span>
                  <span class="text-white">Fundamentals</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">02</span>
                  <span class="text-accent-green">- [x]</span>
                  <span class="text-gray-300">Two Pointers</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">03</span>
                  <span class="text-accent-green">- [x]</span>
                  <span class="text-gray-300">Sliding Window</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">04</span>
                  <span class="text-accent-orange">- [ ]</span>
                  <span class="text-gray-300">Binary Search</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">05</span>
                  <span class="text-accent-purple">## Phase 2:</span>
                  <span class="text-white">Intermediate</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">06</span>
                  <span class="text-accent-green">- [x]</span>
                  <span class="text-gray-300">Merge Intervals</span>
                </div>
              </div>

              {/* Floating elements */}
              <div class="absolute -right-4 -top-4 w-16 h-16 rounded-xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center animate-float">
                <span class="i-carbon-checkmark-filled text-2xl text-white" />
              </div>
              <div class="absolute -left-4 -bottom-4 w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center animate-float" style={{ "animation-delay": "1s" }}>
                <span class="i-carbon-code text-xl text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
