import { useId } from 'react';
import Svg, { Path, Circle, G, Defs, ClipPath } from 'react-native-svg';

import type { GraphicProps } from '../graphics.types';

// Atlantic-facing globe with soft coastlines and a dotted travel orbit.
export function PastelGlobeSvg({ size = 215, color = '#183D38' }: GraphicProps) {
  const clipId = useId().replace(/:/g, '');

  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx="120" cy="120" r="85" />
        </ClipPath>
      </Defs>

      {/* The rear half of the route disappears behind the globe. */}
      <Path
        d="M 39 102 C 5 106, 8 143, 40 143 M 192 165 C 224 174, 211 188, 190 180"
        stroke="#829B94"
        strokeWidth="1.2"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />
      <Path
        d="M 27 153 C 7 137, 28 117, 52 113 M 212 91 C 224 77, 202 62, 185 71"
        stroke="#829B94"
        strokeWidth="0.9"
        strokeDasharray="3.2 6.5"
        strokeLinecap="round"
        opacity={0.75}
        fill="none"
      />
      <Circle cx="120" cy="120" r="85" fill="#F8F6F0" />

      <G clipPath={'url(#' + clipId + ')'}>
        <G transform="translate(35, 35) scale(0.4569892473)" fill="#C9D1C6">
          {/* North America and the Canadian Arctic archipelago. */}
          <Path d="M 21 127 L 27 115 31 99 40 87 46 81 51 69 61 62 67 62 73 52 80 52 83 44 92 41 98 42 103 35 113 36 114 43 106 48 104 56 111 58 116 54 123 57 128 65 123 70 117 66 112 71 104 70 100 77 104 81 110 78 116 83 126 81 128 91 122 95 127 101 121 105 111 102 109 108 99 107 95 116 86 119 84 126 77 130 72 135 65 140 61 149 53 152 49 160 45 164 45 172 49 178 48 185 42 183 37 174 33 168 28 155 27 144 24 140 24 154 27 166 33 176 34 183 28 180 23 170 20 151 Z" />
          <Path d="M 61 47 L 69 40 78 36 84 37 79 43 73 46 70 53 64 56 59 54 Z M 82 34 L 90 28 99 26 104 28 98 33 92 34 88 40 82 42 Z M 95 43 L 103 38 110 40 107 45 100 48 96 52 91 51 Z M 109 29 L 118 24 128 23 127 27 119 30 116 35 110 36 Z M 120 39 L 129 35 135 39 131 45 126 45 125 49 119 48 Z M 133 25 L 145 21 157 22 149 27 137 30 130 32 Z" />
          <Path d="M 129 38 C 140 29, 156 22, 174 21 L 190 23 200 21 209 26 202 30 203 37 198 44 198 51 192 58 181 63 174 70 167 73 162 80 155 77 150 71 149 60 153 50 148 44 139 44 Z" />
          {/* Central America and Caribbean islands. */}
          <Path d="M 43 179 L 49 181 52 188 57 190 60 198 68 202 72 209 78 211 78 216 71 215 65 207 58 207 55 200 50 198 46 190 Z M 65 181 Q 75 178 83 184 L 81 187 71 185 Z M 84 188 L 92 187 97 190 94 192 Z M 61 191 L 67 192 68 195 62 195 Z" />
          {/* South America: broad northern coast, tapering Andes and Patagonia. */}
          <Path d="M 77 205 L 85 199 95 201 101 207 111 209 116 216 125 219 129 226 140 230 148 238 157 242 151 249 153 256 148 265 143 269 142 279 137 286 129 289 126 298 122 306 114 312 110 324 106 332 110 341 119 348 111 347 103 342 99 334 95 326 92 315 87 307 85 296 80 287 80 278 75 270 69 262 65 252 63 244 60 235 63 225 70 218 72 211 Z" />
          {/* Iceland, British Isles and Scandinavia. */}
          <Path d="M 194 66 Q 202 61 209 66 L 207 71 199 72 193 69 Z M 225 88 L 228 86 232 92 230 99 235 103 232 109 225 109 222 113 218 111 222 105 220 101 224 98 Z M 216 104 L 219 109 217 115 212 116 213 109 Z M 244 84 L 246 76 254 68 259 60 267 55 275 56 279 62 271 65 266 74 260 79 260 88 256 94 251 92 252 83 248 86 Z M 268 83 L 272 73 279 68 283 71 280 82 283 89 278 94 273 92 Z" />
          {/* Europe joins the land at the eastern horizon. */}
          <Path d="M 225 127 L 228 118 237 117 242 110 250 108 256 102 263 103 269 98 278 100 283 92 289 90 292 81 299 79 303 74 310 74 314 67 320 67 324 62 336 66 340 78 349 80 357 91 365 96 379 99 387 116 387 151 378 166 376 185 366 196 362 186 358 177 350 175 344 165 338 168 333 163 330 172 324 174 321 165 315 158 310 151 303 145 297 143 293 135 286 135 287 141 296 145 294 150 285 149 277 143 271 143 266 137 261 135 258 131 254 132 255 140 261 145 263 154 259 155 254 149 250 147 247 138 241 135 237 142 228 144 219 149 217 143 219 136 225 134 Z" />
          {/* Africa and Madagascar. */}
          <Path d="M 237 150 L 248 150 256 157 263 158 269 166 278 167 285 172 292 172 295 181 300 188 305 199 309 209 316 207 327 200 322 215 315 225 307 233 305 245 299 256 295 267 289 275 286 289 279 300 269 309 260 309 256 298 256 288 251 279 253 271 250 261 245 253 242 242 235 234 235 228 226 229 215 226 204 221 199 212 197 204 201 195 201 185 206 176 214 168 221 160 230 158 Z M 312 264 L 317 257 316 270 310 283 305 288 306 277 Z" />
        </G>
      </G>

      <Circle cx="120" cy="120" r="85" stroke={color} strokeWidth="1.5" />
      {/* Front orbit remains visible across the globe and around its edge. */}
      <Path
        d="M 40 143 C 87 137, 111 153, 151 172 C 177 184, 204 185, 213 171"
        stroke="#829B94"
        strokeWidth="1.2"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />

      {/* A shallow, flowing diagonal route, with the return arc behind the globe. */}
      <Path
        d="M 27 153 C 51 177, 82 151, 117 131 S 184 119, 212 91"
        stroke="#829B94"
        strokeWidth="0.9"
        strokeDasharray="3.2 6.5"
        strokeLinecap="round"
        opacity={0.75}
        fill="none"
      />

      {/* Location markers over North America and Europe. */}
      <G transform="translate(60, 110)">
        <Path d="M 0 0 C -2 -4, -6 -9, -6 -13 A 6 6 0 1 1 6 -13 C 6 -9, 2 -4, 0 0 Z" fill={color} />
        <Circle cx="0" cy="-13" r="2.4" fill="#F8F6F0" />
      </G>
      <G transform="translate(168, 95)">
        <Path d="M 0 0 C -2 -4, -6 -9, -6 -13 A 6 6 0 1 1 6 -13 C 6 -9, 2 -4, 0 0 Z" fill={color} />
        <Circle cx="0" cy="-13" r="2.4" fill="#F8F6F0" />
      </G>
    </Svg>
  );
}

// 2. Soft Background Clouds
export function PastelCloudSvg({
  width = 110,
  height = 40,
  opacity = 0.7,
}: {
  width?: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 40" fill="none" opacity={opacity}>
      <Path
        d="M 10 30 Q 10 18 22 18 Q 28 8 42 12 Q 52 4 68 10 Q 82 10 85 22 Q 95 24 92 32 Q 90 38 78 38 L 18 38 Q 8 38 10 30 Z"
        fill="#E8E4DC"
      />
    </Svg>
  );
}

// 3. Small Birds Silhouette
export function PastelBirdsSvg({ size = 30, color = '#183D38' }: GraphicProps) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 40 24" fill="none" opacity={0.6}>
      <Path
        d="M 4 12 Q 10 4 16 12 Q 22 4 28 12"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <Path
        d="M 22 18 Q 26 12 30 18 Q 34 12 38 18"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}
