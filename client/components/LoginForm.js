/*import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Button, StyleSheet, ScrollView } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import config from "./config";

const LoginForm = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    let validationErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email)) {
      validationErrors.email = "Invalid email address";
    }

    if (formData.password.trim().length === 0) {
      validationErrors.password = "Password is required";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await axios.post(`${config.backendUrl}/login`, formData);
      Toast.show({ type: 'success', text1: response.data.message });
      
      navigation.navigate("Home"); 
    } catch (error) {
      if (error.response) {
        Toast.show({ type: 'error', text1: error.response.data.message });
      } else {
        Toast.show({ type: 'error', text1: "An error occurred during login." });
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Login</Text>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(value) => handleInputChange("email", value)}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, errors.password && styles.inputError]}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => handleInputChange("password", value)}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
          <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Button title="Login" onPress={handleSubmit} />
      <Toast />
      <Text style={styles.linkText}>
        Don't have an account? <Text style={styles.link} onPress={() => navigation.navigate("Register")}>Register</Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff8dc",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputError: {
    borderColor: "red",
  },
  passwordContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingRight: 10,
  },
  eyeIcon: {
    position: "absolute", 
    right: 10, 
    zIndex: 1,
  },
  linkText: {
    textAlign: "center",
    paddingTop: 20,
  },
  link: {
    color: "red",
  },
});

export default LoginForm;*/

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import config from "./config";
import { useAuth } from "../Context/authContext";

const LoginForm = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const validate = () => {
    let validationErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email))
      validationErrors.email = "Invalid email address";
    if (formData.password.trim().length === 0)
      validationErrors.password = "Password is required";

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await axios.post(`${config.backendUrl}/login`, formData);
      Toast.show({ type: "success", text1: response.data.message });

      const userData = { ...response.data.user, token: response.data.token };
      await login(userData);

      navigation.navigate("Home");
    } catch (error) {
      const message = error.response
        ? error.response.data.message
        : "An error occurred during login.";
      Toast.show({ type: "error", text1: message });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Login</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, errors.password && styles.inputError]}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
            <FontAwesome
              name={showPassword ? "eye" : "eye-slash"}
              size={24}
              color="#555"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>
          Don't have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Register")}
          >
            Register
          </Text>
        </Text>

        <Toast />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Ensures that ScrollView expands and centers the form
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  container: {
    width: "90%", // Restricts the width of the form to 90% of the screen width
    maxWidth: 400, // Adds a max-width for larger screens
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Box shadow for the form container
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  input: {
    height: 50,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: "red",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    zIndex: 1,
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#555",
  },
  link: {
    color: "#007bff",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
});

export default LoginForm;
