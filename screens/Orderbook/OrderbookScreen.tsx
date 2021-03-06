// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// External/Third party dependencies
import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  FlatList,
  AppState,
  AppStateStatus
} from 'react-native';
// Internal dependencies
import Label from "@orderbook/label";
import Button from "@orderbook/button";
import OrderListItem from "@orderbook/order-list-item";
import { Colors, Variables } from "@orderbook/theme";
import { OrderbookService } from "@orderbook/services";
import Orientation, { useOrientationChange, OrientationType  as RNOrientationType} from 'react-native-orientation-locker';
import { OrientationType, RenderItem, RenderableOrderItem, Order, Crypto } from "./models";
import { sortAscending, sortDescending } from "@orderbook/utils";

// Height of each single order line
const ITEM_HEIGHT = Variables.lineItemHeight;

// Default order state
const INITIAL_STATE = {
  bids: new Map<String, Order>(),
  asks: new Map<String, Order>(),
  totalBids: 0,
  totalAsks: 0,
  spread: 0,
  percentage: 0
};

// Function to handle bids and asks orders when a delta message is received
const ordersHandler = (orders: any[], order: any[]) => {
  const orderIndex = orders.findIndex(o => o[0] === order[0]);
  if (orderIndex < 0) {
    if (order[1] > 0) {
      // Add a new order if it's a new order and the size is greater then 0
      orders.push(order);
    }
  } else {
    if (order[1] === 0) {
      // Remove the order if size is 0
      orders.splice(orderIndex, 1);
    } else {
      // Overwrite the previous size of the order if its size is not null and was already in the list 
      orders[orderIndex][1] = order[1];
    }
  }
};

// Function to populate bids and asks into a map with the price as key.
// Furthermore the total of orders is calculated
const populateMap = (orders: any[]) => {
  const ordersMap = new Map<String, Order>();
  let total = 0;
  orders.forEach((order: any[]) => {
    const key = order[0].toString();
    total += order[1];
    ordersMap.set(key, { price: order[0], size: order[1], total });
  });
  return { ordersMap, total };
};

// Function to be called whever a render trigger is desired
const prepareDataToBeRendered = (bids: any[] = [], asks: any[] = []) => {
  let spread = 0, percentage = 0;
  // Sort bids by descending price to calculate the total of bids orders
  bids.sort((item1, item2) => sortDescending(item1[0], item2[0]));
  // Sort asks by ascending price to calculate the total of asks orders
  asks.sort((item1, item2) => sortAscending(item1[0], item2[0]));

  if (bids.length > 0 && asks.length > 0) {
    // Calculate the spread as difference between the lowest ask price and the highest bid price 
    spread = asks[0][0] - bids[0][0];
    // Calculate the spread percentage as spread divided by the highest bid price in percentage
    percentage = (spread / bids[0][0]) * 100;
    percentage = Math.round(percentage * 100) / 100;
  }
  // Populate the ordersMaps and the totals
  const { ordersMap: bidsMap, total: totalBids } = populateMap(bids);
  const { ordersMap: asksMap, total: totalAsks } = populateMap(asks);

  // Dispatch a new order state with which the view can be updated
  return {
    bids: bidsMap,
    asks: asksMap,
    totalBids,
    totalAsks,
    spread,
    percentage
  }
};

function reducer(state: any, values: any) {
  if (values) {
    return { ...state, ...values };
  }
  return state;
}

let orderbookService: OrderbookService = null;

const Orderbook = () => {
  const containerRef = useRef(null);
  const [ordersState, ordersDispatch] = useReducer(reducer, INITIAL_STATE);
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [isWaitingForReconnection, setIsWaitingForReconnection] = useState<Boolean>(false);
  const [crypto, setCrypto] = useState<Crypto>(Crypto.BTC);
  const [orientation, setOrientation] = useState<OrientationType>(Orientation.getInitialOrientation());
  const [errorMessage, setErrorMessage] = useState<String>("");
  const [renderableOrders, setRenderableOrders] = useState<RenderableOrderItem[]>([]);
  const [availableHeight, setAvailableHeight] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timer>();

  // List of bids and asks that are going to be updated whenever the app receives a new message 
  let bids: any[] = [];
  let asks: any[] = [];

  const onAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState.match(/inactive|background/)) {
      orderbookService?.close();
    }
  };

  // Add and remove app state change listener when the component is mounted/unmounted
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => {
      subscription.remove();
    }
  }, []);

  const isLandscape = useCallback((): Boolean => {
    return orientation.startsWith("LANDSCAPE");
  }, [orientation]);

  useOrientationChange((orientation) => {
    setOrientation(orientation);
  });
  
  useEffect(() => {
    // Calculate the available height of the container view as the height of the container
    // minus the height of the "Price, Size, Total" headerbar
    // minus the height of the Spread headerbar if is not in landscape mode
    let newAvailableHeight = availableHeight - Variables.lineItemHeight;
    if (!isLandscape()) {
      newAvailableHeight -= Variables.lineItemHeight;
    }
    // Calculate the number of renderable items
    const renderableItems = Math.trunc((newAvailableHeight / ITEM_HEIGHT) / (isLandscape() ? 1 : 2));
    
    if (renderableItems > 0) {
      let bidsToRender: Order[] = [];
      if (ordersState.bids.size > 0) {
        // Filter bids rendering from the hightest value
        bidsToRender = Array.from(ordersState.bids.values()) as Order[];
        bidsToRender.sort((item1, item2) => sortDescending(item1.price, item2.price))
        bidsToRender = bidsToRender.slice(0, renderableItems);
      }
      let asksToRender: Order[] = [];
      if (ordersState.asks.size > 0) {
        // Filter asks rendering from the hightest value in portrait mode
        // from the lowest in landscape mode
        asksToRender = Array.from(ordersState.asks.values()) as Order[];
        if(!isLandscape()) {
          asksToRender.sort((item1, item2) => sortDescending(item1.price, item2.price))
          asksToRender = asksToRender.slice(-renderableItems);
        } else {
          asksToRender.sort((item1, item2) => sortAscending(item1.price, item2.price))
          asksToRender = asksToRender.slice(0, renderableItems);
        }
      }
      if (bidsToRender?.length > 0 || asksToRender?.length > 0) {
        // Update the view
        setRenderableOrders([
          { title: "Bids", data: bidsToRender },
          { title: "Asks", data: asksToRender }]
        );
      }
    }
  }, [availableHeight, ordersState, setRenderableOrders, isLandscape]);

  // -----------------------------------------------------------------------------
  // ORDERBOOK SERVICE CALLBACKS
  // -----------------------------------------------------------------------------
  const onOpen = useCallback(() => {
    setIsConnected(true);
    setIsWaitingForReconnection(false);
  }, [setIsConnected, setIsWaitingForReconnection]);

  const onClose = useCallback(() => {
    setIsConnected(false);
    setIsWaitingForReconnection(true);
    if (timer) {
      clearInterval(timer);
    }
  }, [setIsConnected, setIsWaitingForReconnection, timer]);

  const onError = useCallback(() => {
    setErrorMessage("Something went wrong");
    setIsWaitingForReconnection(true);
    if (timer) {
      clearInterval(timer);
    }
  }, [setErrorMessage, setIsWaitingForReconnection, timer]);

  // Callback to be called when a new message is received
  const onMessage = useCallback((response: any) => {
    // console.log(response)
    // Populate orders with first snapshot if feed and numLevels are defined
    // Otherwise update the orders from the delta message
    if (response.feed && response.numLevels) {
      bids = response.bids.slice();
      asks = response.asks.slice();
      ordersDispatch(prepareDataToBeRendered(bids, asks));
    } else {
      if (response.bids) {
        response.bids.forEach((bid: any[]) => {
          ordersHandler(bids, bid);
        });
      }
      if (response.asks) {
        response.asks.forEach((ask: any[]) => {
          ordersHandler(asks, ask);
        });
      }
    }
  }, [ordersDispatch]);

  // -----------------------------------------------------------------------------
  // CONNECTIONS HANDLERS
  // -----------------------------------------------------------------------------
  const startConnection = useCallback(() => {
    orderbookService = new OrderbookService(onOpen, onClose, onError, onMessage);

    if (timer) {
      clearInterval(timer);
    }
    setTimer(
      setInterval(() => ordersDispatch(prepareDataToBeRendered(bids, asks)), 1000)
    );
    orderbookService.connect(crypto);
  }, [timer, setTimer]);

  useEffect(() => {
    if (!isWaitingForReconnection) {
      startConnection();
    }
  }, [isWaitingForReconnection]);

  // -----------------------------------------------------------------------------
  // RENDER METHOS
  // -----------------------------------------------------------------------------

  const renderBidItem = ({ item, index }: RenderItem) => {
    const backgroundWidth = (item.total / ordersState.totalBids) * 100;
    const isLandscapeMode = isLandscape();
    return <OrderListItem
      order={item}
      isBid={true}
      barWidth={backgroundWidth}
      isReversedAligned={isLandscapeMode}
    />
  };

  const renderAskItem = ({ item, index }: RenderItem) => {
    const backgroundWidth = (item.total / ordersState.totalAsks) * 100;
    return <OrderListItem
      order={item}
      isBid={false}
      barWidth={backgroundWidth}
      isReversedAligned={false}
    />
  };

  const renderHeader = (isReversedAligned: Boolean) => {
    return <View style={{ ...styles.header, flexDirection: isReversedAligned ? "row-reverse" : "row" }}>
      <Label text={"PRICE"}
        textColor={Colors.divider}
         additionalStyle={styles.headerLabel} />
      <Label text={"SIZE"}
        textColor={Colors.divider} 
        additionalStyle={styles.headerLabel} />
      <Label text={"TOTAL"}
        textColor={Colors.divider}            
        additionalStyle={styles.headerLabel} />
    </View>;
  };

  const renderSpread = () => {
    return <View style={styles.spread}>
      <Label text={`SPREAD ${ordersState.spread} (${ordersState.percentage}%)`} textColor={Colors.divider} />
    </View>;
  };

  const renderOrderBook = () => {
    return (
      <>
        <View style={styles.titleContainer} >
          <Label text="Order Book" additionalStyle={styles.titleItem} />
          {isLandscape() && renderSpread()}
          <View style={styles.titleItem}></View>
        </View>
        <View style={{
          flex: 1,
          marginBottom: Variables.basicUnit * 2,
          flexDirection: orientation.startsWith("LANDSCAPE") ? "row-reverse" : "column"
        }}
          onLayout={(event) => {
            var { x, y, width, height } = event.nativeEvent.layout;
            setAvailableHeight(height);
          }}
          ref={containerRef}>

          <FlatList
            keyExtractor={(item, index) => item.price.toString()}
            ListHeaderComponent={() => renderHeader(false)}
            data={renderableOrders[1]?.data}
            renderItem={renderAskItem}
            scrollEnabled={false}
          />
          {!isLandscape() && renderSpread()}
          <FlatList
            keyExtractor={(item, index) => item.price.toString()}
            ListHeaderComponent={isLandscape() && renderHeader(true)}
            data={renderableOrders[0]?.data}
            renderItem={renderBidItem}
            scrollEnabled={false}
          />
        </View>

        <Button
          text="Toogle Feed"
          onPress={() => {
            orderbookService?.unsubscribe(crypto);
            ordersDispatch(INITIAL_STATE);
            const newCrypto = crypto === Crypto.BTC ? Crypto.ETH : Crypto.BTC
            setCrypto(newCrypto);
            orderbookService?.subscribe(newCrypto);
          }}
        />
      </>);
  };

  const renderReconnectionView = () => {
    return (
      <View style={styles.centerView}>
        <Label text="Connection Lost" />
        {!!errorMessage && <Label text={errorMessage} textColor={Colors.error} />}
        <Button
          text="Reconnect"
          onPress={() => startConnection()}
          />
      </View>);
  };

  const renderProgressView = () => {
    return (
      <View style={styles.centerView}>
      <ActivityIndicator size="large" color={Colors.primaryAccented} />
    </View>);
  };

  return (
    <View style={styles.container}>
      {isWaitingForReconnection
        ? renderReconnectionView()
        : (isConnected ? renderOrderBook() : renderProgressView())
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: Variables.basicUnit * 2
  },
  titleContainer:{
    marginHorizontal: Variables.basicUnit,
    flexDirection: "row",
    justifyContent: 'space-between' 
  },
  titleItem: {
    flex: 1
  },
  header: {    
    height: Variables.lineItemHeight,
    borderColor: Colors.divider,
    borderBottomWidth: 1,
    borderTopWidth: 1,
  },
  headerLabel: {
    flex: 0.3,
    textAlign: "right"
  },
  spread: {
    height: Variables.lineItemHeight,
    alignItems: "center",
  },
  centerView: {
    flex: 1,
    alignContent: "center",
    alignItems: "center", 
    justifyContent: "center"
  }
});

export default Orderbook;