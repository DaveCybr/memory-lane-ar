import { FC } from 'react';
import { X, HelpCircle, Trash2, Download, MessageCircle, MoreVertical } from 'lucide-react';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlPanel: FC<ControlPanelProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: HelpCircle, label: 'FAQ', onClick: () => console.log('FAQ') },
    { icon: Trash2, label: 'Clear photos', onClick: () => console.log('Clear') },
    { icon: Download, label: 'Export debug logs', onClick: () => console.log('Export') },
    { icon: MessageCircle, label: 'Support', onClick: () => console.log('Support') },
    { icon: MoreVertical, label: 'Learn more', onClick: () => console.log('Learn') },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside 
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-card border-l border-border 
                    transform transition-transform duration-300 ease-out ${
                      isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Stories AR</h2>
                <p className="text-xs text-muted-foreground">Augmented reality for photos</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <footer className="p-6 border-t border-border space-y-4">
            <div className="flex justify-center gap-4">
              {['instagram', 'facebook', 'youtube'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com/storiesalbum`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-muted-foreground rounded-sm" />
                </a>
              ))}
            </div>
            <a 
              href="https://stories-ar.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-center text-sm text-primary hover:underline"
            >
              stories-ar.com
            </a>
          </footer>
        </div>
      </aside>
    </>
  );
};
