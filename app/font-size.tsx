import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';

const FONT_SIZE_PREVIEW = {
  small: { h1: 24, h2: 20, body: 16 },
  medium: { h1: 32, h2: 24, body: 20 },
  large: { h1: 40, h2: 32, body: 24 },
};

const FONT_SIZE_LABELS = ['small', 'medium', 'large'];

export default function FontSizeScreen() {
  const { theme, textSize, setTextSize } = useTheme();
  const router = useRouter();
  const preview = FONT_SIZE_PREVIEW[textSize];
  const bgColor = theme === 'dark' ? '#18181b' : '#fff';
  const textColor = theme === 'dark' ? '#fff' : '#222';

  // Map textSize to slider value
  const sliderValue = FONT_SIZE_LABELS.indexOf(textSize);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/menu')}>
          <ArrowLeft size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Font size</Text>
      </View>
      <View style={styles.previewSection}>
        <Text style={[styles.h1, { fontSize: preview.h1, color: textColor }]}>Heading 1</Text>
        <Text style={[styles.h2, { fontSize: preview.h2, color: textColor }]}>Heading 2</Text>
        <Text style={[styles.body, { fontSize: preview.body, color: textColor }]}>Notepad is an awesome note app for Android. It offers two note-taking modes, text mode and checklist mode, to fully meet your needs. Features like sticky note widgets, note reminders, and note lock make note-taking simple, quick, and secure. Notes are automatically saved as you type, so you can take notes just like using pen and paper.</Text>
      </View>
      <View style={styles.sliderSection}>
        <Text style={[styles.sliderA, { color: textColor }]}>A</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={2}
          step={1}
          value={sliderValue}
          onValueChange={val => setTextSize(FONT_SIZE_LABELS[val])}
          minimumTrackTintColor="#3b82f6"
          maximumTrackTintColor={theme === 'dark' ? '#333' : '#ccc'}
          thumbTintColor="#3b82f6"
        />
        <Text style={[styles.sliderA, { color: textColor, fontSize: 24 }]}>A</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  previewSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  h1: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  h2: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  body: {
    marginBottom: 32,
    lineHeight: 32,
  },
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 16,
  },
  sliderA: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 