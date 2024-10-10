import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import axios from "axios";
import config from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ManageTeams = () => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [updateGroupName, setUpdateGroupName] = useState("");
  const [updateTeamName, setUpdateTeamName] = useState("");
  const [updatePlayerName, setUpdatePlayerName] = useState("");
  const [updatePlayerPosition, setUpdatePlayerPosition] = useState(null);
  const [playerNames, setPlayerNames] = useState({});
  const [teamNames, setTeamNames] = useState({});
  const [positions, setPositions] = useState({});
  const [managerId, setManagerId] = useState(null);

  const fetchManagerId = async () => {
    try {
      setLoading(true);
      console.log("Fetching manager ID...");

      // Get the manager ID from local storage or state
      const managerId = await AsyncStorage.getItem("manager-id"); // Assuming you're storing manager ID in AsyncStorage
      console.log("Retrieved manager ID from AsyncStorage:", managerId);

      // If managerId is not found, handle accordingly
      if (!managerId) {
        Alert.alert("Error", "No manager logged in. Please log in again.");
        console.warn("No manager ID found, user not logged in.");
        return;
      }

      // Make a GET request to fetch the current manager using the new endpoint
      console.log("Making request to fetch manager data...");
      const response = await axios.get(`${config.backendUrl}/managers/me`, {
        headers: {
          "manager-id": managerId, // Pass the manager ID in the headers
        },
      });
      console.log("Response received from server:", response.data);

      const fetchedManagerId = response.data._id;
      console.log("Fetched manager ID:", fetchedManagerId);

      setManagerId(fetchedManagerId);
      await fetchGroups(fetchedManagerId);
    } catch (error) {
      console.error("Error fetching manager ID:", error);
      Alert.alert("Error", "Failed to fetch manager ID");
    } finally {
      setLoading(false);
      console.log("Loading state set to false.");
    }
  };

  const fetchGroups = async (mgrId) => {
    if (!mgrId) {
      console.warn("No manager ID available");
      return;
    }

    try {
      const response = await axios.get(
        `${config.backendUrl}/managers/${mgrId}/groups`
      );
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      Alert.alert("Error", "Failed to fetch groups");
    }
  };

  useEffect(() => {
    fetchManagerId();
  }, []);

  const addGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      const response = await axios.post(
        `${config.backendUrl}/managers/${managerId}/groups`,
        { name: groupName.trim() }
      );
      setGroups((prevGroups) => [...prevGroups, response.data]);
      setGroupName("");
      Alert.alert("Success", "Group added successfully");
    } catch (error) {
      console.error("Error adding group:", error);
      Alert.alert("Error", "Failed to add group");
    }
  };

  const updateGroup = async () => {
    if (!updateGroupName.trim()) {
      Alert.alert("Error", "Please enter a new group name");
      return;
    }

    try {
      const response = await axios.put(
        `${config.backendUrl}/managers/${managerId}/groups/${editingGroup._id}`,
        { name: updateGroupName.trim() }
      );
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === editingGroup._id ? response.data : group
        )
      );
      setUpdateGroupName("");
      Alert.alert("Success", "Group updated successfully");
      closeModal(); // Close modal if you're using one
    } catch (error) {
      console.error("Error updating group:", error);
      Alert.alert("Error", "Failed to update group");
    }
  };

  const deleteGroup = async (groupId) => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(
                `${config.backendUrl}/managers/${managerId}/groups/${groupId}`
              );
              setGroups((prevGroups) =>
                prevGroups.filter((group) => group._id !== groupId)
              );
              Alert.alert("Success", "Group deleted successfully");
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const addTeam = async (groupId) => {
    const teamName = teamNames[groupId]; // Get the team name for the specific group
    const group = groups.find((g) => g._id === groupId);

    // Check if maximum teams are reached
    if (group.teams.length >= 4) {
      Alert.alert(
        "Limit Reached",
        "Cannot add more teams. A maximum of 4 teams are allowed."
      );
      return;
    }

    if (!teamName || !teamName.trim()) {
      Alert.alert("Error", "Please enter a team name");
      return;
    }

    try {
      const response = await axios.post(
        `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams`,
        { name: teamName.trim() }
      );

      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === groupId
            ? { ...group, teams: [...group.teams, response.data] }
            : group
        )
      );

      setTeamNames((prev) => ({ ...prev, [groupId]: "" }));
      Alert.alert("Success", "Team added successfully");
    } catch (error) {
      console.error("Error adding team:", error);
      Alert.alert("Error", "Failed to add team");
    }
  };

  const updateTeam = async () => {
    if (!updateTeamName.trim()) {
      Alert.alert("Error", "Please enter a new team name");
      return;
    }

    if (!editingGroup || !editingTeam) {
      Alert.alert("Error", "Invalid team or group selected for update.");
      return;
    }

    try {
      const response = await axios.put(
        `${config.backendUrl}/managers/${managerId}/groups/${editingGroup._id}/teams/${editingTeam._id}`,
        { name: updateTeamName.trim() }
      );
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === editingGroup._id
            ? {
                ...group,
                teams: group.teams.map((team) =>
                  team._id === editingTeam._id ? response.data : team
                ),
              }
            : group
        )
      );
      setUpdateTeamName("");
      Alert.alert("Success", "Team updated successfully");
      closeModal();
    } catch (error) {
      console.error("Error updating team:", error);
      Alert.alert("Error", "Failed to update team");
    }
  };

  const deleteTeam = async (groupId, teamId) => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(
                `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams/${teamId}`
              );
              setGroups((prevGroups) =>
                prevGroups.map((group) =>
                  group._id === groupId
                    ? {
                        ...group,
                        teams: group.teams.filter(
                          (team) => team._id !== teamId
                        ),
                      }
                    : group
                )
              );
              Alert.alert("Success", "Team deleted successfully");
            } catch (error) {
              console.error("Error deleting team:", error);
              Alert.alert("Error", "Failed to delete team");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const addPlayer = async (groupId, teamId) => {
    const playerName = playerNames[teamId]; // Get the player name for the specific team
    const position = positions[teamId]; // Get the position for the specific team

    // Validate input
    if (!playerName.trim() || !position) {
      Alert.alert("Error", "Please enter player name and select position");
      return;
    }

    // Check total players and team player limits
    const team = groups
      .find((group) => group._id === groupId)
      .teams.find((team) => team._id === teamId);
    if (totalPlayers >= 64) {
      Alert.alert(
        "Limit Reached",
        "Cannot add more players. The tournament allows a maximum of 64 players."
      );
      return;
    }
    if (team.players.length >= 4) {
      Alert.alert("Limit Reached", "This team already has 4 players.");
      return;
    }

    try {
      const response = await axios.post(
        `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams/${teamId}/players`,
        { name: playerName.trim(), position }
      );

      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === groupId
            ? {
                ...group,
                teams: group.teams.map((team) =>
                  team._id === teamId
                    ? { ...team, players: [...team.players, response.data] }
                    : team
                ),
              }
            : group
        )
      );
      setPlayerNames((prev) => ({ ...prev, [teamId]: "" })); // Clear input after adding
      setPositions((prev) => ({ ...prev, [teamId]: null })); // Reset position after adding
      setTotalPlayers((prev) => prev + 1); // Increment total players count
      Alert.alert("Success", "Player added successfully");
    } catch (error) {
      console.error("Error adding player:", error);
      Alert.alert("Error", "Failed to add player");
    }
  };

  const updatePlayer = async () => {
    if (!updatePlayerName.trim() || !updatePlayerPosition) {
      Alert.alert("Error", "Please enter player name and select position");
      return;
    }

    if (!editingGroup || !editingTeam || !editingPlayer) {
      Alert.alert(
        "Error",
        "Invalid player, team, or group selected for update."
      );
      return;
    }

    try {
      const response = await axios.put(
        `${config.backendUrl}/managers/${managerId}/groups/${editingGroup._id}/teams/${editingTeam._id}/players/${editingPlayer._id}`,
        { name: updatePlayerName.trim(), position: updatePlayerPosition }
      );
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === editingGroup._id
            ? {
                ...group,
                teams: group.teams.map((team) =>
                  team._id === editingTeam._id
                    ? {
                        ...team,
                        players: team.players.map((player) =>
                          player._id === editingPlayer._id
                            ? response.data
                            : player
                        ),
                      }
                    : team
                ),
              }
            : group
        )
      );
      setUpdatePlayerName("");
      setUpdatePlayerPosition(null);
      Alert.alert("Success", "Player updated successfully");
      closeModal();
    } catch (error) {
      console.error("Error updating player:", error);
      Alert.alert("Error", "Failed to update player");
    }
  };

  const deletePlayer = async (groupId, teamId, playerId) => {
    Alert.alert(
      "Delete Player",
      "Are you sure you want to delete this player?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(
                `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams/${teamId}/players/${playerId}`
              );
              setGroups((prevGroups) =>
                prevGroups.map((group) =>
                  group._id === groupId
                    ? {
                        ...group,
                        teams: group.teams.map((team) =>
                          team._id === teamId
                            ? {
                                ...team,
                                players: team.players.filter(
                                  (player) => player._id !== playerId
                                ),
                              }
                            : team
                        ),
                      }
                    : group
                )
              );
              Alert.alert("Success", "Player deleted successfully");
            } catch (error) {
              console.error("Error deleting player:", error);
              Alert.alert("Error", "Failed to delete player");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const openModal = (type, group, team, player) => {
    setModalType(type);
    setEditingGroup(group);
    setEditingTeam(team);
    setEditingPlayer(player);

    if (type === "editGroup") {
      setUpdateGroupName(group.name);
    } else if (type === "editTeam") {
      setUpdateTeamName(team.name);
    } else if (type === "editPlayer") {
      setUpdatePlayerName(player.name);
      setUpdatePlayerPosition(player.position);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingGroup(null);
    setEditingTeam(null);
    setEditingPlayer(null);
    setUpdateGroupName("");
    setUpdateTeamName("");
    setUpdatePlayerName("");
    setUpdatePlayerPosition(null);
  };

  const CustomButton = ({ title, onPress, color = "#007AFF" }) => (
    <TouchableOpacity
      style={[customButtonStyles.button, { backgroundColor: color }]} // Ensure this is applied correctly
      onPress={onPress}
    >
      <Text style={customButtonStyles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  const customButtonStyles = StyleSheet.create({
    button: {
      width: 80, // Set a fixed width for testing
      height: 28,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 2,
      paddingHorizontal: 4,
      backgroundColor: colors.blue,
      marginHorizontal: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    buttonText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "600",
      textAlign: "center",
    },
  });

  const renderPlayer = ({ item: player, groupId, teamId }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>
      </View>
      <View style={styles.playerActions}>
        <CustomButton
          title="Edit"
          onPress={() => {
            const group = groups.find((g) => g._id === groupId);
            const team = group.teams.find((t) => t._id === teamId);
            openModal("editPlayer", group, team, player);
          }}
          color="#5856D6"
        />
        <CustomButton
          title="Delete"
          onPress={() => deletePlayer(groupId, teamId, player._id)}
          color="#FF3B30"
        />
      </View>
    </View>
  );

  const renderTeam = ({ item: team, groupId }) => (
    <View style={styles.teamCard}>
      <Text style={styles.teamName}>{team.name}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={commonStyles.input}
          value={playerNames[team._id] || ""} // Bind to specific player name
          onChangeText={(name) => handlePlayerNameChange(team._id, name)} // Handle input changes
          placeholder="Add new player"
          placeholderTextColor="#8E8E93"
        />
        <RNPickerSelect
          onValueChange={(value) => handlePositionChange(team._id, value)} // Handle position change
          value={positions[team._id] || null} // Bind to specific position
          placeholder={{ label: "Position", value: null }}
          items={[
            { label: "Player", value: "Player" },
            { label: "Captain", value: "Captain" },
            { label: "Substitute", value: "Substitute" },
          ]}
          style={pickerSelectStyles}
        />
        <CustomButton
          title="Add Player"
          onPress={() => addPlayer(groupId, team._id)} // Pass the correct team ID
        />
      </View>
      <FlatList
        data={team.players}
        renderItem={({ item }) =>
          renderPlayer({ item, groupId, teamId: team._id })
        }
        keyExtractor={(player) => player._id}
        contentContainerStyle={styles.playersList}
      />
      <View style={styles.teamActions}>
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            title="Edit Team"
            onPress={() => {
              const group = groups.find((g) => g._id === groupId);
              openModal("editTeam", group, team);
            }}
            color="#5856D6"
          />
          <CustomButton
            title="Delete Team"
            onPress={() => deleteTeam(groupId, team._id)}
            color="#FF3B30"
          />
        </View>
      </View>
    </View>
  );

  const handleTeamNameChange = (groupId, name) => {
    setTeamNames((prev) => ({
      ...prev,
      [groupId]: name, // Store team name for specific group
    }));
  };

  const handlePlayerNameChange = (teamId, name) => {
    setPlayerNames((prev) => ({
      ...prev,
      [teamId]: name, // Store player name for specific team
    }));
  };

  const handlePositionChange = (teamId, value) => {
    setPositions((prev) => ({
      ...prev,
      [teamId]: value, // Store position for specific team
    }));
  };

  const renderGroup = ({ item: group }) => (
    <View style={styles.groupCard}>
      <Text style={styles.groupName}>{group.name}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={commonStyles.input}
          value={teamNames[group._id] || ""} // Bind input to specific team name
          onChangeText={(name) => handleTeamNameChange(group._id, name)} // Handle input changes
          placeholder="Add new team"
          placeholderTextColor="#8E8E93"
        />
        <CustomButton
          title="Add Team"
          onPress={() => {
            const teamName = teamNames[group._id]; // Get the team name from state
            console.log("Team Name:", teamName);
            console.log("Team Name before condition:", teamNames[group._id]);

            // Only add team if the input is not empty
            if (teamName && teamName.trim() !== "") {
              console.log("Adding team:", teamName);
              addTeam(group._id, teamName); // Pass team name here
              handleTeamNameChange(group._id, ""); // Clear input after adding
            } else {
              console.log("Team name is empty.");
              Alert.alert("Please enter a team name.");
            }
          }}
        />
      </View>
      <FlatList
        data={group.teams}
        renderItem={({ item }) => renderTeam({ item, groupId: group._id })}
        keyExtractor={(team) => team._id}
        contentContainerStyle={styles.teamsList}
      />
      <View style={styles.groupActions}>
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            title="Edit Group"
            onPress={() => openModal("editGroup", group)}
            color="#5856D6"
          />
          <CustomButton
            title="Delete Group"
            onPress={() => deleteGroup(group._id)}
            color="#FF3B30"
          />
        </View>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {modalType === "editGroup" && (
            <>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <TextInput
                style={styles.modalInput}
                value={updateGroupName}
                onChangeText={setUpdateGroupName}
                placeholder="Update group name"
                placeholderTextColor="#8E8E93"
              />
              <CustomButton title="Update" onPress={updateGroup} />
            </>
          )}

          {modalType === "editTeam" && (
            <>
              <Text style={styles.modalTitle}>Edit Team</Text>
              <TextInput
                style={styles.modalInput}
                value={updateTeamName}
                onChangeText={setUpdateTeamName}
                placeholder="Update team name"
                placeholderTextColor="#8E8E93"
              />
              <CustomButton title="Update" onPress={updateTeam} />
            </>
          )}

          {modalType === "editPlayer" && (
            <>
              <Text style={styles.modalTitle}>Edit Player</Text>
              <TextInput
                style={styles.modalInput}
                value={updatePlayerName}
                onChangeText={setUpdatePlayerName}
                placeholder="Update player name"
                placeholderTextColor="#8E8E93"
              />
              <RNPickerSelect
                onValueChange={setUpdatePlayerPosition}
                value={updatePlayerPosition}
                placeholder={{ label: "Select position", value: null }}
                items={[
                  { label: "Player", value: "Player" },
                  { label: "Captain", value: "Captain" },
                  { label: "Substitute", value: "Substitute" },
                ]}
                style={pickerSelectStyles}
              />
              <CustomButton title="Update" onPress={updatePlayer} />
            </>
          )}

          <CustomButton title="Cancel" onPress={closeModal} color="#FF3B30" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          <View style={styles.header}>
            <TextInput
              style={styles.mainInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Add new group"
              placeholderTextColor="#8E8E93"
            />
            <CustomButton title="Add Group" onPress={addGroup} />
          </View>
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(group) => group._id}
            contentContainerStyle={styles.groupsList}
          />
          {renderModal()}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

// Common Colors
const colors = {
  white: "#FFFFFF",
  lightGray: "#F2F2F7",
  darkGray: "#C6C6C8",
  blue: "#007AFF",
  purple: "#5856D6",
  red: "#FF3B30",
  lightBackground: "#F8F8F8",
  textGray: "#8E8E93",
  shadowColor: "rgba(0, 0, 0, 0.1)", // For better shadow effects
};

// Common Sizes
const sizes = {
  borderRadius: 12,
  smallBorderRadius: 6,
  inputHeight: 48, // Slightly taller input for better usability
  buttonHeight: 40, // Increased button height for touch friendliness
  mainFontSize: 16,
  smallFontSize: 14,
  headerFontSize: 26, // Larger header font for emphasis
  subHeaderFontSize: 22,
};

// Common Styles
const commonStyles = {
  input: {
    height: sizes.inputHeight,
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.darkGray,
    fontSize: sizes.mainFontSize,
    marginVertical: 8, // Increased margin for better spacing
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // Added elevation for Android
  },
  button: {
    height: sizes.buttonHeight,
    borderRadius: sizes.smallBorderRadius,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12, // Adjusted padding for better touch area
    marginHorizontal: 4,
    backgroundColor: colors.blue, // Default button color
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Main Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  contentContainer: {
    flex: 1,
    padding: 16, // Added padding for better content spacing
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainInput: {
    ...commonStyles.input,
    marginBottom: 16,
  },
  groupsList: {
    paddingVertical: 12,
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  groupName: {
    fontSize: sizes.headerFontSize,
    fontWeight: "700", // Bolder for emphasis
    marginBottom: 12,
  },
  teamCard: {
    backgroundColor: colors.lightBackground,
    borderRadius: sizes.smallBorderRadius,
    padding: 16,
    marginTop: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamName: {
    fontSize: sizes.subHeaderFontSize,
    fontWeight: "500",
    marginBottom: 12,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: sizes.smallBorderRadius,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  playerCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.smallBorderRadius,
    padding: 16,
    marginTop: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  playerName: {
    fontSize: sizes.mainFontSize,
    fontWeight: "400",
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: sizes.smallBorderRadius,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  playerPosition: {
    fontSize: sizes.mainFontSize - 2,
    color: colors.textGray,
  },
  playerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: sizes.smallFontSize,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.borderRadius,
    borderTopRightRadius: sizes.borderRadius,
    padding: 20,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: sizes.headerFontSize,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    ...commonStyles.input,
    backgroundColor: colors.lightGray,
    marginBottom: 16,
  },
});

// Picker Select Styles
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    ...commonStyles.input,
    marginVertical: 8,
  },
  inputAndroid: {
    ...commonStyles.input,
    marginVertical: 8,
  },
});

// Exporting component
export default ManageTeams;
