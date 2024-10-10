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
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "./config"; // Adjust the path according to your project structure
import { Svg, Line, Text as SvgText, G, Rect } from "react-native-svg"; // Import SVG components
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
  const [matchType, setMatchType] = useState("Singles");
  const [tournamentType, setTournamentType] = useState("Single Elimination");
  const [roundRobinResults, setRoundRobinResults] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [brackets, setBrackets] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(1);

  // Initialize round-robin results when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && tournamentType === "Round Robin") {
      initializeRoundRobinResults();
    }
  }, [teams, tournamentType]);

  const initializeRoundRobinResults = () => {
    const results = {};
    teams.forEach((team) => {
      results[team._id] = {
        wins: 0,
        losses: 0,
        matches: [],
        points: 0,
      };
    });
    setRoundRobinResults(results);
  };

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

  const generateBrackets = () => {
    if (!teams.length) return;

    switch (tournamentType) {
      case "Single Elimination":
        generateSingleEliminationBracket();
        break;
      case "Round Robin":
        generateRoundRobinSchedule();
        break;
      case "Expedition":
        generateExpeditionBracket();
        break;
      default:
        generateSingleEliminationBracket();
    }
  };

  const generateSingleEliminationBracket = () => {
    const rounds = Math.ceil(Math.log2(teams.length));
    const newBrackets = [];
    let matchCount = Math.floor(teams.length / 2);

    for (let round = 1; round <= rounds; round++) {
      const roundMatches = [];
      for (let match = 0; match < matchCount; match++) {
        if (round === 1) {
          roundMatches.push({
            teamA: teams[match * 2]?.name || "BYE",
            teamB: teams[match * 2 + 1]?.name || "BYE",
            winner: null,
          });
        } else {
          roundMatches.push({
            teamA: "TBD",
            teamB: "TBD",
            winner: null,
          });
        }
      }
      newBrackets.push(roundMatches);
      matchCount = Math.floor(matchCount / 2);
    }
    setBrackets(newBrackets);
  };

  const generateRoundRobinSchedule = () => {
    const schedule = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        schedule.push({
          teamA: teams[i].name,
          teamB: teams[j].name,
          winner: null,
        });
      }
    }
    setBrackets([schedule]);
  };

  const generateExpeditionBracket = () => {
    // Split teams into groups for round robin
    const groupSize = 4;
    const groups = [];
    for (let i = 0; i < teams.length; i += groupSize) {
      groups.push(teams.slice(i, i + groupSize));
    }

    // Generate round robin schedules for each group
    const groupSchedules = groups.map((group) => {
      const schedule = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          schedule.push({
            teamA: group[i].name,
            teamB: group[j].name,
            winner: null,
          });
        }
      }
      return schedule;
    });

    setBrackets(groupSchedules);
  };

  useEffect(() => {
    if (teams.length > 0) {
      generateBrackets();
    }
  }, [teams, tournamentType]);

  const renderSingleEliminationBracket = () => {
    const svgHeight = Math.max(400, brackets[0]?.length * 100);
    const roundWidth = 150;

    return (
      <ScrollView horizontal>
        <ScrollView>
          <Svg height={svgHeight} width={brackets.length * roundWidth + 50}>
            {brackets.map((round, roundIndex) => (
              <G key={`round-${roundIndex}`}>
                {round.map((match, matchIndex) => {
                  const yPos =
                    (svgHeight / (round.length + 1)) * (matchIndex + 1);
                  return (
                    <G key={`match-${roundIndex}-${matchIndex}`}>
                      <Rect
                        x={roundIndex * roundWidth + 10}
                        y={yPos - 15}
                        width={120}
                        height={30}
                        fill="white"
                        stroke="black"
                      />
                      <SvgText
                        x={roundIndex * roundWidth + 15}
                        y={yPos + 5}
                        fontSize={12}
                      >
                        {match.teamA} vs {match.teamB}
                      </SvgText>
                      {roundIndex < brackets.length - 1 && (
                        <Line
                          x1={roundIndex * roundWidth + 130}
                          y1={yPos}
                          x2={(roundIndex + 1) * roundWidth + 10}
                          y2={
                            (svgHeight /
                              (brackets[roundIndex + 1].length + 1)) *
                            (Math.floor(matchIndex / 2) + 1)
                          }
                          stroke="black"
                          strokeWidth="1"
                        />
                      )}
                    </G>
                  );
                })}
              </G>
            ))}
          </Svg>
        </ScrollView>
      </ScrollView>
    );
  };

  const renderRoundRobinBracket = () => {
    const cellSize = 40;
    const headerHeight = 30;
    const svgWidth = (teams.length + 1) * cellSize;
    const svgHeight = (teams.length + 1) * cellSize;

    return (
      <ScrollView horizontal>
        <ScrollView>
          <Svg height={svgHeight} width={svgWidth}>
            {/* Render header row and column */}
            {teams.map((team, index) => (
              <G key={`header-${index}`}>
                <Rect
                  x={cellSize}
                  y={index * cellSize + headerHeight}
                  width={cellSize}
                  height={cellSize}
                  fill="white"
                  stroke="black"
                />
                <SvgText
                  x={cellSize + 5}
                  y={index * cellSize + headerHeight + 20}
                  fontSize={10}
                >
                  {team.name}
                </SvgText>
              </G>
            ))}
          </Svg>
        </ScrollView>
      </ScrollView>
    );
  };

  const renderExpeditionBracket = () => {
    // Combine round robin and single elimination visualization
    return (
      <View>
        <Text style={styles.bracketTitle}>Group Stage (Round Robin)</Text>
        {renderRoundRobinBracket()}
        <Text style={styles.bracketTitle}>Knockout Stage</Text>
        {renderSingleEliminationBracket()}
      </View>
    );
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

  // Add tournament progress indicators to the UI
  const renderTournamentProgress = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Round: {currentRound} - Match: {currentMatch}
      </Text>
      {tournamentType === "Round Robin" && (
        <TouchableOpacity
          style={styles.standingsButton}
          onPress={() => displayTournamentResults(calculateFinalStandings())}
        >
          <Text style={styles.standingsButtonText}>View Current Standings</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

  // Handle match completion and tournament progression
  const handleMatchCompletion = (winningTeam, losingTeam) => {
    if (tournamentType === "Round Robin") {
      updateRoundRobinResults(winningTeam, losingTeam);
    } else if (tournamentType === "Single Elimination") {
      handleSingleEliminationProgress(winningTeam);
    }

    // Add winner to the winners array
    setWinners((prev) => [...prev, winningTeam]);

    // Progress to next match
    setCurrentMatch((prev) => prev + 1);

    // Check if current round is complete
    checkRoundCompletion();
  };

  const updateRoundRobinResults = (winner, loser) => {
    setRoundRobinResults((prev) => {
      const updated = { ...prev };
      // Update winner's stats
      updated[winner._id] = {
        ...updated[winner._id],
        wins: updated[winner._id].wins + 1,
        points: updated[winner._id].points + 2,
        matches: [
          ...updated[winner._id].matches,
          {
            opponent: loser._id,
            result: "win",
          },
        ],
      };
      // Update loser's stats
      updated[loser._id] = {
        ...updated[loser._id],
        losses: updated[loser._id].losses + 1,
        points: updated[loser._id].points + 1,
        matches: [
          ...updated[loser._id].matches,
          {
            opponent: winner._id,
            result: "loss",
          },
        ],
      };
      return updated;
    });
  };

  const handleSingleEliminationProgress = (winner) => {
    const updatedBrackets = [...brackets];
    const currentRoundMatches = updatedBrackets[currentRound - 1];

    // Find the match index in current round
    const matchIndex = currentRoundMatches.findIndex(
      (match) =>
        match.teamA === selectedMatch.teamA &&
        match.teamB === selectedMatch.teamB
    );

    // Update the winner
    currentRoundMatches[matchIndex].winner = winner.name;

    // If there's a next round, update the advancing team
    if (currentRound < updatedBrackets.length) {
      const nextRoundIndex = Math.floor(matchIndex / 2);
      const isFirstTeam = matchIndex % 2 === 0;
      const nextRoundMatch = updatedBrackets[currentRound][nextRoundIndex];

      if (isFirstTeam) {
        nextRoundMatch.teamA = winner.name;
      } else {
        nextRoundMatch.teamB = winner.name;
      }
    }

    setBrackets(updatedBrackets);
  };

  const checkRoundCompletion = () => {
    const matchesPerRound =
      tournamentType === "Round Robin"
        ? (teams.length * (teams.length - 1)) / 2
        : Math.floor(teams.length / Math.pow(2, currentRound - 1));

    if (currentMatch > matchesPerRound) {
      // Round is complete
      setCurrentRound((prev) => prev + 1);
      setCurrentMatch(1);

      if (tournamentType === "Round Robin") {
        checkTournamentCompletion();
      }
    }
  };

  const checkTournamentCompletion = () => {
    if (tournamentType === "Round Robin") {
      const totalMatches = (teams.length * (teams.length - 1)) / 2;
      const completedMatches =
        Object.values(roundRobinResults).reduce(
          (sum, team) => sum + team.matches.length,
          0
        ) / 2;

      if (completedMatches >= totalMatches) {
        const standings = calculateFinalStandings();
        displayTournamentResults(standings);
      }
    }
  };

  const calculateFinalStandings = () => {
    return Object.entries(roundRobinResults)
      .map(([teamId, stats]) => ({
        teamId,
        team: teams.find((t) => t._id === teamId),
        ...stats,
      }))
      .sort((a, b) => b.points - a.points);
  };

  const displayTournamentResults = (standings) => {
    Alert.alert(
      "Tournament Complete",
      `Final Standings:\n${standings
        .map(
          (s, i) =>
            `${i + 1}. ${s.team.name} - ${s.points} points (${s.wins}W/${
              s.losses
            }L)`
        )
        .join("\n")}`,
      [{ text: "OK" }]
    );
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
    switch (tournamentType) {
      case "Single Elimination":
        return renderSingleEliminationBracket();
      case "Round Robin":
        return renderRoundRobinBracket();
      case "Expedition":
        return renderExpeditionBracket();
      default:
        return renderSingleEliminationBracket();
    }
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
        <ScrollView style={styles.scrollView}>
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.groupList}
            showsVerticalScrollIndicator={false}
          />
          {selectedGroupId && teams.length > 0 && (
            <>
              <View style={styles.tournamentConfigSection}>
                <Text style={styles.title}>Tournament Configuration</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Tournament Type:</Text>
                  <Picker
                    selectedValue={tournamentType}
                    onValueChange={(value) => setTournamentType(value)}
                    style={styles.picker}
                  >
                    <Picker.Item
                      label="Single Elimination"
                      value="Single Elimination"
                    />
                    <Picker.Item label="Round Robin" value="Round Robin" />
                    <Picker.Item label="Expedition" value="Expedition" />
                  </Picker>
                </View>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Match Type:</Text>
                  <Picker
                    selectedValue={matchType}
                    onValueChange={(value) => setMatchType(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Singles (Best of 7)" value="Singles" />
                    <Picker.Item
                      label="Team (4 Singles + 1 Doubles)"
                      value="Team"
                    />
                  </Picker>
                </View>
              </View>

              <View style={styles.bracketContainer}>
                <Text style={styles.title}>Tournament Bracket</Text>
                {renderBracket()}
              </View>

              <View style={styles.matchupsSection}>
                <Text style={styles.title}>Current Matchups:</Text>
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
                {/* Add tournament progress section */}
                {renderTournamentProgress()}
              </View>
            </>
          )}
        </ScrollView>
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
            <Text style={styles.modalSubtitle}>
              {matchType === "Singles" ? "Best of 7" : "Team Match"}
            </Text>

            {matchType === "Team" && (
              <View style={styles.matchTypeIndicator}>
                <Text style={styles.matchTypeText}>
                  Match {currentMatch}/5 (
                  {currentMatch <= 4 ? "Singles" : "Doubles"})
                </Text>
              </View>
            )}

            <View style={styles.scoreContainer}>
              <View style={styles.scoreInput}>
                <Text style={styles.scoreText}>{scoreTeamA}</Text>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreUpdate("A")}
                >
                  <Text style={styles.scoreButtonText}>Add Point Team A</Text>
                </TouchableOpacity>
                <Text style={styles.setScoreText}>
                  Sets: {setScoreA.join(", ")}
                </Text>
              </View>

              <View style={styles.scoreDivider}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.scoreInput}>
                <Text style={styles.scoreText}>{scoreTeamB}</Text>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => handleScoreUpdate("B")}
                >
                  <Text style={styles.scoreButtonText}>Add Point Team B</Text>
                </TouchableOpacity>
                <Text style={styles.setScoreText}>
                  Sets: {setScoreB.join(", ")}
                </Text>
              </View>
            </View>

            <View style={styles.matchControls}>
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
                <Text style={styles.closeButtonText}>Close Match</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Match History:</Text>
              <ScrollView style={styles.historyContainer}>
                {renderHistory()}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const additionalStyles = StyleSheet.create({
  progressContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  standingsButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  standingsButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  ...additionalStyles,
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  groupList: {
    marginBottom: 16,
  },
  tournamentConfigSection: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333333",
  },
  picker: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  bracketContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  matchupsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1a1a1a",
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
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#007bff",
    alignItems: "center",
    marginTop: 16,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 4,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#1a1a1a",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
  },
  matchTypeIndicator: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  matchTypeText: {
    textAlign: "center",
    color: "#666666",
    fontWeight: "500",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  scoreInput: {
    flex: 1,
    alignItems: "center",
  },
  scoreDivider: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666666",
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  scoreButton: {
    padding: 12,
    backgroundColor: "#e7f1ff",
    borderRadius: 8,
    width: "100%",
    marginBottom: 8,
  },
  scoreButtonText: {
    textAlign: "center",
    color: "#007bff",
    fontWeight: "500",
  },
  setScoreText: {
    fontSize: 14,
    color: "#666666",
  },
  matchControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  endSetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#28a745",
    marginRight: 8,
  },
  endSetButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#dc3545",
    marginLeft: 8,
  },
  closeButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  historySection: {
    flex: 1,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  historyContainer: {
    flex: 1,
  },
  historyItem: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default ViewTournament;
