import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MapIconProps {
  color?: string;
  size?: number;
}

const MapIcon: React.FC<MapIconProps> = ({ color = '#6c757d', size = 25 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Path
      d="m31.783 5.814-3.116-3.479a1 1 0 0 0-.748-.336H16.974V.937c0-.517-.448-.938-1-.938s-1 .42-1 .938v1.062H6.98a1 1 0 0 0-1 1v6.989a1 1 0 0 0 1 1h7.994v2.003H4.081a1 1 0 0 0-.748.336L.218 16.868a1 1 0 0 0 0 1.328l3.115 3.509c.191.214.462.305.748.305h10.893v9.052c0 .517.448.938 1 .938s1-.42 1-.938v-9.053h8.015a1 1 0 0 0 1-1V13.99a1 1 0 0 0-1-1h-8.014v-2.003H27.92a1 1 0 0 0 .748-.336l3.116-3.51a1.003 1.003 0 0 0 0-1.328zM23.989 20.01H4.53l-2.228-2.477 2.228-2.541h19.459zM27.47 8.989H7.98V4h19.49l2.227 2.479z"
      fill={color}
    />
  </Svg>
);

export default MapIcon;