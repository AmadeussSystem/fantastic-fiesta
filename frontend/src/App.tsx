import { Component } from 'solid-js';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Roadmap from './components/Roadmap';
import SyncFeature from './components/SyncFeature';
import Stats from './components/Stats';
import Footer from './components/Footer';

const App: Component = () => {
  return (
    <div class="min-h-screen bg-dark-500 text-white overflow-hidden">
      {/* Background effects */}
      <div class="fixed inset-0 bg-grid pointer-events-none" />
      <div class="gradient-blob w-96 h-96 bg-primary-500/30 top-0 -left-48 fixed" />
      <div class="gradient-blob w-80 h-80 bg-accent-purple/20 top-1/3 -right-40 fixed" />
      <div class="gradient-blob w-72 h-72 bg-accent-pink/20 bottom-0 left-1/4 fixed" />
      
      {/* Content */}
      <div class="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Stats />
          <Roadmap />
          <SyncFeature />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
