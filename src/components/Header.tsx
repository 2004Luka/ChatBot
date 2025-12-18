import { FiMenu, FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import type { ChatSettings } from '../types/chat';
import './Header.css';

interface HeaderProps {
  settings: ChatSettings;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onToggleSettings: () => void;
}

export const Header = ({ settings, onToggleSidebar, onToggleTheme, onToggleSettings }: HeaderProps) => (
  <header className="app-header">
    <div className="header-left">
      <button className="header-button sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar" data-hide-on-desktop>
        <FiMenu size={22} />
      </button>
      <h1 className="app-title">AI Chat Assistant</h1>
    </div>
    <div className="header-right">
      <button className="header-button theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
        {settings.theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
      </button>
      <button className="header-button settings-toggle" onClick={onToggleSettings} aria-label="Settings" data-hide-on-large-desktop>
        <FiSettings size={20} />
      </button>
    </div>
  </header>
);

