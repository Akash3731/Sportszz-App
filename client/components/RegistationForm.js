import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import config from "./config";

const roles = ["Player", "Organization", "Club Admin", "Team", "Trainer"];

const RegistrationForm = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowDropdown(false);
  };

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const validate = () => {
    let validationErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobilePattern = /^[0-9]{10}$/;
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$#!%*?&]{8,}$/;

    if (!emailPattern.test(formData.email))
      validationErrors.email = "Invalid email address";
    if (!mobilePattern.test(formData.mobile))
      validationErrors.mobile = "Mobile number must be 10 digits";
    if (!passwordPattern.test(formData.password))
      validationErrors.password =
        "Password must be at least 8 characters long and contain both letters and numbers";
    if (formData.password !== formData.confirmPassword)
      validationErrors.confirmPassword = "Passwords do not match";
    if (!selectedRole) validationErrors.role = "Please select a role";

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await axios.post(`${config.backendUrl}/register`, {
        role: selectedRole,
        ...formData,
      });
      Toast.show({ type: "success", text1: response.data.message });
      setFormData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });
      navigation.navigate("Login");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.response
          ? error.response.data.message
          : "An error occurred during registration.",
      });
    }
  };

  const isMobile = width < 768;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          isMobile ? styles.mobileContainer : styles.desktopContainer,
        ]}
      >
        <Text style={[styles.header, isMobile && styles.mobileHeader]}>
          Register
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={[styles.input, errors.mobile && styles.inputError]}
          placeholder="Enter mobile"
          keyboardType="numeric"
          value={formData.mobile}
          onChangeText={(value) => handleInputChange("mobile", value)}
          maxLength={10}
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
            <FontAwesome
              name={showPassword ? "eye" : "eye-slash"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              errors.confirmPassword && styles.inputError,
            ]}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(value) =>
              handleInputChange("confirmPassword", value)
            }
          />
          <TouchableOpacity
            onPress={toggleShowConfirmPassword}
            style={styles.eyeIcon}
          >
            <FontAwesome
              name={showConfirmPassword ? "eye" : "eye-slash"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Select Role*</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.selectButtonText}>
            {selectedRole ? selectedRole : "Select a role..."}
          </Text>
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdown}>
            {roles.map((role, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleRoleSelect(role)}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>

        <Toast />
        <View style={styles.textWrapper}>
          <Text style={styles.linkText}>Already registered? Please </Text>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              navigation.navigate("Login");
            }}
          >
            <Text style={styles.link}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "center",
  },
  desktopContainer: {
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 40,
  },
  mobileContainer: {
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  mobileHeader: {
    fontSize: 22,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  input: {
    height: 50,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
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
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    padding: 10,
  },
  selectButton: {
    height: 50,
    justifyContent: "center",
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    fontSize: 16,
  },
  dropdown: {
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    position: "absolute",
    top: 290,
    left: 0,
    right: 0,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#555",
  },
  submitButton: {
    backgroundColor: "#007BFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 14,
  },
  textWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
  },
  link: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RegistrationForm;
