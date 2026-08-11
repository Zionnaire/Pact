import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../utils/responsive';

interface Blob {
  colors: [string, string];
  /** Size and position as a fraction of screen width/height — scales to any device instead of a fixed phone-width layout. */
  size: number;
  top: number;
  left: number;
}

const WARM: Blob[] = [
  { colors: ['#D4AF3745', '#D4AF3700'], size: 1.08, top: -0.41, left: -0.31 },
  { colors: ['#C3634138', '#C3634100'], size: 0.87, top: 0.62, left: 0.51 },
  { colors: ['#5B1F2420', '#5B1F2400'], size: 0.77, top: 1.64, left: -0.26 },
];

const CEREMONY: Blob[] = [
  { colors: ['#D4AF3760', '#D4AF3700'], size: 1.33, top: -0.51, left: -0.41 },
  { colors: ['#5B1F2480', '#5B1F2400'], size: 1.13, top: 1.08, left: 0.56 },
];

interface AmbientBackgroundProps {
  variant?: 'warm' | 'ceremony';
}

/**
 * Soft blurred gradient "aurora" blobs behind screen content — RN has no
 * CSS blur filter for arbitrary views, so the softness comes from the
 * gradient fading to transparent rather than an actual blur pass. Purely
 * decorative: pointerEvents="none" so it never intercepts touches.
 * Blob geometry is defined as a fraction of screen width so the composition
 * holds together on everything from a small phone to a tablet.
 */
export function AmbientBackground({ variant = 'warm' }: AmbientBackgroundProps) {
  const { width } = useResponsive();
  const blobs = variant === 'warm' ? WARM : CEREMONY;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {blobs.map((blob, index) => {
        const size = blob.size * width;
        return (
          <LinearGradient
            key={index}
            colors={blob.colors}
            style={{
              position: 'absolute',
              top: blob.top * width,
              left: blob.left * width,
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          />
        );
      })}
    </View>
  );
}
