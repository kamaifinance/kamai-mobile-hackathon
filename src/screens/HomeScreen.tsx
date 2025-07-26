import React, { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ImageBackground, Image } from "react-native";
import { Text, Card } from "react-native-paper";
import { FontFamilies } from "../styles/fonts";
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import MaskedView from '@react-native-masked-view/masked-view';

// Generate realistic portfolio data for the past 30 days
const generatePortfolioData = () => {
  const data = [];
  const currentValue = 12485.92; // Current portfolio value
  const startValue = 10000; // Starting value 30 days ago

  for (let i = 40; i >= 0; i--) {
    // Calculate the base progression from start to current value
    const progressRatio = (30 - i) / 30;
    const baseValue = startValue + (currentValue - startValue) * progressRatio;

    // Add some realistic daily fluctuations
    const randomVariation = (Math.random() - 0.5) * 0.03; // ±1.5% daily variation
    const value = baseValue * (1 + randomVariation);

    data.push({
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
    });
  }

  return data;
};

const portfolioData = generatePortfolioData();

export function HomeScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');

  const SimpleChart = () => (
    <View style={styles.chartContainer}>
      <LineChart
        data={portfolioData}
        height={140}
        width={350}
        spacing={8}
        color="#CD9227"
        thickness={2}
        startFillColor="#CD9227"
        endFillColor="#CD9227"
        startOpacity={0.3}
        endOpacity={0.1}
        initialSpacing={0}
        noOfSections={4}
        animateOnDataChange
        animationDuration={1000}
        onDataChangeAnimationDuration={300}
        areaChart
        hideDataPoints
        hideRules
        hideYAxisText
        hideAxesAndRules
        curved
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Portfolio Title */}
        <MaskedView
          maskElement={
            <Text style={styles.portfolioTitle}>
              Portfolio
            </Text>
          }
        >
          <LinearGradient
            colors={["#B37A35", "#F6D170", "#CD9227", "#B37A35"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1 }} />
          </LinearGradient>
        </MaskedView>

        {/* Total Value Card */}
        <Card style={styles.totalValueCard}>
          <Card.Content style={styles.totalValueContent}>
            <Text style={styles.totalValueLabel}>Total Value</Text>
            <Text style={styles.totalValueAmount}>$12,485.92</Text>
            <View style={styles.apyBadge}>
              <Text style={styles.apyText}>+24.5% APY</Text>
            </View>
            <SimpleChart />
          </Card.Content>
        </Card>

        {/* Time Period Buttons */}
        <View style={styles.periodButtons}>
          {['Daily', 'Monthly', 'Yearly'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Investments Section */}
        <Text style={styles.sectionTitle}>Investments</Text>

        <ScrollView
          style={styles.investmentCards}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.investmentCardsContainer}
        >
          {/* Protected Card */}
          <Card style={[styles.investmentCard, styles.protectedCard]}>
            <ImageBackground
              source={require('../../assets/vault_normal.png')}
              style={styles.cardBackgroundImage}
              resizeMode="cover"
            >
              <Card.Content style={styles.investmentCardContent}>
                <View style={styles.investmentHeader}>
                  <Text style={styles.investmentType}>Protected</Text>
                  <Image
                    source={require('../../assets/shield.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.investmentAmount}>$0.00</Text>
                <View style={styles.cardBottomRow}>
                  <View style={styles.apyCardBadge}>
                    <Text style={styles.apyCardValue}>4.06%</Text>
                  </View>
                  <Text style={styles.apyCardLabel}>APY (30days Avg.)</Text>
                </View>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* Boosted Card */}
          <Card style={[styles.investmentCard, styles.boostedCard]}>
            <ImageBackground
              source={require('../../assets/vault_boosted.png')}
              style={styles.cardBackgroundImage}
              resizeMode="cover"
            >
              <Card.Content style={styles.investmentCardContent}>
                <View style={styles.investmentHeader}>
                  <Text style={styles.investmentType}>Boosted</Text>
                  <Image
                    source={require('../../assets/star.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.investmentAmount}>$0.00</Text>
                <View style={styles.cardBottomRow}>
                  <View style={styles.apyCardBadge}>
                    <Text style={styles.apyCardValue}>4.06%</Text>
                  </View>
                  <Text style={styles.apyCardLabel}>APY (30days Avg.)</Text>
                </View>
              </Card.Content>
            </ImageBackground>
          </Card>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 60, // Increased to account for status bar without top bar
  },
  portfolioTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    marginBottom: 24,
  },
  totalValueCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginBottom: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  totalValueContent: {
    padding: 24,
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalValueAmount: {
    fontSize: 40,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#F4A261',
    marginBottom: 12,
    textAlign: 'center',
  },
  apyText: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  apyBadge: {
    backgroundColor: 'rgba(13, 69, 50, 0.14)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  chartContainer: {
    flex: 1,
    minHeight: 140,
    width: 350,
  },
  chartLine: {
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4A261',
  },
  chartSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#F4A261',
    borderRadius: 1.5,
  },
  periodButtons: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: 'rgba(13, 69, 50, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#0D4532',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  investmentCards: {
    marginBottom: 32,
  },
  investmentCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  investmentCard: {
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    width: 300,
    marginRight: 16,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  cardBackgroundImage: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  protectedCard: {
    backgroundColor: '#2A5A47',
  },
  boostedCard: {
    backgroundColor: '#8B6914',
  },
  premiumCard: {
    backgroundColor: '#4C1D95',
  },
  boostedPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    opacity: 1,
  },
  boostedGradient1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    opacity: 1,
  },
  boostedGradient2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(218, 165, 32, 0.05)',
    borderRadius: 16,
    opacity: 1,
  },
  premiumPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.15)',
    borderRadius: 16,
    opacity: 1,
  },
  investmentCardContent: {
    padding: 20,
    position: 'relative',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  investmentType: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  investmentAmount: {
    fontSize: 28,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#F4A261',
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apyCardBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  apyCardValue: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  apyCardLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
