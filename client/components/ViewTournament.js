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
import config from "./config";
import { Svg, Line, Text as SvgText, G, Rect } from "react-native-svg";
import RNPickerSelect from "react-native-picker-select";

const ViewTournament = () => {
  const [managerId, setManagerId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMatchHistoryVisible, setMatchHistoryVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreTeamA, setScoreTeamA] = useState(0);
  const [scoreTeamB, setScoreTeamB] = useState(0);
  const [teams, setTeams] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [setCount, setSetCount] = useState(1);
  const [setScoreA, setSetScoreA] = useState([0, 0, 0, 0, 0]);
  const [setScoreB, setSetScoreB] = useState([0, 0, 0, 0, 0]);
  const [winners, setWinners] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
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

  const getMatchStatus = (match) => {
    if (match.teamA === "BYE" || match.teamB === "BYE") return "bye";
    if (match.winner) return "completed";
    if (
      selectedMatch?.teamA === match.teamA &&
      selectedMatch?.teamB === match.teamB
    )
      return "inProgress";
    return "pending";
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
                  const matchStatus = getMatchStatus(match); // This should work now

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
                      ? "#d1e7dd"
                      : "#f8d7da"
                    : "#ffffff";

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

  // Expedition Bracket (Combination of Round Robin + Single Elimination)
  const renderExpeditionBracket = () => {
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

  // Reset scores for the next set
  const resetScores = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
  };

  // Score update function for singles match
  const handleScoreUpdate = (team) => {
    if (team === "A") {
      // Increment score for Team A
      setScoreTeamA((prev) => prev + 1);

      // Check if Team A has won the set
      if (scoreTeamA >= 11 && scoreTeamA - scoreTeamB >= 2) {
        handleSetWin("A");
      }
    } else if (team === "B") {
      // Increment score for Team B
      setScoreTeamB((prev) => prev + 1);

      // Check if Team B has won the set
      if (scoreTeamB >= 11 && scoreTeamB - scoreTeamA >= 2) {
        handleSetWin("B");
      }
    }
  };

  // Handle set win for singles
  const handleSetWin = (winningTeam) => {
    if (winningTeam === "A") {
      setScoreA((prev) => {
        const newScore = [...prev, scoreTeamA];
        resetScores(); // Reset scores for the next set
        return newScore;
      });
    } else if (winningTeam === "B") {
      setScoreB((prev) => {
        const newScore = [...prev, scoreTeamB];
        resetScores(); // Reset scores for the next set
        return newScore;
      });
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

  const closeMatchModal = () => {
    setModalVisible(false);
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

  const handleMatchCompletion = (winningTeam, losingTeam) => {
    if (tournamentType === "Round Robin") {
      updateRoundRobinResults(winningTeam, losingTeam);
    } else if (tournamentType === "Single Elimination") {
      handleSingleEliminationProgress(winningTeam);
    }

    // Add winner to the winners array (store as a string)
    setWinners((prev) => {
      const updatedWinners = [...prev, winningTeam.name]; // Store only the name
      console.log("Updated Winners Array:", updatedWinners);
      return updatedWinners;
    });

    // Add to match history
    setMatchHistory((prev) => {
      const newMatchHistory = [
        ...prev,
        {
          teamA: selectedMatch.teamA,
          teamB: selectedMatch.teamB,
          sets: [
            // Initialize sets as an array
            {
              scoreA: scoreTeamA,
              scoreB: scoreTeamB,
              winner: winningTeam.name,
            },
          ],
        },
      ];
      console.log("Updated Match History:", newMatchHistory);
      return newMatchHistory;
    });

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

    // Find the index of the current match in the round
    const matchIndex = currentRoundMatches.findIndex(
      (match) =>
        match.teamA === selectedMatch.teamA &&
        match.teamB === selectedMatch.teamB
    );

    // Update the winner in the current match
    currentRoundMatches[matchIndex].winner = winner.name;

    // If there's a next round, update the advancing team
    if (currentRound < updatedBrackets.length) {
      const nextRoundIndex = Math.floor(matchIndex / 2);
      const isFirstTeam = matchIndex % 2 === 0;
      const nextRoundMatch = updatedBrackets[currentRound][nextRoundIndex];

      // Assign the winning team to the correct slot in the next round
      if (isFirstTeam) {
        nextRoundMatch.teamA = winner.name;
      } else {
        nextRoundMatch.teamB = winner.name;
      }
    }

    setBrackets(updatedBrackets); // Update the state with the modified brackets
  };

  const checkRoundCompletion = () => {
    const matchesPerRound =
      tournamentType === "Round Robin"
        ? (teams.length * (teams.length - 1)) / 2
        : Math.floor(teams.length / Math.pow(2, currentRound - 1));

    if (currentMatch > matchesPerRound) {
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

  const renderWinners = () => {
    return winners.map((winner, index) => (
      <Text key={index} style={styles.winnerText}>
        {winner}
      </Text>
    ));
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupContainer}
      onPress={() => fetchTeams(item._id)}
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
      case "Expedition":
        return renderExpeditionBracket();
      default:
        return renderSingleEliminationBracket();
    }
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

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Match Type:</Text>
                  <RNPickerSelect
                    onValueChange={(value) => setMatchType(value)}
                    items={[
                      { label: "Singles (Best of 7)", value: "Singles" },
                      { label: "Team (4 Singles + 1 Doubles)", value: "Team" },
                    ]}
                    style={pickerSelectStyles}
                    placeholder={{
                      label: "Select a match type...",
                      value: null,
                    }}
                    value={matchType}
                  />
                </View>
              </View>

              <View style={styles.bracketContainer}>
                <Text style={styles.title}>Tournament Bracket</Text>
                {renderBracket()}
              </View>

              <View style={styles.matchupsSection}>
                <Text style={styles.title}>Current Matchups:</Text>
                <FlatList
                  data={brackets[0]} // Get the first round of matches dynamically
                  renderItem={({ item }) => renderMatchup(item)} // Pass the entire match object
                  keyExtractor={(item) => `${item.teamA}-${item.teamB}`} // Use team names as key
                  contentContainerStyle={styles.matchupList}
                  showsVerticalScrollIndicator={false}
                />
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleMatchStart}
                >
                  <Text style={styles.startButtonText}>Start Match</Text>
                </TouchableOpacity>
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
            {renderWinners()}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
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
  noSetsText: {
    fontStyle: "italic",
    color: "#999",
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
  historyButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  historyButtonText: {
    color: "white",
    textAlign: "center",
  },
  setDetails: {
    fontSize: 14,
    marginLeft: 10,
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
