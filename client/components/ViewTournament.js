import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import config from "./config"; // Adjust the import path according to your project structure

// Mock tournament diagram
const ViewTournament = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch first manager ID
  const fetchManagerId = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/managers/first`); // Use config.backendUrl
      const data = await response.json();
      if (data._id) {
        fetchGroups(data._id);
      }
    } catch (error) {
      console.error("Error fetching manager ID:", error);
      setLoading(false);
    }
  };

  // Fetch groups for the manager
  const fetchGroups = async (managerId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/managers/${managerId}/groups`
      ); // Use config.backendUrl
      const data = await response.json();
      const groupsWithTeams = await Promise.all(
        data.map(async (group) => {
          const teams = await fetchTeams(managerId, group._id);
          return { ...group, teams };
        })
      );
      setGroups(groupsWithTeams);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setLoading(false);
    }
  };

  // Fetch teams in a group
  const fetchTeams = async (managerId, groupId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams`
      ); // Use config.backendUrl
      return await response.json();
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  };

  // Fetch players in a team
  const fetchPlayers = async (managerId, groupId, teamId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/managers/${managerId}/groups/${groupId}/teams/${teamId}/players`
      ); // Use config.backendUrl
      return await response.json();
    } catch (error) {
      console.error("Error fetching players:", error);
      return [];
    }
  };

  // Effect to fetch manager ID on mount
  useEffect(() => {
    fetchManagerId();
  }, []);

  // Render Players
  const renderPlayers = (players) => {
    return players.map((player) => (
      <View key={player._id} style={styles.playerCard}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>
      </View>
    ));
  };

  // Render Teams within a Group
  const renderTeams = (teams, managerId, groupId) => {
    return teams.map(async (team) => {
      const players = await fetchPlayers(managerId, groupId, team._id);
      return (
        <View key={team._id} style={styles.teamCard}>
          <Text style={styles.teamName}>{team.name}</Text>
          <View style={styles.playersContainer}>{renderPlayers(players)}</View>
        </View>
      );
    });
  };

  // Render Groups as Tournament Columns
  const renderGroups = () => {
    return groups.map((group) => (
      <View key={group._id} style={styles.groupColumn}>
        <Text style={styles.groupName}>{group.name}</Text>
        <View style={styles.teamsContainer}>
          {renderTeams(group.teams, group.managerId, group._id)}
        </View>
      </View>
    ));
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} horizontal={true}>
      <Text style={styles.tournamentTitle}>Tournament Bracket</Text>
      <View style={styles.tournamentDiagram}>{renderGroups()}</View>
    </ScrollView>
  );
};

// Styles for Tournament Diagram
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F8F8F8",
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  tournamentDiagram: {
    flexDirection: "row", // Place groups side by side like columns
    justifyContent: "space-evenly",
  },
  groupColumn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  teamsContainer: {
    flexDirection: "column", // Teams are stacked vertically within a group
    justifyContent: "space-between",
  },
  teamCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  playersContainer: {
    borderTopWidth: 1,
    borderTopColor: "#C6C6C8",
    paddingTop: 8,
    width: "100%",
  },
  playerCard: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  playerPosition: {
    fontSize: 12,
    color: "#8E8E93",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ViewTournament;
