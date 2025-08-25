import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  color?: string;
  size?: number;
}

const HomeIcon: React.FC<HomeIconProps> = ({ color = '#6c757d', size = 25 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="m21.71 11.29-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0-.21 1.09A1 1 0 0 0 3 13h1v7.3A1.77 1.77 0 0 0 5.83 22H8.5a1 1 0 0 0 1-1v-4.9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V21a1 1 0 0 0 1 1h2.67A1.77 1.77 0 0 0 20 20.3V13h1a1 1 0 0 0 .92-.62 1 1 0 0 0-.21-1.09"
      fill={color}
    />
  </Svg>
);

export default HomeIcon;