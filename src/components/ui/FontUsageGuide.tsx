import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Typography } from '../../styles/typography';
import { FontFamilies } from '../../styles/fonts';

export function FontUsageGuide() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        
        {/* Typography System Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography System Usage</Text>
          <Text style={styles.code}>import {`{ Typography }`} from '../styles/typography';</Text>
          
          <Text style={Typography.h1}>H1 Header Style</Text>
          <Text style={styles.code}>style={`{Typography.h1}`}</Text>
          
          <Text style={Typography.h2}>H2 Header Style</Text>
          <Text style={styles.code}>style={`{Typography.h2}`}</Text>
          
          <Text style={Typography.bodyLarge}>Body Large - Perfect for main content</Text>
          <Text style={styles.code}>style={`{Typography.bodyLarge}`}</Text>
          
          <Text style={Typography.body}>Body - Regular content text</Text>
          <Text style={styles.code}>style={`{Typography.body}`}</Text>
          
          <Text style={Typography.caption}>Caption - Small descriptive text</Text>
          <Text style={styles.code}>style={`{Typography.caption}`}</Text>
          
          <Text style={Typography.brand}>Brand - Using Saleha font</Text>
          <Text style={styles.code}>style={`{Typography.brand}`}</Text>
        </View>

        {/* Direct Font Family Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direct Font Family Usage</Text>
          <Text style={styles.code}>import {`{ FontFamilies }`} from '../styles/fonts';</Text>
          
          <Text style={[styles.example, { fontFamily: FontFamilies.Larken.Bold }]}>
            Bold: Using FontFamilies.Larken.Bold
          </Text>
          
          <Text style={[styles.example, { fontFamily: FontFamilies.Larken.Medium }]}>
            Medium: Using FontFamilies.Larken.Medium
          </Text>
          
          <Text style={[styles.example, { fontFamily: FontFamilies.Larken.Regular }]}>
            Regular: Using FontFamilies.Larken.Regular
          </Text>
          
          <Text style={[styles.example, { fontFamily: FontFamilies.Saleha }]}>
            Saleha: Using FontFamilies.Saleha
          </Text>
        </View>

        {/* Best Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Practices</Text>
          
          <Text style={[Typography.bodyLarge, styles.practiceTitle]}>
            1. Use Typography System
          </Text>
          <Text style={Typography.body}>
            Always prefer Typography.h1, Typography.body, etc. over direct font families for consistency.
          </Text>
          
          <Text style={[Typography.bodyLarge, styles.practiceTitle]}>
            2. Performance Optimization
          </Text>
          <Text style={Typography.body}>
            Fonts are embedded at build time using expo-font config plugin for optimal performance.
          </Text>
          
          <Text style={[Typography.bodyLarge, styles.practiceTitle]}>
            3. Fallback Strategy
          </Text>
          <Text style={Typography.body}>
            The app uses useFonts hook as fallback for development, while production uses embedded fonts.
          </Text>
        </View>

        {/* Code Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Code Example</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{`import { Typography } from '../styles/typography';

function MyComponent() {
  return (
    <View>
      <Text style={Typography.h1}>
        Title
      </Text>
      <Text style={Typography.body}>
        Content goes here
      </Text>
    </View>
  );
}`}</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: 16,
    color: '#2c3e50',
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 12,
    backgroundColor: '#f1f2f6',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
    color: '#2c3e50',
  },
  example: {
    fontSize: 16,
    marginVertical: 4,
    color: '#2c3e50',
  },
  practiceTitle: {
    marginTop: 12,
    marginBottom: 4,
    color: '#3498db',
  },
  codeBlock: {
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#ecf0f1',
    lineHeight: 18,
  },
});

export default FontUsageGuide; 