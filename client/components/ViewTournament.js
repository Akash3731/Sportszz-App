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
  const [winners, setWinners] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [matchType, setMatchType] = useState(null);
  const [tournamentType, setTournamentType] = useState("Single Elimination");
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
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [setHistory, setSetHistory] = useState([]);
  const [currentSet, setCurrentSet] = useState(1);
  const [setScores, setSetScores] = useState([]);
  const [filterByTeam, setFilterByTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState("date");
  const [filteredMatchHistory, setFilteredMatchHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const groupsResponse = await fetch(
          `${config.backendUrl}/groups/${managerId}`
        );
        const teamsResponse = await fetch(
          `${config.backendUrl}/teams/${managerId}`
        );
        const matchHistoryResponse = await fetch(
          `${config.backendUrl}/matchHistory/${managerId}`
        );

        const groupsData = await groupsResponse.json();
        const teamsData = await teamsResponse.json();
        const matchHistoryData = await matchHistoryResponse.json();

        setGroups(groupsData);
        setTeams(teamsData);
        setMatchHistory(matchHistoryData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filteredData = matchHistory;

    // Filter by team
    if (filterByTeam) {
      filteredData = filteredData.filter(
        (match) => match.teamA === filterByTeam || match.teamB === filterByTeam
      );
    }

    // Filter by search query
    if (searchQuery) {
      filteredData = filteredData.filter((match) =>
        `${match.teamA} vs ${match.teamB}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMatchHistory(filteredData);
  }, [matchHistory, searchQuery, filterByTeam]);

  // Function to open the match history modal
  const showMatchHistory = () => {
    setMatchHistoryVisible(true);
  };

  // Function to close the match history modal
  const closeMatchHistoryModal = () => {
    setMatchHistoryVisible(false);
  };

  // Handle timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

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

  // Handle ending a match within a team format
  const handleMatchEnd = () => {
    if (matchType === "Team" && currentMatch < 5) {
      // Progress to the next match in a team format
      setCurrentMatch((prev) => prev + 1);
      setMatchHistory((prev) => [
        ...prev,
        { matchNumber: currentMatch, winner: matchWinner },
      ]);
      resetMatch(); // Resets for the next match
    } else if (matchType === "Team" && currentMatch === 5) {
      // End the team match after 5 matches
      Alert.alert("Team Match Over", "Team match has concluded.");
      closeMatchModal(); // Close the modal after the team match concludes
    } else {
      // For singles, handle the end of the match
      if (setScoreA.length >= Math.ceil(numOfSets / 2)) {
        setMatchWinner("A");
        Alert.alert("Match Over", `${selectedMatch?.teamA} wins the match!`);
      } else if (setScoreB.length >= Math.ceil(numOfSets / 2)) {
        setMatchWinner("B");
        Alert.alert("Match Over", `${selectedMatch?.teamB} wins the match!`);
      }
    }
  };

  const resetScores = () => {
    setScoreTeamA(0);
    setScoreTeamB(0);
  };

  const handleScoreUpdate = (team) => {
    if (team === "A") {
      setScoreTeamA((prev) => prev + 1);
      if (scoreTeamA >= 10 && scoreTeamA - scoreTeamB >= 2) {
        handleSetWin("A");
      }
    } else if (team === "B") {
      setScoreTeamB((prev) => prev + 1);
      if (scoreTeamB >= 10 && scoreTeamB - scoreTeamA >= 2) {
        handleSetWin("B");
      }
    }
  };

  const handleSetWin = (winningTeam) => {
    if (winningTeam === "A") {
      setSetScoreA((prev) => [...prev, scoreTeamA]);
    } else {
      setSetScoreB((prev) => [...prev, scoreTeamB]);
    }
    resetScores(); // Reset scores for the next set
    setSetCount((prev) => Math.min(prev + 1, numOfSets)); // Limit to max of selected sets
    checkMatchEnd();
    Alert.alert(
      "Set Ended",
      `${
        winningTeam === "A" ? selectedMatch.teamA : selectedMatch.teamB
      } wins the set!`
    );
  };

  // Handle end of set
  const handleSetEnd = () => {
    // Check if one team has won the set
    if (scoreTeamA >= 11 && scoreTeamA - scoreTeamB >= 2) {
      setSetScoreA((prev) => [...prev, 1]); // Record a set win for Team A
      setSetHistory((prev) => [
        ...prev,
        { set: currentSet, scoreA: scoreTeamA, scoreB: scoreTeamB },
      ]);
      resetScores(); // Reset team scores for the next set
      setCurrentSet((prev) => prev + 1); // Move to the next set
    } else if (scoreTeamB >= 11 && scoreTeamB - scoreTeamA >= 2) {
      setSetScoreB((prev) => [...prev, 1]); // Record a set win for Team B
      setSetHistory((prev) => [
        ...prev,
        { set: currentSet, scoreA: scoreTeamA, scoreB: scoreTeamB },
      ]);
      resetScores(); // Reset team scores for the next set
      setCurrentSet((prev) => prev + 1); // Move to the next set
    } else {
      Alert.alert(
        "Error",
        "Set cannot end yet. Ensure a player has at least 11 points and a 2-point lead."
      );
      return; // Exit the function if set cannot end
    }

    // Check if the match is over
    if (setScoreA.length >= Math.ceil(numOfSets / 2)) {
      setMatchWinner("A");
      Alert.alert("Match Over", `${selectedMatch?.teamA} wins the match!`);
    } else if (setScoreB.length >= Math.ceil(numOfSets / 2)) {
      setMatchWinner("B");
      Alert.alert("Match Over", `${selectedMatch?.teamB} wins the match!`);
    }
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
    setTimer(0);
    setIsRunning(false);
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

  const checkMatchEnd = () => {
    const totalSetsA = setScoreA.length; // Use the renamed variable
    const totalSetsB = setScoreB.length; // Use the renamed variable

    if (totalSetsA >= Math.ceil(numOfSets / 2)) {
      Alert.alert("Match Over", `${selectedMatch.teamA} wins the match!`);
      closeMatchModal();
    } else if (totalSetsB >= Math.ceil(numOfSets / 2)) {
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

  // const renderWinners = () => {
  //   return winners.map((winner, index) => (
  //     <Text key={index} style={styles.winnerText}>
  //       {winner}
  //     </Text>
  //   ));
  // };

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

                <View style={styles.matchHistorySection}>
                  <Text style={styles.title}>Match History:</Text>
                  <FlatList
                    data={matchHistory} // Replace with your match history data
                    renderItem={({ item }) => renderMatchHistoryItem(item)} // Pass the match history item
                    keyExtractor={(item) => `match-${item.game}`} // Use game number as key
                    contentContainerStyle={styles.historyList}
                    showsVerticalScrollIndicator={false}
                  />
                  <TouchableOpacity
                    style={styles.showHistoryButton}
                    onPress={showMatchHistory} // Function to show match history modal
                  >
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
            {/* Match Header */}
            <View style={styles.matchHeader}>
              <Text style={styles.modalTitle}>
                <Icon name="trophy" size={24} color="#007AFF" />
                {` ${selectedMatch?.teamA} vs ${selectedMatch?.teamB}`}
              </Text>
            </View>

            {/* Sets Configuration */}
            <View style={styles.setsConfig}>
              <Text style={styles.sectionTitle}>Match Configuration</Text>
              <RNPickerSelect
                onValueChange={(value) => setNumOfSets(value)}
                items={[
                  { label: "Best of 3 Sets", value: 3 },
                  { label: "Best of 5 Sets", value: 5 },
                  { label: "Best of 7 Sets", value: 7 },
                ]}
                value={numOfSets}
                style={pickerSelectStyles}
                placeholder={{ label: "Select number of sets", value: null }}
              />
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
                <Text style={styles.teamCell}>{selectedMatch?.teamA}</Text>
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
              </View>

              {/* Team B Row */}
              <View style={styles.scoreboardRow}>
                <Text style={styles.teamCell}>{selectedMatch?.teamB}</Text>
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
              </View>
            </View>

            {/* Sets History */}
            <View style={styles.setsHistory}>
              <Text style={styles.sectionTitle}>Sets History</Text>
              {setHistory.length > 0 ? (
                <View style={styles.historyTable}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyHeaderCell}>Set</Text>
                    <Text style={styles.historyHeaderCell}>
                      {selectedMatch?.teamA}
                    </Text>
                    <Text style={styles.historyHeaderCell}>
                      {selectedMatch?.teamB}
                    </Text>
                  </View>
                  {setHistory.map((set, index) => (
                    <View key={index} style={styles.historyRow}>
                      <Text style={styles.historyCell}>Set {set.set}</Text>
                      <Text style={styles.historyCell}>{set.scoreA}</Text>
                      <Text style={styles.historyCell}>{set.scoreB}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noHistoryText}>No sets completed yet</Text>
              )}
            </View>

            {/* Match Controls */}
            <View style={styles.matchControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.endSetButton]}
                onPress={handleSetEnd}
              >
                <Icon name="flag-checkered" size={16} color="#fff" />
                <Text style={styles.buttonText}>End Set</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={resetMatch}
              >
                <Icon name="refresh" size={16} color="#fff" />
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.closeButton]}
                onPress={closeMatchModal}
              >
                <Icon name="times" size={16} color="#fff" />
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {matchWinner && (
              <View style={styles.winnerBanner}>
                <Icon name="trophy" size={24} color="#FFD700" />
                <Text style={styles.winnerText}>
                  Winner:{" "}
                  {matchWinner === "A"
                    ? selectedMatch?.teamA
                    : selectedMatch?.teamB}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMatchHistoryVisible}
        onRequestClose={closeMatchHistoryModal}
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
            <TouchableOpacity
              style={matchHistoryStyles.closeButton}
              onPress={closeMatchHistoryModal}
            >
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
    position: "relative",
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
  setsHistory: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
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
  noHistoryText: {
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
    flex: 1,
    alignItems: "center",
    marginRight: 8,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
    elevation: 2,
  },
  closeButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
