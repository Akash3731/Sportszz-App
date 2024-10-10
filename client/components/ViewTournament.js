import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "./config"; // Adjust the path according to your project structure
import { Svg, Line, Text as SvgText, G } from "react-native-svg"; // Import SVG components
import { Picker } from "@react-native-picker/picker"; // Make sure to import Picker

const ViewTournament = () => {
  const [managerId, setManagerId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreTeamA, setScoreTeamA] = useState(0);
  const [scoreTeamB, setScoreTeamB] = useState(0);
  const [teams, setTeams] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [setCount, setSetCount] = useState(1);
  const [setScoreA, setSetScoreA] = useState([0, 0, 0, 0, 0]); // Max 5 sets
  const [setScoreB, setSetScoreB] = useState([0, 0, 0, 0, 0]);
  const [winners, setWinners] = useState([]); // Array to store winners of each match
  const [matchHistory, setMatchHistory] = useState([]); // Array to store match history
  const [matchType, setMatchType] = useState("Single Elimination"); // New state for match

  const fetchManagerId = async () => {
    try {
      setLoading(true);
      const managerId = await AsyncStorage.getItem("manager-id");
      if (!managerId) {
        Alert.alert("Error", "No manager logged in. Please log in again.");
        return;
      }
      const response = await axios.get(`${config.backendUrl}/managers/me`, {
        headers: { "manager-id": managerId },
      });
      setManagerId(response.data._id);
      await fetchGroups(response.data._id);
    } catch (error) {
      console.error("Error fetching manager ID:", error);
      Alert.alert("Error", "Failed to fetch manager ID");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (mgrId) => {
    if (!mgrId) return;
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

  const fetchTeams = async (groupId) => {
    try {
      const response = await axios.get(
        `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams`
      );
      setTeams(response.data);
      setSelectedGroupId(groupId);
      setWinners([]); // Reset winners when new teams are fetched
    } catch (error) {
      console.error("Error fetching teams:", error);
      Alert.alert("Error", "Failed to fetch teams");
    }
  };

  const selectMatch = (teamA, teamB) => {
    setSelectedMatch({ teamA, teamB });
  };

  const handleMatchStart = () => {
    if (selectedMatch) {
      resetScores();
      setModalVisible(true);
    } else {
      Alert.alert("No Match Selected", "Please select a match first.");
    }
  };

  const closeMatchModal = () => {
    setModalVisible(false);
    resetScores();
    setSelectedMatch(null);
  };

  const resetScores = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
    setSetScoreA([0, 0, 0, 0, 0]); // Reset set scores
    setSetScoreB([0, 0, 0, 0, 0]);
    setSetCount(1); // Reset to the first set
  };

  const handleScoreUpdate = (team) => {
    if (team === "A") {
      setScoreTeamA((prev) => prev + 1);
    } else {
      setScoreTeamB((prev) => prev + 1);
    }
  };

  const handleSetEnd = () => {
    if (scoreTeamA >= 11 && scoreTeamA - scoreTeamB >= 2) {
      const updatedSetScoreA = [...setScoreA];
      updatedSetScoreA[setCount - 1] += 1;
      setSetScoreA(updatedSetScoreA);
      setWinners((prev) => [...prev, selectedMatch.teamA]); // Store winner
      setMatchHistory((prev) => [
        ...prev,
        {
          winner: selectedMatch.teamA,
          teamA: selectedMatch.teamA,
          teamB: selectedMatch.teamB,
        },
      ]); // Add match result to history
      setSetCount((prev) => Math.min(prev + 1, 5)); // Limit sets to a max of 5
      resetCurrentSetScores();
      Alert.alert("Set Ended", `${selectedMatch.teamA} wins the set!`);
      checkMatchEnd();
    } else if (scoreTeamB >= 11 && scoreTeamB - scoreTeamA >= 2) {
      const updatedSetScoreB = [...setScoreB];
      updatedSetScoreB[setCount - 1] += 1;
      setSetScoreB(updatedSetScoreB);
      setWinners((prev) => [...prev, selectedMatch.teamB]); // Store winner
      setMatchHistory((prev) => [
        ...prev,
        {
          winner: selectedMatch.teamB,
          teamA: selectedMatch.teamA,
          teamB: selectedMatch.teamB,
        },
      ]); // Add match result to history
      setSetCount((prev) => Math.min(prev + 1, 5)); // Limit sets to a max of 5
      resetCurrentSetScores();
      Alert.alert("Set Ended", `${selectedMatch.teamB} wins the set!`);
      checkMatchEnd();
    } else {
      Alert.alert(
        "Error",
        "Set cannot end yet. Ensure a player has at least 11 points and a 2-point lead."
      );
    }
  };

  const resetCurrentSetScores = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
  };

  const checkMatchEnd = () => {
    const totalSetsA = setScoreA.reduce((acc, score) => acc + score, 0);
    const totalSetsB = setScoreB.reduce((acc, score) => acc + score, 0);

    if (totalSetsA > 2) {
      Alert.alert("Match Over", `${selectedMatch.teamA} wins the match!`);
      closeMatchModal();
    } else if (totalSetsB > 2) {
      Alert.alert("Match Over", `${selectedMatch.teamB} wins the match!`);
      closeMatchModal();
    }
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupContainer}
      onPress={() => fetchTeams(item._id)}
    >
      <Text style={styles.groupText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMatchup = (teamA, teamB) => (
    <View style={styles.matchupContainer}>
      <TouchableOpacity
        style={[
          styles.matchupButton,
          selectedMatch?.teamA === teamA.name &&
          selectedMatch?.teamB === teamB.name
            ? styles.selectedMatch
            : null,
        ]}
        onPress={() => selectMatch(teamA.name, teamB.name)}
      >
        <Text style={styles.matchupText}>
          {teamA.name} vs {teamB.name}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Function to render SVG Bracket based on the match type
  const renderBracket = () => {
    const numTeams = teams.length;
    const matchups = [];

    // Build initial matchups
    for (let i = 0; i < numTeams; i += 2) {
      if (teams[i + 1]) {
        matchups.push({
          teamA: teams[i],
          teamB: teams[i + 1],
        });
      }
    }

    return (
      <Svg height="400" width="100%">
        <G>
          {matchups.map((matchup, index) => (
            <React.Fragment key={index}>
              <Line
                x1="5%"
                y1={index * 80 + 50}
                x2="95%"
                y2={index * 80 + 50}
                stroke="black"
                strokeWidth="2"
              />
              <SvgText x="5%" y={index * 80 + 50} fontSize="16" fill="black">
                {matchup.teamA.name} vs {matchup.teamB.name}
              </SvgText>
            </React.Fragment>
          ))}
        </G>
      </Svg>
    );
  };

  const renderHistory = () => {
    return matchHistory.map((match, index) => (
      <View key={index} style={styles.historyItem}>
        <Text>
          {match.teamA} vs {match.teamB} - Winner: {match.winner}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.groupList}
            showsVerticalScrollIndicator={false}
          />
          {selectedGroupId && teams.length > 0 && (
            <>
              <Text style={styles.title}>Matchups:</Text>
              <FlatList
                data={teams}
                renderItem={({ item }) =>
                  renderMatchup(
                    item,
                    teams[(teams.indexOf(item) + 1) % teams.length]
                  )
                }
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.matchupList}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleMatchStart}
              >
                <Text style={styles.startButtonText}>Start Match</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMatchModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedMatch?.teamA} vs {selectedMatch?.teamB}
            </Text>
            <Text>Score:</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInput}>
                <Text>{scoreTeamA}</Text>
                <TouchableOpacity onPress={() => handleScoreUpdate("A")}>
                  <Text style={styles.scoreButton}>Add Point Team A</Text>
                </TouchableOpacity>
                <Text>Sets: {setScoreA.join(", ")}</Text>
              </View>
              <View style={styles.scoreInput}>
                <Text>{scoreTeamB}</Text>
                <TouchableOpacity onPress={() => handleScoreUpdate("B")}>
                  <Text style={styles.scoreButton}>Add Point Team B</Text>
                </TouchableOpacity>
                <Text>Sets: {setScoreB.join(", ")}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.endSetButton}
              onPress={handleSetEnd}
            >
              <Text style={styles.endSetButtonText}>End Set</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeMatchModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.historyTitle}>Match History:</Text>
            <View style={styles.historyContainer}>{renderHistory()}</View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  groupList: {
    marginBottom: 16,
  },
  groupContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginVertical: 4,
    elevation: 2,
  },
  groupText: {
    fontSize: 16,
    color: "#333333",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  matchupContainer: {
    marginVertical: 4,
  },
  matchupButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    elevation: 2,
    alignItems: "center",
  },
  selectedMatch: {
    backgroundColor: "#d1e7dd",
  },
  matchupText: {
    fontSize: 16,
    color: "#333333",
  },
  startButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007bff",
    alignItems: "center",
    marginTop: 16,
  },
  startButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scoreInput: {
    flex: 1,
    alignItems: "center",
  },
  scoreButton: {
    padding: 8,
    backgroundColor: "#e7f1ff",
    borderRadius: 8,
    textAlign: "center",
    marginVertical: 4,
  },
  endSetButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#28a745",
    alignItems: "center",
    marginTop: 16,
  },
  endSetButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#dc3545",
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  historyContainer: {
    marginTop: 8,
  },
  historyItem: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 4,
  },
});

export default ViewTournament;
