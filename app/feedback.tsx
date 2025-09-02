import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ArrowLeft, MessageSquare, Check, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

interface FeedbackOption {
  id: string;
  label: string;
  checked: boolean;
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [feedbackOptions, setFeedbackOptions] = useState<FeedbackOption[]>([
    { id: 'bug', label: 'Report a Bug', checked: false },
    { id: 'feature', label: 'Feature Request', checked: false },
    { id: 'improvement', label: 'Improvement Suggestion', checked: false },
    { id: 'other', label: 'Other', checked: false },
  ]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleOption = (id: string) => {
    setFeedbackOptions(prev => 
      prev.map(option => 
        option.id === id 
          ? { ...option, checked: !option.checked }
          : option
      )
    );
  };

  const handleSubmit = () => {
    const selectedOptions = feedbackOptions.filter(option => option.checked);
    
    if (selectedOptions.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one feedback type.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a description of your feedback.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thank You!', 
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/menu')
          }
        ]
      );
    }, 1500);
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/menu')}
        >
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <MessageSquare size={48} color={PRIMARY_COLOR} />
        </View>

        <Text style={styles.title}>Help Us Improve</Text>
        <Text style={styles.subtitle}>
          Your feedback helps us make Notes V better. Please select the type of feedback and provide details below.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback Type</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply:</Text>
          
          {feedbackOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionContainer}
              onPress={() => toggleOption(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.checkbox,
                  option.checked && styles.checkboxChecked
                ]}>
                  {option.checked && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionSubtitle}>Please provide details about your feedback:</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Describe your feedback here..."
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Send size={20} color="#fff" style={styles.submitIcon} />
          <Text style={styles.submitText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#000' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    iconContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 22,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginBottom: 16,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb',
      borderRadius: 12,
      marginBottom: 8,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme === 'dark' ? '#444' : '#d1d5db',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: PRIMARY_COLOR,
      borderColor: PRIMARY_COLOR,
    },
    optionLabel: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      fontWeight: '500',
    },
    textInput: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#333' : '#e5e7eb',
      minHeight: 120,
    },
    submitButton: {
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitIcon: {
      marginRight: 8,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
} 