import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

import type { GraphicProps } from '../graphics.types';

// 1. Airplane (Facing RIGHT, for SOL → SAĞ travel) with Motion Lines on the left
export function PlaneGraphic({ size = 55, color = '#183D38' }: GraphicProps) {
  return (
    <Svg width={size * 2.2} height={size} viewBox="0 0 140 60" fill="none">
      {/* Motion trail lines behind plane (on the left side) */}
      <Path
        d="M 8 32 Q 35 25 62 30"
        stroke="#A7B7AA"
        strokeWidth="1.6"
        strokeDasharray="4 4"
        opacity="0.6"
      />
      <Path
        d="M 16 18 H 54"
        stroke="#A7B7AA"
        strokeWidth="1.4"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      {/* Airplane Body (Facing RIGHT: Nose at x=125, Tail at x=70) */}
      <G transform="translate(65, 10)">
        <Path
          d="M 60 22 L 45 26 L 29 40 L 23 39 L 34 24 L 17 24 L 12 29 L 9 28 L 12 22 L 9 16 L 12 15 L 17 20 L 34 20 L 23 5 L 29 4 L 45 18 L 60 22 Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#F8F6F0"
        />
      </G>
    </Svg>
  );
}

// 2. Train (Facing LEFT, for SAĞ → SOL travel) with Motion Lines on the right
export function TrainGraphic({ size = 50, color = '#183D38' }: GraphicProps) {
  return (
    <Svg width={size * 2.2} height={size * 0.75} viewBox="0 0 120 42" fill="none">
      {/* Motion lines behind train (on the right side) */}
      <Path
        d="M 68 18 H 115 M 62 26 H 110 M 72 34 H 118"
        stroke="#A7B7AA"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Train Body (Facing LEFT: Engine front at x=12, Rear at x=60) */}
      <G transform="translate(10, 4)">
        <Rect
          x="2"
          y="4"
          width="48"
          height="24"
          rx="4"
          stroke={color}
          strokeWidth="2"
          fill="#F8F6F0"
        />
        <Rect
          x="8"
          y="8"
          width="14"
          height="10"
          rx="1.5"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Rect
          x="28"
          y="8"
          width="14"
          height="10"
          rx="1.5"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Circle cx="12" cy="22" r="2" fill={color} />
        <Circle cx="40" cy="22" r="2" fill={color} />
        <Circle cx="14" cy="31" r="3" stroke={color} strokeWidth="1.8" fill="#F8F6F0" />
        <Circle cx="38" cy="31" r="3" stroke={color} strokeWidth="1.8" fill="#F8F6F0" />
        <Path d="M 0 35 H 52" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

// 3. Bus (Facing RIGHT, for SOL → SAĞ travel) with Motion Lines on the left
export function BusGraphic({ size = 50, color = '#183D38' }: GraphicProps) {
  return (
    <Svg width={size * 2.2} height={size * 0.75} viewBox="0 0 120 42" fill="none">
      {/* Motion lines behind bus (on the left side) */}
      <Path
        d="M 5 16 H 52 M 10 24 H 58 M 2 32 H 48"
        stroke="#A7B7AA"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Bus Body (Facing RIGHT: Windshield at x=54, Rear at x=10) */}
      <G transform="translate(56, 4)">
        <Rect
          x="2"
          y="4"
          width="46"
          height="26"
          rx="5"
          stroke={color}
          strokeWidth="2"
          fill="#F8F6F0"
        />
        <Rect
          x="7"
          y="8"
          width="34"
          height="10"
          rx="2"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path d="M 26 8 V 18" stroke={color} strokeWidth="1.2" />
        <Circle cx="7" cy="24" r="2" fill={color} />
        <Circle cx="39" cy="24" r="2" fill={color} />
        <Circle cx="11" cy="33" r="3.5" stroke={color} strokeWidth="1.8" fill="#F8F6F0" />
        <Circle cx="35" cy="33" r="3.5" stroke={color} strokeWidth="1.8" fill="#F8F6F0" />
      </G>
    </Svg>
  );
}

// 4. Bicycle (Facing LEFT, for SAĞ → SOL travel) with Motion Lines on the right
export function BicycleGraphic({ size = 46, color = '#183D38' }: GraphicProps) {
  return (
    <Svg width={size * 2.2} height={size * 0.8} viewBox="0 0 110 40" fill="none">
      {/* Motion lines behind bicycle (on the right side) */}
      <Path
        d="M 60 20 H 105 M 66 28 H 108 M 56 34 H 100"
        stroke="#A7B7AA"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Bicycle Body (Facing LEFT: Handlebars & Front wheel at x=20, Rear at x=46) */}
      <G transform="translate(10, 4)">
        <Circle cx="10" cy="25" r="9" stroke={color} strokeWidth="2" fill="none" />
        <Circle cx="36" cy="25" r="9" stroke={color} strokeWidth="2" fill="none" />
        <Path
          d="M 36 25 L 28 12 L 16 12 L 10 25 M 28 12 L 36 25 M 28 12 L 20 25 H 10 M 17 8 H 12 M 31 9 H 25"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M 32 9 H 26" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
