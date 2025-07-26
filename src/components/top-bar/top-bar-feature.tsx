import { StyleSheet } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/core";

export function TopBar() {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <Appbar.Header mode="small" style={[styles.topBar, { backgroundColor: '#1B3A32' }]}>
      <Appbar.Action
        icon="cog"
        iconColor="#F4A261"
        onPress={() => {
          navigation.navigate("Settings");
        }}
      />
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  topBar: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
