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
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "./config";
import { Svg, Line, Text as SvgText, G, Rect } from "react-native-svg";
import RNPickerSelect from "react-native-picker-select";
import Icon from "react-native-vector-icons/FontAwesome";

const ViewTournament = () => {
  const [managerId, setManagerId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMatchHistoryVisible, setMatchHistoryVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [teams, setTeams] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [setCount, setSetCount] = useState(1);

  const [matchHistory, setMatchHistory] = useState([]);
  const [matchType, setMatchType] = useState(null);
  const [tournamentType, setTournamentType] = useState("");
  const [roundRobinResults, setRoundRobinResults] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [brackets, setBrackets] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(1);
  const [scoreTeamA, setScoreTeamA] = useState(0);
  const [scoreTeamB, setScoreTeamB] = useState(0);
  const [setScoreA, setSetScoreA] = useState([]);
  const [setScoreB, setSetScoreB] = useState([]);
  const [numOfSets, setNumOfSets] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);
  const [setHistory, setSetHistory] = useState([]);
  const [winners, setWinners] = useState([]);
  const [losers, setLosers] = useState([]);
  const [setsWonByTeamA, setSetsWonByTeamA] = useState(0);
  const [setsWonByTeamB, setSetsWonByTeamB] = useState(0);

  {
    /*For tracking sets and points */
  }
  const [teamASetPoints, setTeamASetPoints] = useState([]);
  const [teamBSetPoints, setTeamBSetPoints] = useState([]);
  const [currentSet, setCurrentSet] = useState(1);

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

      if (Array.isArray(response.data)) {
        const teamsData = response.data;
        setTeams(teamsData);
        setSelectedGroupId(groupId);

        // Check for no teams or only one team
        if (teamsData.length === 0) {
          Alert.alert("No Teams", "There are no teams in this group.");
        } else if (teamsData.length === 1) {
          Alert.alert("Only One Team", "There is only one team in this group.");
        } else {
          setWinners([]); // Reset winners if multiple teams exist
        }
      } else {
        throw new Error("Unexpected data format received");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch teams");
    }
  };

  const getMatchStatus = (match) => {
    if (match.teamA === "BYE" || match.teamB === "BYE") return "bye";
    if (match.winner) return "completed"; // Check if winner is assigned
    if (
      selectedMatch?.teamA === match.teamA &&
      selectedMatch?.teamB === match.teamB
    )
      return "inProgress";
    return "pending"; // Match is still pending if no other status applies
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

  useEffect(() => {
    if (teams.length > 0) {
      generateBrackets();
    }
  }, [teams, tournamentType]);

  // Single Elimination Bracket
  const renderSingleEliminationBracket = () => {
    const svgHeight = Math.max(400, brackets[0]?.length * 100);
    const roundWidth = 150;

    const matchColors = {
      pending: "#f8f9fa",
      inProgress: "#fff3cd",
      completed: "#d1e7dd",
      bye: "#e9ecef",
    };

    return (
      <ScrollView horizontal>
        <ScrollView>
          <Svg height={svgHeight} width={brackets.length * roundWidth + 50}>
            {brackets.map((round, roundIndex) => (
              <G key={`round-${roundIndex}`}>
                <SvgText
                  x={roundIndex * roundWidth + 40}
                  y={20}
                  fontSize={14}
                  fontWeight="bold"
                  fill="#666666"
                >
                  Round {roundIndex + 1}
                </SvgText>

                {round.map((match, matchIndex) => {
                  const yPos =
                    (svgHeight / (round.length + 1)) * (matchIndex + 1);
                  const matchStatus = getMatchStatus(match); // Check if this returns the expected status
                  console.log(
                    `Match Status for ${match.teamA} vs ${match.teamB}:`,
                    matchStatus
                  ); // Debug log

                  return (
                    <G key={`match-${roundIndex}-${matchIndex}`}>
                      <Rect
                        x={roundIndex * roundWidth + 10}
                        y={yPos - 20}
                        width={120}
                        height={40}
                        fill={matchColors[matchStatus]}
                        stroke={
                          matchStatus === "inProgress" ? "#ffc107" : "#dee2e6"
                        }
                        strokeWidth={matchStatus === "inProgress" ? "2" : "1"}
                        rx={4}
                      />

                      <SvgText
                        x={roundIndex * roundWidth + 15}
                        y={yPos - 5}
                        fontSize={12}
                        fill={
                          match.winner === match.teamA ? "#28a745" : "#212529"
                        }
                        fontWeight={
                          match.winner === match.teamA ? "bold" : "normal"
                        }
                      >
                        {match.teamA}
                      </SvgText>

                      <Line
                        x1={roundIndex * roundWidth + 15}
                        y1={yPos}
                        x2={roundIndex * roundWidth + 125}
                        y2={yPos}
                        stroke="#dee2e6"
                        strokeWidth="1"
                      />

                      <SvgText
                        x={roundIndex * roundWidth + 15}
                        y={yPos + 15}
                        fontSize={12}
                        fill={
                          match.winner === match.teamB ? "#28a745" : "#212529"
                        }
                        fontWeight={
                          match.winner === match.teamB ? "bold" : "normal"
                        }
                      >
                        {match.teamB}
                      </SvgText>

                      {match.winner && (
                        <Rect
                          x={roundIndex * roundWidth + 120}
                          y={yPos - 10}
                          width={8}
                          height={20}
                          fill="#28a745"
                          rx={2}
                        />
                      )}

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
                          stroke={match.winner ? "#28a745" : "#dee2e6"}
                          strokeWidth={match.winner ? "2" : "1"}
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

  // Round Robin Bracket
  const renderRoundRobinBracket = () => {
    const cellSize = 40;
    const headerHeight = 30;
    const svgWidth = (teams.length + 1) * cellSize;
    const svgHeight = (teams.length + 1) * cellSize;

    return (
      <ScrollView horizontal>
        <ScrollView>
          <Svg height={svgHeight} width={svgWidth}>
            {teams.map((team, index) => (
              <G key={`header-${index}`}>
                <Rect
                  x={cellSize}
                  y={index * cellSize + headerHeight}
                  width={cellSize}
                  height={cellSize}
                  fill="#ffffff"
                  stroke="#dee2e6"
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

            {teams.map((teamA, rowIndex) =>
              teams.map((teamB, colIndex) => {
                if (rowIndex !== colIndex) {
                  const match = matchHistory.find(
                    (m) =>
                      (m.teamA === teamA.name && m.teamB === teamB.name) ||
                      (m.teamA === teamB.name && m.teamB === teamA.name)
                  );

                  const cellFill = match
                    ? match.winner === teamA.name
                      ? "#d1e7dd" // Winner cell color
                      : "#f8d7da" // Loser cell color
                    : "#ffffff"; // Default color for unplayed matches

                  console.log(
                    `Match Result: ${teamA.name} vs ${teamB.name}, Winner: ${
                      match ? match.winner : "N/A"
                    }`
                  ); // Debug log

                  return (
                    <G key={`cell-${rowIndex}-${colIndex}`}>
                      <Rect
                        x={(colIndex + 1) * cellSize}
                        y={rowIndex * cellSize + headerHeight}
                        width={cellSize}
                        height={cellSize}
                        fill={cellFill}
                        stroke="#dee2e6"
                      />
                      {match && (
                        <SvgText
                          x={(colIndex + 1) * cellSize + 15}
                          y={rowIndex * cellSize + headerHeight + 25}
                          fontSize={12}
                          textAnchor="middle"
                        >
                          {match.winner === teamA.name ? "W" : "L"}
                        </SvgText>
                      )}
                    </G>
                  );
                }
                return null;
              })
            )}
          </Svg>
        </ScrollView>
      </ScrollView>
    );
  };

  const selectMatch = (teamA, teamB) => {
    setSelectedMatch({ teamA, teamB });
  };

  const handleMatchStart = () => {
    if (selectedMatch) {
      // Log tournament configurations
      console.log("Tournament Type:", tournamentType);
      console.log("Match Type:", matchType);
      console.log("Number of Sets:", numOfSets);

      resetScores(); // Reset scores to zero
      setCurrentMatch(0); // Reset current match to 0
      setMatchWinner(null); // Reset match winner
      setSetHistory([]); // Reset set history when starting a new match
      setModalVisible(true); // Open the modal
    } else {
      Alert.alert("No Match Selected", "Please select a match first.");
    }
  };

  const handleMatchEnd = () => {
    if (!selectedMatch) {
      Alert.alert("Error", "No match selected.");
      return;
    }

    console.log("Ending Match...");
    console.log("Tournament Type:", tournamentType);
    console.log("Match Type:", matchType);
    console.log("Number of Sets:", numOfSets);

    // Determine who won the match based on sets won
    if (setsWonByTeamA > setsWonByTeamB) {
      Alert.alert("Match Over", `${selectedMatch.teamA} wins the match!`);
      updateBrackets(selectedMatch.teamA); // Update brackets for winner
    } else if (setsWonByTeamB > setsWonByTeamA) {
      Alert.alert("Match Over", `${selectedMatch.teamB} wins the match!`);
      updateBrackets(selectedMatch.teamB); // Update brackets for winner
    } else {
      Alert.alert(
        "Match Still Ongoing",
        "The match has not yet been concluded."
      );
      return; // Exit if match is still ongoing
    }

    // Add match result to history
    setMatchHistory((prev) => [
      ...prev,
      {
        matchNumber: currentMatch + 1,
        winner:
          setsWonByTeamA > setsWonByTeamB
            ? selectedMatch.teamA
            : selectedMatch.teamB,
        scores: { scoreA: scoreTeamA, scoreB: scoreTeamB },
      },
    ]);

    // Handle tournament type logic after determining match outcome
    if (tournamentType === "Single Elimination") {
      updateBrackets(
        setsWonByTeamA > setsWonByTeamB
          ? selectedMatch.teamA
          : selectedMatch.teamB
      );
      Alert.alert("Next Round", "Proceed to the next round of the tournament.");
    } else if (tournamentType === "Round Robin") {
      if (setsWonByTeamA > setsWonByTeamB) {
        setTeamsAWins((prev) => prev + 1);
      } else if (setsWonByTeamB > setsWonByTeamA) {
        setTeamsBWins((prev) => prev + 1);
      }
      Alert.alert("Match Recorded", "Scores updated for Round Robin.");
    } else if (tournamentType === "Expedition") {
      Alert.alert("Expedition Match", "Match concluded in expedition format.");
    }

    // Reset match state for the next round
    resetMatch();
    setSelectedMatch(null); // Reset selectedMatch to prevent accessing undefined
    closeMatchModal(); // Close the modal after handling end of match
  };

  const updateBrackets = (winner) => {
    const updatedBrackets = brackets.map((round) => {
      return round.map((match) => {
        // Update match based on team names instead of id
        if (
          (match.teamA === selectedMatch.teamA &&
            match.teamB === selectedMatch.teamB) ||
          (match.teamA === selectedMatch.teamB &&
            match.teamB === selectedMatch.teamA)
        ) {
          return { ...match, winner };
        }
        return match;
      });
    });
    setBrackets(updatedBrackets); // Update state with the new bracket
    console.log("Brackets updated:", updatedBrackets);
  };

  // In your modal, use `selectedMatch` state to display match info correctly
  useEffect(() => {
    if (selectedMatch) {
      // Here you could check and update the match details if needed
      console.log("Selected Match updated:", selectedMatch);
    }
  }, [selectedMatch]);

  const resetScores = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
  };

  const handleSetEnd = () => {
    const winningScore = 11; // Score needed to win a set
    const scoreDifference = Math.abs(scoreTeamA - scoreTeamB); // Difference in scores
    let winningTeam;
    let losingTeam;

    // Ensure selectedMatch is defined
    if (!selectedMatch) {
      Alert.alert("Error", "No match selected.");
      return;
    }

    // Alert current scores
    Alert.alert(
      "Current Scores",
      `${selectedMatch.teamA}: ${scoreTeamA}, ${selectedMatch.teamB}: ${scoreTeamB}`
    );

    // Check if either team has won the set
    if (scoreTeamA >= winningScore && scoreDifference >= 2) {
      winningTeam = selectedMatch.teamA;
      losingTeam = selectedMatch.teamB;
      setSetsWonByTeamA((prev) => prev + 1); // Increment Team A's sets won
    } else if (scoreTeamB >= winningScore && scoreDifference >= 2) {
      winningTeam = selectedMatch.teamB;
      losingTeam = selectedMatch.teamA;
      setSetsWonByTeamB((prev) => prev + 1); // Increment Team B's sets won
    } else {
      // Conditions not met, alert the user
      Alert.alert(
        "Set Still Ongoing",
        "A team must have at least 11 points and lead by 2 points to end the set."
      );
      return; // Exit if conditions are not met
    }

    // Update set history
    setSetHistory((prev) => [
      ...prev,
      { scoreA: scoreTeamA, scoreB: scoreTeamB, winningTeam, losingTeam },
    ]);

    Alert.alert("Set Over", `${winningTeam} wins the set!`);

    // Reset the scores for the next set
    resetScores();

    // Log set details
    console.log(
      `Set ${setSetHistory.length}: ${selectedMatch.teamA} - ${scoreTeamA}, ${selectedMatch.teamB} - ${scoreTeamB}, Winner: ${winningTeam}, Loser: ${losingTeam}`
    );

    // Check if match should end after the set
    const setsNeededToWin = Math.ceil(numOfSets / 2);
    if (
      (matchType === "Team" && setsWonByTeamA >= setsNeededToWin) ||
      (matchType === "Singles" && setsWonByTeamA >= setsNeededToWin) ||
      (matchType === "Doubles" && setsWonByTeamB >= setsNeededToWin)
    ) {
      handleMatchEnd(); // Call the match end logic
    }
  };

  // Function to render each match history item for table tennis
  const renderMatchHistoryItem = ({ item }) => {
    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyText}>
          {item.teamA} vs {item.teamB} - Winner: {item.winner}
        </Text>
        <Text style={styles.historyText}>
          Sets:
          {item.setHistory.map((set, index) => (
            <Text key={index}>
              {` Set ${index + 1}: ${set.scoreA} - ${set.scoreB}${
                index < item.setHistory.length - 1 ? ", " : ""
              }`}
            </Text>
          ))}
        </Text>
        <Text style={styles.historyText}>
          Total Score: {item.scores.scoreA} - {item.scores.scoreB}
        </Text>
      </View>
    );
  };

  // Function to add points to Team A
  const addPointsTeamA = () => {
    setScoreTeamA(scoreTeamA + 1);
  };

  // Function to add points to Team B
  const addPointsTeamB = () => {
    setScoreTeamB(scoreTeamB + 1);
  };

  // Function to decrement points from Team A
  const decrementPointsTeamA = () => {
    if (scoreTeamA > 0) {
      setScoreTeamA(scoreTeamA - 1);
    }
  };

  // Function to decrement points from Team B
  const decrementPointsTeamB = () => {
    if (scoreTeamB > 0) {
      setScoreTeamB(scoreTeamB - 1);
    }
  };

  const resetMatch = () => {
    resetScores();
    setSetScoreA([]);
    setSetScoreB([]);
    setCurrentSet(1);
    setMatchWinner(null);
    setSetHistory([]);
  };

  const closeMatchModal = () => {
    setModalVisible(false);
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupContainer}
      onPress={() => fetchTeams(item._id)} // Fetch teams when a group is pressed
      accessibilityLabel={`Select group ${item.name}`} // Accessibility improvement
      accessibilityHint="Double tap to view teams in this group."
    >
      <Text style={styles.groupText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMatchup = (match) => {
    const matchStatus = getMatchStatus(match); // Get match status here
    const { teamA, teamB } = match; // Destructure teamA and teamB from the match object

    return (
      <View style={styles.matchupContainer}>
        <TouchableOpacity
          style={[
            styles.matchupButton,
            matchStatus === "inProgress" ? styles.selectedMatch : null,
          ]}
          onPress={() => selectMatch(teamA, teamB)} // Use team names directly
        >
          <Text style={styles.matchupText}>
            {teamA} vs {teamB}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBracket = () => {
    switch (tournamentType) {
      case "Single Elimination":
        return renderSingleEliminationBracket();
      case "Round Robin":
        return renderRoundRobinBracket();
      default:
        return renderSingleEliminationBracket();
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.groupList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            selectedGroupId &&
            teams.length > 0 && (
              <View style={styles.tournamentConfigSection}>
                <Text style={styles.title}>Tournament Configuration</Text>

                {/* Tournament Type Selector */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Tournament Type:</Text>
                  <RNPickerSelect
                    onValueChange={(value) => setTournamentType(value)}
                    items={[
                      {
                        label: "Single Elimination",
                        value: "Single Elimination",
                      },
                      { label: "Round Robin", value: "Round Robin" },
                      { label: "Expedition", value: "Expedition" },
                    ]}
                    style={pickerSelectStyles}
                    placeholder={{ label: "Select a type...", value: null }}
                    value={tournamentType}
                  />
                </View>

                {/* Match Type Selector */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Match Type:</Text>
                  <RNPickerSelect
                    onValueChange={(value) => setMatchType(value)}
                    items={[
                      { label: "Singles (Best of 5 or 7)", value: "Singles" },
                      { label: "Team (Best of 5 Matches)", value: "Team" },
                      { label: "Mixed Doubles", value: "MixedDoubles" },
                    ]}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select a match type...",
                      value: null,
                    }}
                    value={matchType}
                  />
                </View>

                {/* Number of Sets Selector */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Number of Sets:</Text>
                  <RNPickerSelect
                    onValueChange={(value) => setNumOfSets(value)}
                    items={[
                      { label: "Best of 3 Sets", value: 3 },
                      { label: "Best of 5 Sets", value: 5 },
                      { label: "Best of 7 Sets", value: 7 },
                    ]}
                    value={numOfSets}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select number of sets",
                      value: null,
                    }}
                  />
                </View>

                {/* Tournament Bracket */}
                <View style={styles.bracketContainer}>
                  <Text style={styles.title}>Tournament Bracket</Text>
                  {tournamentType && matchType && renderBracket()}
                </View>

                {/* Current Matchups Section */}
                <View style={styles.matchupsSection}>
                  <Text style={styles.title}>Current Matchups:</Text>
                  <FlatList
                    data={brackets[0]} // Get the first round of matches dynamically
                    renderItem={({ item }) => (
                      <View style={styles.matchupContainer}>
                        {renderMatchup(item)}
                        <TouchableOpacity
                          style={styles.startButton}
                          onPress={() => {
                            setSelectedMatch({
                              ...item,
                              tournamentType, // Include tournament type
                              matchType, // Include match type
                            });
                            handleMatchStart(); // Start the match
                          }}
                        >
                          <Text style={styles.startButtonText}>
                            Start Match
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    keyExtractor={(item) => `${item.teamA}-${item.teamB}`} // Ensure keys are unique
                    contentContainerStyle={styles.matchupList}
                    showsVerticalScrollIndicator={false}
                  />
                </View>

                {/* Match History Section */}
                <View style={styles.matchHistorySection}>
                  <Text style={styles.title}>Match History:</Text>
                  <FlatList
                    data={matchHistory}
                    renderItem={({ item }) => renderMatchHistoryItem(item)}
                    keyExtractor={(item) => `match-${item.game}`} // Ensure keys are unique
                    contentContainerStyle={styles.historyList}
                    showsVerticalScrollIndicator={false}
                  />
                  <TouchableOpacity style={styles.showHistoryButton}>
                    <Text style={styles.showHistoryButtonText}>
                      Show Match History
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMatchModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {console.log("Modal opened")}

            {/* Match Header */}
            <View style={styles.matchHeader}>
              <Text style={styles.modalTitle}>
                <Icon name="trophy" size={24} color="#007AFF" />
                {` ${selectedMatch?.teamA || "Team A"} vs ${
                  selectedMatch?.teamB || "Team B"
                }`}
              </Text>
              {console.log(
                `Match Header: ${selectedMatch?.teamA || "Team A"} vs ${
                  selectedMatch?.teamB || "Team B"
                }`
              )}
            </View>

            {/* Tournament Information */}
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentInfoText}>
                {`Tournament Type: ${tournamentType || "N/A"}`}
              </Text>
              <Text style={styles.tournamentInfoText}>
                {`Match Type: ${matchType || "N/A"}`}
              </Text>
              <Text style={styles.tournamentInfoText}>
                {`Number of Sets: ${numOfSets || "N/A"}`}
              </Text>
              {console.log(
                `Tournament Type: ${tournamentType || "N/A"}, Match Type: ${
                  matchType || "N/A"
                }, Number of Sets: ${numOfSets || "N/A"}`
              )}
            </View>

            {/* Scoreboard */}
            <View style={styles.scoreboard}>
              <Text style={styles.scoreboardTitle}>Match Scoreboard</Text>

              {/* Header Row */}
              <View style={styles.scoreboardHeaderRow}>
                <Text style={styles.headerCell}>Teams</Text>
                <Text style={styles.headerCell}>Points</Text>
                <Text style={styles.headerCell}>Controls</Text>
              </View>

              {/* Team A Row */}
              <View style={styles.scoreboardRow}>
                <Text style={styles.teamCell}>
                  {selectedMatch?.teamA || "Team A"}
                </Text>
                <Text style={styles.scoreCell}>{scoreTeamA}</Text>
                <View style={styles.controlsCell}>
                  <TouchableOpacity
                    style={styles.pointButton}
                    onPress={addPointsTeamA}
                  >
                    <Icon name="plus" size={20} color="#28a745" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pointButton}
                    onPress={decrementPointsTeamA}
                  >
                    <Icon name="minus" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
                {console.log(`Team A Score: ${scoreTeamA}`)}
              </View>

              {/* Team B Row */}
              <View style={styles.scoreboardRow}>
                <Text style={styles.teamCell}>
                  {selectedMatch?.teamB || "Team B"}
                </Text>
                <Text style={styles.scoreCell}>{scoreTeamB}</Text>
                <View style={styles.controlsCell}>
                  <TouchableOpacity
                    style={styles.pointButton}
                    onPress={addPointsTeamB}
                  >
                    <Icon name="plus" size={20} color="#28a745" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pointButton}
                    onPress={decrementPointsTeamB}
                  >
                    <Icon name="minus" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
                {console.log(`Team B Score: ${scoreTeamB}`)}
              </View>
            </View>

            {/* Set and Match Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.button} onPress={handleSetEnd}>
                <Text style={styles.buttonText}>End Set</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleMatchEnd}>
                <Text style={styles.buttonText}>End Match</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeMatchModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMatchHistoryVisible}
      >
        <View style={matchHistoryStyles.modalOverlay}>
          <View style={matchHistoryStyles.modalContent}>
            {/* Modal Title */}
            <Text style={matchHistoryStyles.modalTitle}>Match History</Text>

            {/* Match History List */}
            <FlatList
              data={matchHistory}
              renderItem={({ item }) => renderMatchHistoryItem(item)}
              keyExtractor={(item) => `history-${item.id}`} // Unique key for each history item
            />

            {/* Close Button */}
            <TouchableOpacity style={matchHistoryStyles.closeButton}>
              <Text style={matchHistoryStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const matchHistoryStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 15,
  },
  filterSection: {
    marginBottom: 15,
  },
  sortSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  matchHistoryContainer: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  matchDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  matchDetailLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    padding: 5,
  },
  matchDetailValue: {
    flex: 1,
    fontSize: 16,
    padding: 5,
  },
  setDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  setDetailText: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});

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
  ...matchHistoryStyles,
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
  buttonHover: {
    opacity: 0.8, // Slightly transparent on hover
  },
  buttonActive: {
    transform: [{ scale: 0.95 }], // Slightly scale down on press
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
    elevation: 8, // Increased shadow for a floating effect
    maxHeight: "80%",
    position: "relative",
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  scoreboard: {
    marginVertical: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  scoreboardHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 2,
    borderBottomColor: "#dee2e6",
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#495057",
  },
  scoreboardRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingVertical: 12,
    alignItems: "center",
  },
  teamCell: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingLeft: 12,
    color: "#2c3e50",
  },
  scoreCell: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007bff",
  },
  controlsCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pointButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginHorizontal: 4,
  },
  tournamentInfo: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f8f8f8", // Background color for better visibility
    borderRadius: 5,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  tournamentInfoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  setsHistory: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#007bff", // Consistent border color
    borderRadius: 8,
    backgroundColor: "#f9f9f9", // Slightly off-white for sets history
  },
  winnerText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
    color: "#155724", // Dark green for winner text
    padding: 16,
    backgroundColor: "#d4edda", // Light green background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c3e6cb", // Light green border
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  historyTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 5,
  },
  historyHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  historyHeaderCell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  historyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  historyCell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
  },
  historyText: {
    textAlign: "center",
    color: "#888",
  },
  matchControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  endSetButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
    elevation: 4, // Increased elevation for emphasis
    transition: "background-color 0.3s ease", // Smooth transition
  },
  endMatchButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
    elevation: 4, // Increased elevation for emphasis
    transition: "background-color 0.3s ease", // Smooth transition
  },
  closeButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
    elevation: 4, // Increased elevation for emphasis
    transition: "background-color 0.3s ease", // Smooth transition
  },
  buttonText: {
    color: "#ffffff", // White text for all buttons
    fontSize: 16,
    fontWeight: "bold",
  },
  winnerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
    color: "#28a745",
    padding: 16,
    backgroundColor: "#d4edda",
    borderRadius: 8,
  },
  addPointsControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  teamControls: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  addPointsButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginVertical: 4,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "center",
  },
  addPointsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  teamScoreContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  currentScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2c3e50",
    marginVertical: 8,
  },
  teamLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  iconContainer: {
    marginRight: 8,
  },
  setsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  setLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  teamPoints: {
    fontSize: 16,
    color: "#007AFF",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "gray",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});

export default ViewTournament;
