import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, ImageBackground } from "react-native";
import { Card } from "react-native-paper";
import { FontFamilies } from "../styles/fonts";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuthorization } from '../utils/useAuthorization';

interface RewardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'coming-soon' | 'available' | 'completed';
  points?: number;
  progress?: number;
  maxProgress?: number;
}

const rewardsData: RewardItem[] = [
  {
    id: 'early-adopter',
    title: 'Early Adopter',
    description: 'Connected wallet during early access phase',
    icon: 'star',
    status: 'available',
    points: 200
  },
  {
    id: 'refer-friend',
    title: 'Refer a Friend',
    description: 'Invite friends to join Kamai and earn rewards together',
    icon: 'account-multiple-plus',
    status: 'coming-soon',
    points: 500
  },
  {
    id: 'hold-90-days',
    title: 'Hold for 90 Days',
    description: 'Keep your tokens in vaults for 90 days to earn boosted APY',
    icon: 'calendar-clock',
    status: 'coming-soon',
    points: 1000,
    progress: 0,
    maxProgress: 90
  },
  {
    id: 'weekly-active',
    title: 'Weekly Active User',
    description: 'Use the app for 7 consecutive days',
    icon: 'calendar-week',
    status: 'coming-soon',
    points: 100
  },
  {
    id: 'vault-master',
    title: 'Vault Master',
    description: 'Deposit in all available vaults',
    icon: 'trophy',
    status: 'coming-soon',
    points: 750
  },
  {
    id: 'social-share',
    title: 'Social Share',
    description: 'Share your portfolio on social media',
    icon: 'share-variant',
    status: 'coming-soon',
    points: 150
  }
];

export function RewardsScreen() {
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const { selectedAccount } = useAuthorization();
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState(0);

  // Calculate total points and earned rewards
  useEffect(() => {
    let points = 0;
    let earned = 0;
    
    rewardsData.forEach(reward => {
      if (reward.status === 'completed') {
        points += reward.points || 0;
        earned += 1;
      } else if (reward.status === 'available' && reward.id === 'early-adopter' && selectedAccount) {
        points += reward.points || 0;
        earned += 1;
      }
    });
    
    setTotalPoints(points);
    setEarnedRewards(earned);
  }, [selectedAccount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#DDB15B';
      case 'completed':
        return '#4CAF50';
      case 'coming-soon':
      default:
        return '#DDB15B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'completed':
        return 'Completed';
      case 'coming-soon':
      default:
        return 'Coming Soon';
    }
  };

  const getProgressColor = (progress: number, maxProgress: number) => {
    const percentage = progress / maxProgress;
    if (percentage >= 0.8) return '#4CAF50';
    if (percentage >= 0.5) return '#FF9800';
    return '#2196F3';
  };

  const RewardCard = ({ reward }: { reward: RewardItem }) => {
    // Check if this is the early adopter reward and user has connected wallet
    const isEarlyAdopterEarned = reward.id === 'early-adopter' && selectedAccount;
    
    return (
      <Card style={styles.rewardCard}>
        <View style={styles.rewardContent}>
          <View style={styles.rewardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcon
                name={reward.icon as any}
                size={24}
                color="#DDB15B"
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
              {reward.progress !== undefined && reward.maxProgress && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${(reward.progress / reward.maxProgress) * 100}%`,
                          backgroundColor: getProgressColor(reward.progress, reward.maxProgress)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {reward.progress}/{reward.maxProgress} days
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.rewardPoints}>
              <Text style={styles.pointsText}>{reward.points}</Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(isEarlyAdopterEarned ? 'completed' : reward.status) }
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(isEarlyAdopterEarned ? 'completed' : reward.status)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/kamai_mobile_bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rewards</Text>
            <Text style={styles.headerSubtitle2}>Earn points and unlock exclusive rewards</Text>
          </View>

          {/* Stats Card */}
          <Card style={styles.statsCard}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{earnedRewards}</Text>
                <Text style={styles.statLabel}>Rewards Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{rewardsData.length}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
          </Card>

          {/* Rewards List */}
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            {rewardsData.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    color: '#DDB15B',
    marginBottom: 12,
  },
  headerSubtitle2: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#8C8C8C',
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#8C8C8C',
    lineHeight: 22,
    opacity: 0.6,
  },
  statsCard: {
    backgroundColor: 'rgba(4, 23, 19, 0.8)',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(13, 69, 50, 0.4)',
  },
  statsContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
  },
  statLabel: {
    fontSize: 12,
    color: '#8C8C8C',
    marginTop: 4,
    fontFamily: FontFamilies.Geist.Regular,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(13, 69, 50, 0.4)',
  },
  rewardsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 16,
  },
  rewardCard: {
    backgroundColor: 'rgba(4, 23, 19, 0.8)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 69, 50, 0.4)',
  },
  rewardContent: {
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(221, 177, 91, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 10,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#8C8C8C',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(13, 69, 50, 0.4)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8C8C8C',
    fontFamily: FontFamilies.Geist.Regular,
  },
  rewardPoints: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#8C8C8C',
    fontFamily: FontFamilies.Geist.Regular,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#000000',
  },
  comingSoonCard: {
    backgroundColor: 'rgba(4, 23, 19, 0.8)',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 177, 91, 0.3)',
  },
  comingSoonContent: {
    padding: 20,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FontFamilies.Geist.Regular,
  },
}); 