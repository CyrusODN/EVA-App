import React from 'react';
import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useTheme } from '../constants/theme';
import { ViewStyle, StyleProp } from 'react-native';

interface RemedyLogoProps {
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
}

const RemedyLogo: React.FC<RemedyLogoProps> = ({
  width = 100,
  height = 100,
  style,
}) => {
  const { isDark } = useTheme();

  // Dynamic color for "R" logo part
  // Light mode: rgb(13,13,13) -> #0D0D0D
  // Dark mode: #FAFAFA
  const logoColor = isDark ? '#FAFAFA' : '#0D0D0D';

  return (
    <Svg width={width} height={height} viewBox="0 0 5418 5418" style={style}>
      <G transform="matrix(1,0,0,1,-5634,-34062)">
        <G
          id="Remedy--Logo-3-1Gradient"
          transform="matrix(0.65,0,0,0.65,5634.67,34062.5)">
          <Rect x="0" y="0" width="8333.33" height="8333.33" fill="none" />
          <G
            id="Layer-1"
            transform="matrix(34.5223,0,0,34.5223,-9340.42,-30355.4)">
            <G transform="matrix(0.24,0,0,0.24,201.685,-2675.97)">
              <Path
                d="M1176.72,15130.8C1176.72,15003.7 1071.36,14917.2 962.572,14917.2L508.093,14917.2L508.093,14984.7L962.572,14984.7C1052.44,14984.7 1108,15052.1 1108,15130.8C1108,15209.6 1052.44,15276.2 962.572,15276.2L739.176,15276.2L739.176,15343.7L776.001,15343.7L1049.64,15715.8L1128.38,15715.8L858.779,15343.7L962.572,15343.7C1071.36,15343.7 1176.72,15258 1176.72,15130.8Z"
                fill={logoColor}
                fillRule="nonzero"
              />
            </G>
            <G transform="matrix(0.24,0,0,0.24,-147.422,-2001.1)">
              <Path
                d="M2028.91,12464.3L2028.91,12360.6L1961.38,12360.6L1961.38,12464.3L1857.65,12464.3L1857.65,12531.9L1961.38,12531.9L1961.38,12635.6L2028.91,12635.6L2028.91,12531.9L2132.65,12531.9L2132.65,12464.3L2028.91,12464.3Z"
                fill="url(#_Linear1)"
              />
            </G>
          </G>
        </G>
      </G>
      <Defs>
        <LinearGradient
          id="_Linear1"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(275,0,0,275,1857.65,12498.1)">
          <Stop offset="0" stopColor="rgb(61,151,197)" stopOpacity="1" />
          <Stop offset="1" stopColor="rgb(79,215,199)" stopOpacity="1" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
};

export default RemedyLogo;
