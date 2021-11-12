// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// External/Third party dependencies
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
} from 'react-native';
// Internal dependencies
import { Orderbook } from "@orderbook/screens";
import { Colors } from "@orderbook/theme";

const App = () => {

  const backgroundStyle = {
    flex: 1,
    backgroundColor: Colors.primary
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={'light-content'} />
      <Orderbook/>
    </SafeAreaView>
  );
};

export default App;
