import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { useAuth } from "../Context/authContext";
import { useNavigation } from "@react-navigation/native";
import config from "./config";

const TopMenu = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addManagerVisible, setAddManagerVisible] = useState(false);
  const [viewManagersVisible, setViewManagersVisible] = useState(false);
  const [managerDetails, setManagerDetails] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [managers, setManagers] = useState([]);

  const { logout, auth } = useAuth();
  const navigation = useNavigation();

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Login");
  };

  const handleAddManager = () => {
    setAddManagerVisible(true);
    setModalVisible(false);
  };

  const handleViewManagers = () => {
    fetchManagers();
    setViewManagersVisible(true);
    setModalVisible(false);
  };

  const handleManagerInputChange = (field, value) => {
    setManagerDetails({ ...managerDetails, [field]: value });
  };

  const handleSubmitManager = async () => {
    try {
      const response = await axios.post(`${config.backendUrl}/managers`, {
        name: managerDetails.name,
        email: managerDetails.email,
        password: managerDetails.password,
      });
      console.log(response.data);

      // Reset manager form details
      setAddManagerVisible(false);
      setManagerDetails({ name: "", email: "", password: "" });

      // Send the email with this link
      // Use your existing email sending logic to send the redirect link
    } catch (error) {
      console.error("Error in handleSubmitManager:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  };

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.backendUrl}/club-admin/managers`
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setManagers(response.data);
      } else {
        console.error("Unexpected response format:", response);
        alert("Failed to fetch managers.");
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      alert("An error occurred while fetching the managers.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivation = async (managerId, isActive) => {
    try {
      const response = await axios.put(
        `${config.backendUrl}/managers/${managerId}/activate`,
        { isActive }
      );
      console.log(response.data.message);
      fetchManagers();
    } catch (error) {
      console.error("Error updating manager status:", error);
      alert("An error occurred while updating the manager's status.");
    }
  };

  const handleDeleteManager = async (managerId) => {
    try {
      console.log("Deleting manager with ID:", managerId);
      const response = await axios.delete(
        `${config.backendUrl}/managers/${managerId}`
      );
      console.log(response.data.message);
      fetchManagers();
    } catch (error) {
      console.error("Error deleting manager:", error);
      alert("An error occurred while deleting the manager.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Sportszz</Text>
      <TouchableOpacity style={styles.iconContainer} onPress={toggleModal}>
        <Icon name="user" size={24} color="#fff" />
        <Text style={styles.iconText}>Profile</Text>
      </TouchableOpacity>

      {/* Profile Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Welcome, {auth?.name || "User"}
            </Text>

            <TouchableOpacity
              onPress={handleAddManager}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Add Manager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewManagers}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>View Managers</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleModal} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Update Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleModal}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Manager Modal */}
      <Modal
        transparent={true}
        visible={addManagerVisible}
        animationType="slide"
        onRequestClose={() => setAddManagerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={{ width: "100%" }}>
              <Text style={styles.modalTitle}>Add Manager</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#888"
                value={managerDetails.name}
                onChangeText={(text) => handleManagerInputChange("name", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                value={managerDetails.email}
                onChangeText={(text) => handleManagerInputChange("email", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={true}
                value={managerDetails.password}
                onChangeText={(text) =>
                  handleManagerInputChange("password", text)
                }
              />

              <TouchableOpacity
                onPress={handleSubmitManager}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAddManagerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Managers Modal */}
      <Modal
        transparent={true}
        visible={viewManagersVisible}
        animationType="slide"
        onRequestClose={() => setViewManagersVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={{ width: "100%" }}>
              <Text style={styles.modalTitle}>Managers List</Text>

              {loading ? (
                <ActivityIndicator size="large" color="#4CAF50" />
              ) : managers.length > 0 ? (
                managers.map((manager) => (
                  <View key={manager._id} style={styles.managerContainer}>
                    <Text style={styles.managerText}>Name: {manager.name}</Text>
                    <Text style={styles.managerText}>
                      Email: {manager.email}
                    </Text>
                    <Text style={styles.managerText}>
                      Status: {manager.isActive ? "Active" : "Inactive"}
                    </Text>

                    {/* Activate/Deactivate Button */}
                    <TouchableOpacity
                      onPress={() =>
                        handleToggleActivation(manager._id, !manager.isActive)
                      }
                      style={
                        manager.isActive
                          ? styles.deactivateButton
                          : styles.activateButton
                      } // Use the defined styles
                    >
                      <Text style={styles.buttonText}>
                        {" "}
                        {/* Adjusted to use buttonText for consistent styling */}
                        {manager.isActive ? "Deactivate" : "Activate"}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Manager Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteManager(manager._id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text>No managers found.</Text>
              )}

              <TouchableOpacity
                onPress={() => setViewManagersVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingTop: 15,
  },
  iconContainer: {
    alignItems: "center",
  },
  iconText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    paddingTop: 10,
    paddingRight: 180,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalButton: {
    padding: 10,
    marginVertical: 5,
    width: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 10,
    marginTop: 15,
    width: "100%",
    backgroundColor: "#f44336",
    borderRadius: 5,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  managerContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  managerText: {
    fontSize: 16,
  },
  buttonBase: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 5,
    minWidth: 80,
    maxWidth: 120,
    elevation: 3, // Add shadow on Android
    shadowColor: "#000", // Add shadow on iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow position
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 4, // Shadow blur
  },
  activateButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 5,
    minWidth: 60,
    maxWidth: 100,
    backgroundColor: "#4CAF50", // Green color for activate
  },
  deactivateButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 5,
    minWidth: 60,
    maxWidth: 100,
    backgroundColor: "#f44336", // Red color for deactivate
  },
  buttonText: {
    color: "#fff",
    fontSize: 14, // Keep the font size
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#f44336", // Red color for delete
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 5,
    minWidth: 60,
    maxWidth: 100,
  },
});

export default TopMenu;
