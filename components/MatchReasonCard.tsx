import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MatchReasonCardProps {
  reason: string;
}

// Helper function to parse markdown text into styled text components
const parseMarkdownText = (text: string) => {
  const parts = [];
  let lastIndex = 0;
  
  // Handle bold text
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add any text before the bold part
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    
    // Add the bold text
    parts.push(
      <Text key={`bold-${match.index}`} style={{ fontWeight: '700' }}>
        {match[1]}
      </Text>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Text>
    );
  }
  
  return parts.length > 0 ? (
    <Text>{parts}</Text>
  ) : (
    <Text>{text}</Text>
  );
};

const renderMarkdownSection = (section: string, index: number) => {
  // Skip empty sections
  if (!section.trim()) return null;

  // Split section into lines
  const lines = section.split('\n');
  
  // Check if this is a section with ### title
  if (lines[0].startsWith('###')) {
    const title = lines[0].replace(/^###\s*/, '').trim();
    const content = lines.slice(1);
    
    return (
      <View key={index} style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {content.map((line, i) => {
          if (!line.trim()) return null;

          // Handle bullet points (both • and - are supported)
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            const [bulletPoint, ...description] = line.trim()
              .replace(/^[•-]\s*/, '')
              .split(':');
            return (
              <View key={i} style={styles.bulletPoint}>
                <Text style={styles.bulletPointTitle}>
                  {parseMarkdownText(bulletPoint.trim())}
                </Text>
                {description.length > 0 && (
                  <Text style={styles.bulletPointContent}>
                    {parseMarkdownText(description.join(':').trim())}
                  </Text>
                )}
              </View>
            );
          }
          
          // Handle numbered points
          if (line.trim().match(/^\d+\./)) {
            const [number, ...content] = line.trim().split('.');
            return (
              <View key={i} style={styles.numberedPoint}>
                <Text style={styles.numberCircle}>{number}</Text>
                <Text style={styles.numberedContent}>
                  {parseMarkdownText(content.join('.').trim())}
                </Text>
              </View>
            );
          }

          // Regular line within a section
          return (
            <Text key={i} style={styles.sectionContent}>
              {parseMarkdownText(line.trim())}
            </Text>
          );
        })}
      </View>
    );
  }
  
  // Regular paragraph (not a section)
  return (
    <View key={index} style={styles.paragraphSection}>
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        return (
          <Text key={i} style={styles.paragraphText}>
            {parseMarkdownText(line.trim())}
          </Text>
        );
      })}
    </View>
  );
};

const MatchReasonCard: React.FC<MatchReasonCardProps> = ({ reason }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Why you matched</Text>
      <Text style={styles.subtitle}>Here's what brought your crew together!</Text>
      <View style={styles.reasonBox}>
        {reason.split('\n\n').map((section, index) => 
          renderMarkdownSection(section, index)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 18,
    width: 350,
    minHeight: 160,
    backgroundColor: '#FAFAFA',
    borderRadius: 44,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    color: '#111',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  reasonBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 250,
    minHeight: 60,
  },
  section: {
    marginBottom: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  paragraphSection: {
    marginBottom: 12,
    width: '100%',
  },
  paragraphText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: 'column',
    marginBottom: 8,
    paddingLeft: 16,
  },
  bulletPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  bulletPointContent: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  numberedPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  numberedContent: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});

export default MatchReasonCard; 