
import React from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import AIScreen from './AIScreen';
import HomeIcon from '../components/icons/home'
import ProfileIcon from '../components/icons/profile'
import AIIcon from '../components/icons/ai'
// Define the type for the tab bar and renderCircle props
type TabBarProps = {
  routeName: string;
  selectedTab: string;
  navigate: (name: string) => void;
};

const MainPageScreen = () => {
  const _renderIcon = (routeName: string, selectedTab: string) => {
    const size = 25;
    let color = routeName === selectedTab ? '#1800ad' : '#6c757d';
    console.log('---------------');
    console.log(color);
    console.log(routeName);
    console.log(selectedTab);
    console.log( routeName === selectedTab);
    console.log('---------------');

    switch (routeName) {
      case 'AI':
        return <AIIcon color={color} height={size} width={size} />;
      case 'Home':
        return <HomeIcon color={color} height={size} width={size} />;
      case 'Profile':
        return <ProfileIcon color={color} height={size} width={size} />;
      default:
        return null;
    }

  };

  const renderTabBar = ({ routeName, selectedTab, navigate }: TabBarProps) => {
    return (
      <TouchableOpacity
        onPress={() => navigate(routeName)}
        style={styles.tabbarItem}
      >
        {_renderIcon(routeName, selectedTab)}
      </TouchableOpacity>
    );
  };

  const renderCircle = ({ selectedTab, navigate }: TabBarProps) => (
    <Animated.View style={styles.btnCircle}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigate('Home')}
      >
        {_renderIcon('Home', selectedTab)}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
      <CurvedBottomBarExpo.Navigator
        id="curved-bottom-navigator"
        type="DOWN"
        style={styles.bottomBar}
        shadowStyle={styles.shadow}
        height={60}
        circleWidth={55}
        bgColor="white"
        borderColor="#E8E8E8"
        borderWidth={1}
        width={undefined}
        initialRouteName="Home"
        borderTopLeftRight={true}
        circlePosition="CENTER"
        renderCircle={renderCircle}
        tabBar={renderTabBar}
        backBehavior="history"
        screenListeners={undefined}
        screenOptions={{ headerShown: false }}
        defaultScreenOptions={undefined}
      >
        <CurvedBottomBarExpo.Screen
          name="AI"
          position="LEFT"
          component={AIScreen}
        />
        <CurvedBottomBarExpo.Screen
          name="Home"
          position="CIRCLE"
          component={HomeScreen}
        />
        <CurvedBottomBarExpo.Screen
          name="Profile"
          position="RIGHT"
          component={ProfileScreen}
        />
      </CurvedBottomBarExpo.Navigator>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomBar: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  btnCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
    bottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 1,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainPageScreen;