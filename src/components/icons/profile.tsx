import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ProfileIconProps {
  color?: string;
  size?: number;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ color = '#6c757d', size = 25 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.845 21.662C8.153 21.662 5 21.087 5 18.787c0-2.301 3.133-4.425 6.845-4.425 3.691 0 6.844 2.103 6.844 4.404s-3.133 2.896-6.844 2.896M11.837 11.174a4.386 4.386 0 1 0 0-8.774A4.39 4.39 0 0 0 7.45 6.787a4.37 4.37 0 0 0 4.356 4.387z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      clipRule="evenodd"
    />
  </Svg>
);

export default ProfileIcon;