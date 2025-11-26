import { Component } from 'solid-js';

const Footer: Component = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    resources: [
      { name: 'Documentation', href: '#' },
      { name: 'GitHub Repo', href: 'https://github.com/AmadeussSystem/fantastic-fiesta' },
      { name: 'Roadmap', href: '#roadmap' },
    ],
    community: [
      { name: 'GitHub Discussions', href: 'https://github.com/AmadeussSystem/fantastic-fiesta/discussions' },
      { name: 'Issues', href: 'https://github.com/AmadeussSystem/fantastic-fiesta/issues' },
    ],
    topics: [
      { name: 'Arrays', href: '#' },
      { name: 'Dynamic Programming', href: '#' },
      { name: 'Graph Theory', href: '#' },
    ],
  };

  return (
    <footer class="border-t border-white/5">
      <div class="container-custom section-padding pb-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div class="col-span-2 md:col-span-1">
            <a href="#" class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center font-bold text-lg">
                FF
              </div>
              <span class="font-bold text-xl">
                <span class="gradient-text">Fantastic</span> Fiesta
              </span>
            </a>
            <p class="text-gray-400 text-sm mb-4">
              A comprehensive DSA learning roadmap with automatic note synchronization.
            </p>
            <div class="flex items-center gap-3">
              <a
                href="https://github.com/AmadeussSystem/fantastic-fiesta"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-100 transition-all duration-300"
              >
                <span class="i-carbon-logo-github text-xl" />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 class="font-semibold mb-4">Resources</h4>
            <ul class="space-y-2">
              {links.resources.map((link) => (
                <li>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    class="text-gray-400 text-sm link-hover"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 class="font-semibold mb-4">Community</h4>
            <ul class="space-y-2">
              {links.community.map((link) => (
                <li>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-gray-400 text-sm link-hover"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          <div>
            <h4 class="font-semibold mb-4">Topics</h4>
            <ul class="space-y-2">
              {links.topics.map((link) => (
                <li>
                  <a href={link.href} class="text-gray-400 text-sm link-hover">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div class="pt-8 border-t border-white/5">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-gray-500 text-sm">
              Copyright © {currentYear} Fantastic Fiesta. All rights reserved.
            </p>
            <p class="text-gray-500 text-sm flex items-center gap-2">
              Built with
              <span class="i-carbon-favorite-filled text-red-500" />
              using
              <span class="text-primary-400 font-medium">SolidJS</span>
              +
              <span class="text-accent-purple font-medium">UnoCSS</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
