import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = '', size = 20 }) => {
  // Dynamically resolve icon from Lucide
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[name] || Icons.CircleDot;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_ICONS = [
  'Utensils',
  'ShoppingBag',
  'Gamepad2',
  'Globe',
  'Car',
  'Receipt',
  'Coins',
  'Coffee',
  'Shirt',
  'HeartPulse',
  'Home',
  'Plane',
  'GraduationCap',
  'Gift',
  'Smartphone',
  'Fuel',
  'Dumbbell',
  'Film',
  'Music',
  'Wrench',
  'Sparkles',
];
