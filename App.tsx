import React from 'react';
     import { NavigationContainer } from '@react-navigation/native';
     import AppNavigator from './src/navigation/AppNavigator';
     import { BackendProvider } from './src/context/BackendContext';

     export default function App() {
       return (
         <BackendProvider>
           <NavigationContainer>
             <AppNavigator />
           </NavigationContainer>
         </BackendProvider>
       );
     }