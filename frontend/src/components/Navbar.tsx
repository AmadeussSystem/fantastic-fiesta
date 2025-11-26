import { Component, createSignal, onMount } from 'solid-js';

const Navbar: Component = () => {
  const [scrolled, setScrolled] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);

  onMount(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Roadmap', href: '#roadmap' },
    { name: 'Sync', href: '#sync' },
  ];

  return (
    <nav
      class={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled() 
          ? 'glass py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div class="container-custom flex items-center justify-between">
        {/* Logo */}
        <a href="#" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-300">
            FF
          </div>
          <span class="font-bold text-xl hidden sm:block">
            <span class="gradient-text">Fantastic</span> Fiesta
          </span>
        </a>

        {/* Desktop Navigation */}
        <div class="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              href={link.href}
              class="text-gray-300 link-hover font-medium relative group"
            >
              {link.name}
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-purple group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div class="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/AmadeussSystem/fantastic-fiesta"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-gray-300 link-hover font-medium"
          >
            <span class="i-carbon-logo-github text-xl" />
            GitHub
          </a>
          <a href="#roadmap" class="btn-primary text-sm">
            Get Started
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          class="md:hidden p-2 text-gray-300 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen())}
        >
          <div class="w-6 h-5 flex flex-col justify-between">
            <span
              class={`w-full h-0.5 bg-current transition-all duration-300 ${
                menuOpen() ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              class={`w-full h-0.5 bg-current transition-all duration-300 ${
                menuOpen() ? 'opacity-0' : ''
              }`}
            />
            <span
              class={`w-full h-0.5 bg-current transition-all duration-300 ${
                menuOpen() ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        class={`md:hidden absolute top-full left-0 right-0 glass transition-all duration-300 overflow-hidden ${
          menuOpen() ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div class="container-custom py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              href={link.href}
              class="text-gray-300 link-hover font-medium py-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://github.com/AmadeussSystem/fantastic-fiesta"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-gray-300 link-hover font-medium py-2"
          >
            <span class="i-carbon-logo-github text-xl" />
            GitHub
          </a>
          <a href="#roadmap" class="btn-primary text-center">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
