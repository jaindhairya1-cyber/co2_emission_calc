import React from 'react';
import { Home, User, Edit3, PieChart, MoreHorizontal, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BottomNavBar({ activeTab }) {
  const { navigateTo } = useApp();

  const navItems = [
    { key: 'home', label: 'Home', icon: Home, screen: 8 },
    { key: 'profile', label: 'Profile', icon: User, screen: 13 },
    { key: 'inputs', label: 'Inputs', icon: Edit3, screen: 0 }, // Screen 0: Ask User First for Domain!
    { key: 'results', label: 'Results', icon: PieChart, screen: 9 },
    { key: 'more', label: 'More', icon: MoreHorizontal, screen: 14 }
  ];

  return (
    <nav className="bottom-nav-bar" aria-label="Bottom Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            id={`nav-${item.key}`}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigateTo(item.screen)}
            aria-label={item.label}
          >
            <div className="nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
