import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { Card } from "react-native-paper"; // Ensure you install react-native-paper
import tennis from "./Images/tennis.jpeg";
import banner from "./Images/banner-img.jpeg";
import basketball from "./Images/basketball.jpeg";
import football from "./Images/football.jpeg"; // Corrected file extension
import cri from "./Images/cri.jpg";
import FooterMenu from "./FooterMenu";
import TopMenu from "./TopMenu";

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopMenu />
      <ScrollView>
        <View style={styles.bannerContainer}>
          <Image source={banner} style={styles.bannerImage} />
        </View>

        <View style={styles.cardContainer}>
          <Card style={styles.card}>
            <Card.Cover source={football} />
            <Card.Title title="Football" />
          </Card>
          <Card style={styles.card}>
            <Card.Cover source={basketball} />
            <Card.Title title="Basketball" />
          </Card>
          <Card style={styles.card}>
            <Card.Cover source={cri} />
            <Card.Title title="Cricket" />
          </Card>
          <Card style={styles.card}>
            <Card.Cover source={tennis} />
            <Card.Title title="Tennis" />
          </Card>
        </View>
      </ScrollView>
      <FooterMenu navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bannerContainer: {
    height: 300,
    justifyContent: "flex-end",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  bannerTextContainer: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    alignItems: "center",
  },
  bannerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  card: {
    width: "45%",
    marginBottom: 20,
  },
});

export default Home;
