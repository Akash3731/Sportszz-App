import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome'; // Import your desired icon set

const FooterMenu = ({ navigation }) => {
  const handleNavigation = (screen) => {
    navigation.navigate(screen); // Navigate to the selected screen
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity onPress={() => handleNavigation('Sport')} style={styles.footerItem}>
        <Icon name="futbol-o" size={20} color="white" />
        <Text style={styles.footerText}>Sport</Text> 
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigation('Club')} style={styles.footerItem}>
        <Icon name="building" size={20} color="white" /> 
        <Text style={styles.footerText}>Club</Text> 
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigation('Event')} style={styles.footerItem}>
        <Icon name="calendar" size={20} color="white" />
        <Text style={styles.footerText}>Event</Text> 
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigation('Tournament')} style={styles.footerItem}>
        <Icon name="trophy" size={20} color="white" /> 
        <Text style={styles.footerText}>Tournament</Text> 
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigation('Blog')} style={styles.footerItem}>
        <Icon name="pencil" size={20} color="white" /> 
        <Text style={styles.footerText}>Blog</Text> 
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#333', // Background color of the footer
  },
  footerItem: {
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 16,
  },
});

export default FooterMenu;

