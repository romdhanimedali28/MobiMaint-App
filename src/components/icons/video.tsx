import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface VideoIconProps {
  color?: string;
  size?: number;
}

const VideoIcon: React.FC<VideoIconProps> = ({ color = '#6c757d', size = 25 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M8 12h22c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4M44 35l-10-6V19l10-6z"
      fill={color}
    />
  </Svg>
);

export default VideoIcon;