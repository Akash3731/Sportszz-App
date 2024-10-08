import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";

const ManagerDashboard = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out.");
    navigation.navigate("ManagerLogin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#004d00", "#32cd32", "#ffcc00"]}
        style={styles.backgroundGradient}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>Manager Dashboard</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ManageTeams")}
          >
            <Icon name="football-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>Manage Teams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ViewTournament")} // Add navigation to ViewTournament
          >
            <Icon name="trophy-outline" size={40} color="#fff" />
            <Text style={styles.cardText}>View Tournament</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    marginBottom: 40,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  card: {
    width: 150,
    height: 150,
    backgroundColor: "#007f5f", // Turf color
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#f4511e",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 50,
  },
  logoutButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ManagerDashboard;
