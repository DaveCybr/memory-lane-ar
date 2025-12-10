import { FC } from 'react';
import { Camera, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionPromptProps {
  onStart: () => void;
}

export const PermissionPrompt: FC<PermissionPromptProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="glass-panel p-8 mx-6 max-w-sm w-full text-center space-y-6 fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
          <Camera className="w-10 h-10 text-primary-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Start AR Experience</h2>
          <p className="text-sm text-muted-foreground">
            Allow camera and audio access to scan photos and play videos
          </p>
        </div>

        <div className="flex justify-center gap-6 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            <span>Audio</span>
          </div>
        </div>

        <Button 
          onClick={onStart}
          className="w-full bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 text-primary-foreground font-medium py-6"
          size="lg"
        >
          Start
        </Button>
      </div>
    </div>
  );
};
