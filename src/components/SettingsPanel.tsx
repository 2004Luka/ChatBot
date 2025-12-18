import type { ChatSettings } from '../types/chat';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: ChatSettings;
  onClose: () => void;
  onSettingsChange: (settings: ChatSettings) => void;
  onExport: () => void;
  onDelete: () => void;
}

export const SettingsPanel = ({ isOpen, settings, onClose, onSettingsChange, onExport, onDelete }: SettingsPanelProps) => (
  <>
    {isOpen && <div className="settings-backdrop" onClick={onClose} />}
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="settings-header">
        <h3>Settings</h3>
        <button className="close-button" onClick={onClose} aria-label="Close settings">×</button>
      </div>
      <div className="settings-content">
        <div className="setting-item">
          <label>
            <input type="checkbox" checked={settings.autoScroll} onChange={(e) => onSettingsChange({ ...settings, autoScroll: e.target.checked })} />
            Auto-scroll to bottom
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" checked={settings.showTimestamps} onChange={(e) => onSettingsChange({ ...settings, showTimestamps: e.target.checked })} />
            Show timestamps
          </label>
        </div>
        <div className="setting-actions">
          <button onClick={onExport}>Export Chat</button>
          <button onClick={onDelete} className="danger">Delete Chat</button>
        </div>
      </div>
    </div>
  </>
);

