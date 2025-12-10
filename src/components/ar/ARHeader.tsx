import { FC } from 'react';
import { Menu } from 'lucide-react';

interface ARHeaderProps {
  onMenuClick: () => void;
}

export const ARHeader: FC<ARHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 safe-area-top">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Powered by</p>
            <h1 className="text-sm font-semibold text-foreground">Stories AR</h1>
          </div>
        </div>

        <button
          onClick={onMenuClick}
          className="glass-button w-10 h-10 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
};
