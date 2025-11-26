import { Component, createSignal, onMount } from 'solid-js';

const SyncFeature: Component = () => {
  const [visible, setVisible] = createSignal(false);
  const [syncState, setSyncState] = createSignal<'idle' | 'syncing' | 'synced'>('idle');
  let sectionRef: HTMLElement | undefined;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            // Start animation sequence
            setTimeout(() => setSyncState('syncing'), 1000);
            setTimeout(() => setSyncState('synced'), 3000);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef) {
      observer.observe(sectionRef);
    }

    return () => observer.disconnect();
  });

  return (
    <section id="sync" class="section-padding overflow-hidden" ref={sectionRef}>
      <div class="container-custom">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div
            class={`transition-all duration-700 ${
              visible() ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <span class="text-primary-400 font-semibold mb-4 block">Auto Sync</span>
            <h2 class="heading-lg mb-6">
              Never lose your{' '}
              <span class="gradient-text">handwritten notes</span>
            </h2>
            <p class="text-gray-400 text-lg mb-8">
              Our intelligent sync system automatically backs up your handwritten notes from Scrble Ink to GitHub. 
              Focus on learning while we handle the rest.
            </p>

            {/* Feature list */}
            <div class="space-y-4">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                  <span class="i-carbon-checkmark-filled text-accent-green text-xl" />
                </div>
                <div>
                  <h4 class="font-semibold mb-1">Automatic Detection</h4>
                  <p class="text-gray-400 text-sm">
                    Monitors when Scrble Ink is running and automatically syncs your notes
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <span class="i-carbon-sync text-primary-400 text-xl" />
                </div>
                <div>
                  <h4 class="font-semibold mb-1">Smart Debouncing</h4>
                  <p class="text-gray-400 text-sm">
                    Waits for you to finish writing before syncing to minimize commits
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                  <span class="i-carbon-logo-github text-accent-purple text-xl" />
                </div>
                <div>
                  <h4 class="font-semibold mb-1">GitHub Integration</h4>
                  <p class="text-gray-400 text-sm">
                    All notes are versioned and backed up to your GitHub repository
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-accent-pink/20 flex items-center justify-center flex-shrink-0">
                  <span class="i-carbon-flash text-accent-pink text-xl" />
                </div>
                <div>
                  <h4 class="font-semibold mb-1">Conflict Resolution</h4>
                  <p class="text-gray-400 text-sm">
                    Automatically resolves merge conflicts to keep your notes safe
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div
            class={`relative transition-all duration-700 delay-200 ${
              visible() ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            {/* Glow effect */}
            <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-purple/20 blur-3xl" />
            
            <div class="relative glass rounded-3xl p-8 glow">
              {/* Terminal header */}
              <div class="flex items-center gap-2 mb-6">
                <div class="w-3 h-3 rounded-full bg-red-500" />
                <div class="w-3 h-3 rounded-full bg-yellow-500" />
                <div class="w-3 h-3 rounded-full bg-green-500" />
                <span class="ml-4 text-sm text-gray-500 font-mono">git_auto_sync.py</span>
              </div>

              {/* Console output */}
              <div class="font-mono text-sm space-y-3">
                <div class="flex items-center gap-2">
                  <span class="text-gray-500">[Monitor]</span>
                  <span class="text-gray-300">Waiting for Scrble Ink to launch...</span>
                </div>
                
                <div
                  class={`flex items-center gap-2 transition-opacity duration-500 ${
                    syncState() !== 'idle' ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span class="text-accent-green">[Monitor]</span>
                  <span class="text-gray-300">Scrble Ink detected. Starting sync script...</span>
                </div>

                <div
                  class={`transition-opacity duration-500 ${
                    syncState() === 'syncing' || syncState() === 'synced' ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-primary-400">[INFO]</span>
                    <span class="text-gray-300">Syncing changes...</span>
                    {syncState() === 'syncing' && (
                      <span class="i-carbon-sync animate-spin text-primary-400" />
                    )}
                  </div>
                </div>

                <div
                  class={`space-y-2 transition-opacity duration-500 ${
                    syncState() === 'synced' ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div class="flex items-center gap-2">
                    <span class="text-accent-green">[SUCCESS]</span>
                    <span class="text-gray-300">git pull completed</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-accent-green">[SUCCESS]</span>
                    <span class="text-gray-300">Changes committed and pushed</span>
                  </div>
                  <div class="flex items-center gap-2 text-accent-cyan">
                    <span class="i-carbon-checkmark-filled" />
                    <span>Notes synced to GitHub ✨</span>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div class="mt-6 pt-6 border-t border-white/5">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Status</span>
                  <div class="flex items-center gap-2">
                    <span
                      class={`w-2 h-2 rounded-full ${
                        syncState() === 'synced'
                          ? 'bg-accent-green'
                          : syncState() === 'syncing'
                          ? 'bg-primary-400 animate-pulse'
                          : 'bg-gray-500'
                      }`}
                    />
                    <span
                      class={`text-sm font-medium ${
                        syncState() === 'synced'
                          ? 'text-accent-green'
                          : syncState() === 'syncing'
                          ? 'text-primary-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {syncState() === 'synced'
                        ? 'Synced'
                        : syncState() === 'syncing'
                        ? 'Syncing...'
                        : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div class="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center animate-float shadow-lg shadow-accent-green/20">
              <span class="i-carbon-cloud-upload text-2xl text-white" />
            </div>
            <div class="absolute -bottom-4 -left-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center animate-float shadow-lg shadow-primary-500/20" style={{ "animation-delay": "1.5s" }}>
              <span class="i-carbon-document text-xl text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SyncFeature;
