import React from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ImageBackground, Linking, Alert, Image } from "react-native";
import { Text } from "react-native";
import { FontFamilies } from "../styles/fonts";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";

// Protocol icon mappings (only PNG files that React Native supports)
const protocolIcons = {
  lombard: require('../../assets/protocol-icons/lombard.png'),
  kamino: require('../../assets/protocol-icons/kamino.png'),
  raydium: require('../../assets/protocol-icons/raydium.jpeg'),
  parcl: require('../../assets/protocol-icons/parcl.png'),
  metawealth: require('../../assets/protocol-icons/metawealth.png'),
  'lulo-lending': require('../../assets/protocol-icons/lulo-lending.png'),
  deficarrot: require('../../assets/protocol-icons/deficarrot.png'),
  'kamino-lending': require('../../assets/protocol-icons/kamino-lending.png'),
  sanctum: require('../../assets/protocol-icons/sanctum.png'),
  satlayer: require('../../assets/protocol-icons/satlayer.png'),
  huma: require('../../assets/protocol-icons/huma.png'),
  stabble: require('../../assets/protocol-icons/stabble.png'),
  orca: require('../../assets/protocol-icons/orca.png'),
  orogold: require('../../assets/protocol-icons/orogold.png'),
  defituna: require('../../assets/protocol-icons/defituna.png'),
  solayer: require('../../assets/protocol-icons/sollayer.jpg'),
  perena: require('../../assets/protocol-icons/perena.png')
} as const;

// Platform data for the explore screen
const exploreData = {
  lsts: [
    {
      id: 'sanctum',
      name: 'Sanctum',
      apy: '14%',
      url: 'https://app.sanctum.so/',
      iconKey: 'sanctum' as keyof typeof protocolIcons,
    },
  ],
  restaking: [
    {
      id: 'satlayer',
      name: 'Satlayer',
      apy: '25%',
      url: 'https://app.satlayer.xyz/vaults/restake',
      iconKey: 'satlayer' as keyof typeof protocolIcons,
    },
    {
      id: 'solayer-restaking',
      name: 'Solayer (sSOL)',
      apy: '7%',
      url: 'https://app.solayer.org/',
      iconKey: 'solayer' as keyof typeof protocolIcons,
    },
    {
      id: 'inshallah',
      name: 'Inshallah (iaSOL)',
      apy: '15%',
      url: 'https://inshallah.fi/borrow/superstake',
      iconKey: 'solayer' as keyof typeof protocolIcons, // Using solayer icon as placeholder
    },
    {
      id: 'lombard',
      name: 'Lombard Finance',
      url: 'https://www.lombard.finance/app/stake/',
      iconKey: 'lombard' as keyof typeof protocolIcons,
    },
  ],
  stablecoins: [
    {
      id: 'solayer-stable',
      name: 'Solayer (sUSD)',
      apy: '4%',
      url: 'https://app.solayer.org/',
      iconKey: 'solayer' as keyof typeof protocolIcons,
    },
    {
      id: 'huma',
      name: 'Huma Finance',
      apy: '14%',
      url: 'https://app.huma.finance/',
      iconKey: 'huma' as keyof typeof protocolIcons,
    },
    {
      id: 'stabble',
      name: 'Stabble',
      apy: '13%',
      url: 'https://app.stabble.org/liquidity-pools/?search=&tag=usd&verified=true&boosted=false&rewarded=false&deposits=false',
      iconKey: 'stabble' as keyof typeof protocolIcons,
    },
    {
      id: 'lulo',
      name: 'Lulo',
      apy: '9.4%',
      url: 'https://app.lulo.fi/insights?address=CEQenwAuKRfXGxzHoGzj76EF5LkmZw9FYLSYwhBL3hwT',
      iconKey: 'lulo-lending' as keyof typeof protocolIcons,
    },
    {
      id: 'kamino',
      name: 'Kamino Finance',
      apy: '4%',
      url: 'https://app.kamino.finance/liquidity?filter=stables&sort=tvl',
      iconKey: 'kamino' as keyof typeof protocolIcons,
    },
    {
      id: 'perena',
      name: 'Perena',
      apy: '4%',
      url: 'https://app.perena.org/',
      iconKey: 'perena' as keyof typeof protocolIcons,
    },
    {
      id: 'orca',
      name: 'Orca',
      apy: '1.4%',
      url: 'https://www.orca.so/pools/ArisQNcbjXPJD7RgPRvysatX3xcfHPTbcTkfD8kDoZ9i',
      iconKey: 'orca' as keyof typeof protocolIcons,
    },
    {
      id: 'raydium',
      name: 'Raydium',
      apy: '3%',
      url: 'https://raydium.io/liquidity-pools/?type=Stables&sort_by=liquidity',
      iconKey: 'raydium' as keyof typeof protocolIcons,
    },
  ],
  btcfi: [
    {
      id: 'stabble-btc',
      name: 'Stabble',
      apy: '4%',
      url: 'https://app.stabble.org/liquidity-pools/?tag=all&verified=true&boosted=false&rewarded=false&deposits=false&search=zbtc',
      iconKey: 'stabble' as keyof typeof protocolIcons,
    },
    {
      id: 'satlayer-btcfi',
      name: 'Satlayer',
      url: 'https://app.satlayer.xyz/vaults/restake',
      iconKey: 'satlayer' as keyof typeof protocolIcons,
    },
    {
      id: 'lombard-btcfi',
      name: 'Lombard Finance',
      url: 'https://www.lombard.finance/app/stake/',
      iconKey: 'lombard' as keyof typeof protocolIcons,
    },
  ],
  rwas: [
    {
      id: 'oro',
      name: 'Oro Gold',
      apy: '3%',
      url: 'https://orogold.app/',
      iconKey: 'orogold' as keyof typeof protocolIcons,
    },
    {
      id: 'parcl',
      name: 'Parcl',
      url: 'https://www.parcl.co/',
      iconKey: 'parcl' as keyof typeof protocolIcons,
    },
    {
      id: 'metawealth',
      name: 'MetaWealth',
      url: 'https://www.metawealth.co/',
      iconKey: 'metawealth' as keyof typeof protocolIcons,
    },
  ],
  lending: [
    {
      id: 'lulo-lending',
      name: 'Lulo',
      apy: '9.4%',
      url: 'https://app.lulo.fi/insights?address=CEQenwAuKRfXGxzHoGzj76EF5LkmZw9FYLSYwhBL3hwT',
      iconKey: 'lulo-lending' as keyof typeof protocolIcons,
    },
    {
      id: 'deficarrot',
      name: 'DeFi Carrot',
      apy: '8%',
      url: 'https://use.deficarrot.com/',
      iconKey: 'deficarrot' as keyof typeof protocolIcons,
    },
    {
      id: 'defituna',
      name: 'DeFi Tuna',
      apy: '8%',
      url: 'https://defituna.com/lending',
      iconKey: 'defituna' as keyof typeof protocolIcons,
    },
    {
      id: 'kamino-lending',
      name: 'Kamino Finance',
      apy: '4%',
      url: 'https://app.kamino.finance/lending',
      iconKey: 'kamino-lending' as keyof typeof protocolIcons,
    },
  ],
};

interface PlatformItemProps {
  name: string;
  icon?: string;
  iconKey?: keyof typeof protocolIcons;
  url: string;
  apy?: string;
}

// Component for each platform item
const PlatformItem: React.FC<PlatformItemProps> = ({ name, icon, iconKey, url, apy }) => {
  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open external link');
    }
  };

  const renderIcon = () => {
    if (iconKey && protocolIcons[iconKey]) {
      return (
        <Image 
          source={protocolIcons[iconKey]} 
          style={styles.platformIconImage}
          resizeMode="contain"
        />
      );
    } else if (icon) {
      return <Text style={styles.platformIcon}>{icon}</Text>;
    }
    return <Text style={styles.platformIcon}>🔗</Text>; // Default fallback
  };

  return (
    <TouchableOpacity style={styles.platformItem} onPress={handlePress}>
      <View style={styles.platformContent}>
        <View style={styles.platformInfo}>
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
          <View style={styles.platformDetails}>
            <Text style={styles.platformName}>{name}</Text>
            {apy && <Text style={styles.platformApy}>{apy} APY</Text>}
          </View>
        </View>
        <MaterialCommunityIcon
          name="chevron-right"
          size={24}
          color="#5A8B7A"
        />
      </View>
    </TouchableOpacity>
  );
};

interface SectionProps {
  title: string;
  items: Array<{
    id: string;
    name: string;
    url: string;
    icon?: string;
    iconKey?: keyof typeof protocolIcons;
    apy?: string;
  }>;
}

// Component for each section (LSTs, Restaking, RWAs)
const Section: React.FC<SectionProps> = ({ title, items }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item) => (
          <PlatformItem
            key={item.id}
            name={item.name}
            icon={item.icon}
            iconKey={item.iconKey}
            url={item.url}
            apy={item.apy}
          />
        ))}
      </View>
    </View>
  );
};

export function ExploreScreen() {
  return (
    <ImageBackground
      source={require("../../assets/kamai_mobile_bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle2}>
            Kamai’s Choice of Solana’s Highest DeFi Yields
          </Text>
          <Text style={styles.headerSubtitle}>  
            Soon, deposited capital into our Vaults will automatically rotate between the highest yielding sources on Solana every month.
          </Text>
        </View>

        {/* LSTs Section */}
        <Section title="LSTs" items={exploreData.lsts} />

        {/* Restaking Section */}
        <Section title="Restaking" items={exploreData.restaking} />

        {/* Stablecoins Section */}
        <Section title="Stablecoins" items={exploreData.stablecoins} />

        {/* BTCFi Section */}
        <Section title="BTCFi" items={exploreData.btcfi} />

        {/* RWAs Section */}
        <Section title="RWAs" items={exploreData.rwas} />

        {/* Lending Section */}
        <Section title="Lending" items={exploreData.lending} />

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#8C8C8C',
    lineHeight: 22,
    opacity: 0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  platformItem: {
    backgroundColor: 'rgba(4, 23, 19, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 69, 50, 0.4)',
    padding: 16,
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(221, 177, 91, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platformIcon: {
    fontSize: 20,
  },
  platformIconImage: {
    width: 24,
    height: 24,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  platformApy: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#DDB15B',
    opacity: 0.9,
  },
  bottomPadding: {
    height: 120, // Extra space for tab bar
  },
});