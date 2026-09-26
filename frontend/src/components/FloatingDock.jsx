import React, { useState } from 'react';
import { Home, CheckCircle2, Calendar, Target } from 'lucide-react';
import './FloatingDock.css';

export default function FloatingDock({ activePage, setActivePage, onStartCase }) {
  const [activeItem, setActiveItem] = useState('home');

  const handleItemClick = (id) => {
    setActiveItem(id);

    if (id === 'home') {
      if (activePage !== 'home') setActivePage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'reviews') {
      if (activePage !== 'home') setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById('reviews');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (id === 'how-it-works') {
      if (activePage !== 'home') setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (id === 'start-case') {
      onStartCase();
    }
  };

  return (
    <div className="floating-dock-wrapper" role="navigation" aria-label="Quick Dock Navigation">
      <div className="floating-glass-capsule">
        <button
          className={`dock-pill-btn ${activeItem === 'home' && activePage === 'home' ? 'active' : ''}`}
          onClick={() => handleItemClick('home')}
          title="Home"
          aria-label="Home"
        >
          <Home size={20} strokeWidth={2.2} />
        </button>

        <button
          className={`dock-pill-btn ${activeItem === 'reviews' ? 'active' : ''}`}
          onClick={() => handleItemClick('reviews')}
          title="Verified Case Reviews"
          aria-label="Verified Case Reviews"
        >
          <CheckCircle2 size={20} strokeWidth={2} />
        </button>

        <button
          className={`dock-pill-btn ${activeItem === 'how-it-works' ? 'active' : ''}`}
          onClick={() => handleItemClick('how-it-works')}
          title="How It Works Timeline"
          aria-label="How It Works Timeline"
        >
          <Calendar size={20} strokeWidth={2} />
        </button>

        <button
          className={`dock-pill-btn ${activeItem === 'start-case' ? 'active' : ''}`}
          onClick={() => handleItemClick('start-case')}
          title="Start Recovery Case"
          aria-label="Start Recovery Case"
        >
          <Target size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Three Pagination Dots (Matching user's reference image) */}
      <div className="dock-carousel-dots" aria-hidden="true">
        <span className="dock-dot" />
        <span className="dock-dot active" />
        <span className="dock-dot" />
      </div>
    </div>
  );
}
