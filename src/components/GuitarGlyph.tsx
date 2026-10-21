import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import GuitarArtwork from '../../assets/illustrations/acoustic-guitar.svg';

export type StringStatus = 'in-tune' | 'out' | 'unknown';

export interface GuitarStringState {
  stringNumber: number;
  status: StringStatus;
}

interface GuitarGlyphProps {
  strings: GuitarStringState[];
}

const WIDTH = 300;
const HEIGHT = 214;
const FULL_ARTWORK_HEIGHT = 760;
const ARTWORK_VIEWBOX = `0 0 ${WIDTH} ${HEIGHT}`;

const STATUS_COLORS: Record<StringStatus, string> = {
  'in-tune': '#22C55E',
  out: '#EF4444',
  unknown: '#94A3B8',
};

// Exact paths from the source SVG: each joins its real tuning post to the neck.
const STRING_PATHS = [
  'M 150 36 L 171 150 M 171 150 L 171 214',
  'M 150 69 L 164 150 M 164 150 L 164 214',
  'M 150 102 L 157 150 M 157 150 L 157 214',
  'M 203 36 L 180 150 M 180 150 L 180 214',
  'M 203 69 L 189 150 M 189 150 L 189 214',
  'M 203 102 L 196 150 M 196 150 L 196 214',
];

/**
 * CC0 source: Wikimedia Commons, "Acoustic guitar.svg" by narrowhouse.
 * Its original static strings are disabled in the SVG; tuning state is rendered below.
 */
export default function GuitarGlyph({ strings }: GuitarGlyphProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel="Guitar tuning status">
      <View style={styles.artworkCrop}>
        <GuitarArtwork width={WIDTH} height={FULL_ARTWORK_HEIGHT} />
      </View>

      <Svg
        pointerEvents="none"
        style={styles.stringLayer}
        width={WIDTH}
        height={HEIGHT}
        viewBox={ARTWORK_VIEWBOX}
      >
        {strings.map((string, index) => {
          const path = STRING_PATHS[index];
          if (!path) return null;

          return (
            <Path
              key={string.stringNumber}
              d={path}
              stroke={STATUS_COLORS[string.status]}
              strokeWidth={index < 2 ? 1.9 : 1.25}
              strokeLinecap="butt"
              fill="none"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    overflow: 'hidden',
  },
  artworkCrop: {
    width: WIDTH,
    height: HEIGHT,
    overflow: 'hidden',
  },
  stringLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
