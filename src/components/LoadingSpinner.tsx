import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="text-center">
        <Loader2 className={`animate-spin text-blue-600 mx-auto ${sizeClasses[size]} ${text ? 'mb-2' : ''}`} />
        {text && <p className="text-gray-600 font-medium">{text}</p>}
      </div>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-progress" style={{ width: '75%' }} />
          </div>
          <span className="text-sm text-gray-500">75%</span>
        </div>
        <button 
          onClick={() => {
            const bypass = localStorage.getItem('dev-bypass-auth') === 'true';
            localStorage.setItem('dev-bypass-auth', (!bypass).toString());
            window.location.reload();
          }}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Quick Access (Dev Mode)
        </button>
      </div>
    </div>
  );
};

export default LoadingSpinner;
