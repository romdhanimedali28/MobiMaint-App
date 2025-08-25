import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ClockIconProps {
  color?: string;
  size?: number;
}

const ClockIcon: React.FC<ClockIconProps> = ({ color = '#6c757d', size = 25 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 7v5h3m6 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ClockIcon;