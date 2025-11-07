import './LoadingAnimation.css';

interface LoadingAnimationProps {
  onComplete?: () => void;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      {/* Loading Animation */}
      <div className="stack">
        <div className="stack__card"></div>
        <div className="stack__card"></div>
        <div className="stack__card"></div>
        <div className="stack__card"></div>
        <div className="stack__card"></div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">King House</h2>
        <p className="text-gray-400 animate-pulse">Загрузка...</p>
      </div>
    </div>
  );
}

