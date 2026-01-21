import React from 'react';
import Svg, { G, Path, Rect, Defs, ClipPath } from 'react-native-svg';

interface RemedyLogoIconProps {
  size?: number;
  color?: string;
}

const RemedyLogoIcon: React.FC<RemedyLogoIconProps> = ({ 
  size = 24, 
  color = '#A6A6A6' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 178 178">
      <Defs>
        <ClipPath id="clip1">
          <Rect x="0" y="0" width="8333.33" height="8333.33" />
        </ClipPath>
      </Defs>
      <G transform="matrix(0.02125,0,0,0.02125,0.6,0.7)">
        <G clipPath="url(#clip1)">
          <G transform="matrix(34.5223,0,0,34.5223,-9340.42,-30355.4)">
            <G transform="matrix(0.0445642,0,0,0.0445642,270.562,-383.355)">
              <Path
                d="M4791.67,30041.6C4791.67,29356.8 4224.22,28891 3638.37,28891L1190.78,28891L1190.78,29254.8L3638.37,29254.8C4122.37,29254.8 4421.56,29617.5 4421.56,30041.6C4421.56,30465.8 4122.37,30824.6 3638.37,30824.6L2435.27,30824.6L2435.27,31188.1L2633.59,31188.1L4107.28,33192.3L4531.33,33192.3L3079.39,31188.1L3638.37,31188.1C4224.22,31188.1 4791.67,30726.4 4791.67,30041.6ZM1547.34,30825.1L1547.34,30266.4L1183.67,30266.4L1183.67,30825.1L625,30825.1L625,31188.8L1183.67,31188.8L1183.67,31747.4L1547.34,31747.4L1547.34,31188.8L2106.01,31188.8L2106.01,30825.1L1547.34,30825.1Z"
                fill={color}
                fillRule="nonzero"
              />
            </G>
          </G>
        </G>
      </G>
    </Svg>
  );
};

export default RemedyLogoIcon;
