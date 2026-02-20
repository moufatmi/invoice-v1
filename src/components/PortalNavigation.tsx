import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LayoutGrid, GripVertical, Users } from 'lucide-react';

const PortalNavigation: React.FC = () => {
  const location = useLocation();
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('nav-position');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 200, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;

      // Boundary checks
      const boundedX = Math.max(10, Math.min(newX, window.innerWidth - 180));
      const boundedY = Math.max(10, Math.min(newY, window.innerHeight - 100));

      const newPos = { x: boundedX, y: boundedY };
      setPosition(newPos);
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('nav-position', JSON.stringify(position));
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, position]);

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-row items-center p-1.5 gap-1 min-w-[160px]">
        <div
          onMouseDown={onMouseDown}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="اسحب لتحريك القائمة"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex flex-row gap-1 border-l border-gray-100 dark:border-gray-700 ml-1 pl-1">
          <Link
            to="/portal"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/portal' || location.pathname === '/'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <User className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/portal/rooming"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/portal/rooming'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Rooming</span>
          </Link>
          <Link
            to="/portal/clients"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/portal/clients'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Clients</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalNavigation;

