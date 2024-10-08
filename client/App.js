import React, { useEffect, createRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { AuthProvider } from "./Context/authContext";

// Import your components
import RegistrationForm from "./components/RegistationForm";
import Login from "./components/LoginForm";
import Home from "./components/Home";
import Blog from "./Screens/Blog";
import Club from "./Screens/Club";
import Event from "./Screens/Event";
import Sport from "./Screens/Sport";
import Tournament from "./Screens/Tournment";
import ManagerLogin from "./components/ManagerLogin";
import ManagerDashboard from "./components/ManagerDashboard";
import ManageTeams from "./components/ManageTeams";
import ViewTournament from "./components/ViewTournament";

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f4511e" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export const navigationRef = createRef();

const Stack = createStackNavigator();

// Define linking configuration
const linking = {
  prefixes: [
    "sportszz://",
    "https://sportszz.com",
    // Add development prefix for testing in Expo Go
    Linking.createURL("/"),
  ],
  config: {
    initialRouteName: "Register",
    screens: {
      Register: {
        path: "register",
      },
      ManagerLogin: {
        path: "manager-login",
      },
      Login: {
        path: "login",
      },
      Home: {
        path: "home",
      },
      Blog: {
        path: "blog/:id?",
        parse: {
          id: (id) => `${id}`,
        },
      },
      Club: {
        path: "club/:id?",
        parse: {
          id: (id) => `${id}`,
        },
      },
      Event: {
        path: "event/:id?",
        parse: {
          id: (id) => `${id}`,
        },
      },
      Sport: {
        path: "sport/:id?",
        parse: {
          id: (id) => `${id}`,
        },
      },
      Tournament: {
        path: "tournament/:id?",
        parse: {
          id: (id) => `${id}`,
        },
      },
    },
  },
  // Add custom configuration for deep link handling
  async getInitialURL() {
    // First, check if the app was opened via a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // If no deep link was used, return null
    return null;
  },
  // Add a custom handler for subscription
  subscribe(listener) {
    const onReceiveURL = ({ url }) => listener(url);

    // Listen to incoming deep links
    const eventListener = Linking.addEventListener("url", onReceiveURL);

    return () => {
      // Clean up the event listener
      eventListener.remove();
    };
  },
};

export default function App() {
  useEffect(() => {
    // Log Hermes status
    console.log(`Hermes enabled: ${!!global.HermesInternal}`);

    // Handle deep links while the app is running
    const handleDeepLink = (event) => {
      if (event?.url) {
        console.log("Deep link handled:", event.url);
      }
    };

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Initial URL:", url);
      }
    });

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      // Clean up subscription
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        fallback={<LoadingScreen />}
        documentTitle={{
          formatter: (options, route) =>
            `${options?.title ?? route?.name} - Sportszz`,
        }}
      >
        <Stack.Navigator
          initialRouteName="Register"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#f4511e",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Register"
            component={RegistrationForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManagerLogin"
            component={ManagerLogin}
            options={{ title: "Manager Login" }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Blog"
            component={Blog}
            options={{ title: "Blog" }}
          />
          <Stack.Screen
            name="Club"
            component={Club}
            options={{ title: "Club" }}
          />
          <Stack.Screen
            name="Event"
            component={Event}
            options={{ title: "Event" }}
          />
          <Stack.Screen
            name="Sport"
            component={Sport}
            options={{ title: "Sport" }}
          />
          <Stack.Screen
            name="Tournament"
            component={Tournament}
            options={{ title: "Tournament" }}
          />
          <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
          <Stack.Screen name="ManageTeams" component={ManageTeams} />
          <Stack.Screen name="ViewTournament" component={ViewTournament} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
