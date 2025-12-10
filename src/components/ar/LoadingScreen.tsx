import { FC } from 'react';

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export const LoadingScreen: FC<LoadingScreenProps> = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Stories AR</h1>
          <p className="text-sm text-muted-foreground">Augmented reality for photos</p>
        </div>

        <div className="w-64 space-y-3">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};
