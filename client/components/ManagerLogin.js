import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import config from "./config";
import axios from "axios"; // Ensure axios is imported

const ManagerLogin = ({ navigation }) => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]); // State for groups

  const fetchGroups = async (managerId) => {
    if (!managerId) {
      console.warn("No manager ID provided");
      return;
    }

    try {
      const response = await axios.get(
        `${config.backendUrl}/managers/${managerId}/groups`
      );
      setGroups(response.data); // Update the groups state
      console.log("Fetched groups:", response.data); // Log fetched groups
    } catch (error) {
      console.error("Error fetching groups:", error);
      Alert.alert("Error", "Failed to fetch groups.");
    }
  };

  const handleLogin = async () => {
    if (emailInput && passwordInput) {
      setLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/manager-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailInput,
            password: passwordInput,
          }),
        });

        const text = await response.text();
        console.log("Raw Response:", text);

        try {
          const data = JSON.parse(text);
          console.log("Parsed Data:", data);

          if (response.ok) {
            Alert.alert("Login Successful", data.message);
            const managerId = data._id;
            await AsyncStorage.setItem("manager-id", managerId);
            console.log("Manager ID stored in AsyncStorage:", managerId);

            // Immediately fetch the groups for this manager
            await fetchGroups(managerId); // Now this should work

            navigation.replace("ManagerDashboard");
            setEmailInput("");
            setPasswordInput("");
          } else {
            Alert.alert(
              "Error",
              data.message || "Login failed. Please try again."
            );
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          Alert.alert("Error", "Failed to parse server response.");
        }
      } catch (error) {
        console.error("Login Error:", error);
        Alert.alert("Error", "An error occurred. Please try again.");
      } finally {
        setLoading(false);
        console.log("Loading state set to false after login.");
      }
    } else {
      Alert.alert("Error", "Please enter both email and password.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={emailInput}
        onChangeText={setEmailInput}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={passwordInput}
        onChangeText={setPasswordInput}
        secureTextEntry={true}
        autoCapitalize="none"
        editable={!loading}
      />

      <Button
        title="Login"
        onPress={handleLogin}
        color="#f4511e"
        disabled={loading}
      />

      {loading && (
        <ActivityIndicator
          size="large"
          color="#f4511e"
          style={styles.loading}
        />
      )}

      <Text style={styles.footerText}>
        Please enter your credentials to continue.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f4511e",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  loading: {
    marginTop: 20,
  },
});

export default ManagerLogin;
