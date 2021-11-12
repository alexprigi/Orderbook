// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// External/Third party dependencies
import React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';
// Internal dependencies
import Label from "@orderbook/label";
import { Colors, Variables } from "@orderbook/theme";

export interface IOrder {
    price: Number;
    size: Number;
    total: Number;
}

export interface Props {
    order: IOrder;
    barWidth?: Number;
    isBid?: Boolean;
    isReversedAligned?: Boolean;
}

const OrderListItem: React.FC<Props> = ({order, barWidth, isBid, isReversedAligned}) => {
    return (
        <View style={{ ...styles.container, flexDirection: isReversedAligned ? "row-reverse" : "row" }}>
            <View style={{
                ...styles.bar,
                width: `${barWidth}%`,
                backgroundColor: isBid ? Colors.bidBarBackgroundColor : Colors.askBarBackgroundColor
            }} />
            <Label 
                text={order.price.toLocaleString(undefined,{
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                textColor={isBid ? Colors.priceBidTextColor : Colors.priceAskTextColor}
                additionalStyle={styles.label} />
            <Label text={order.size.toLocaleString()}
                additionalStyle={styles.label} />
            <Label text={order.total.toLocaleString()}
                additionalStyle={styles.label} />
        </View>
    );
  };

export default OrderListItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: Variables.lineItemHeight
    },
    bar: {
        position: "absolute",
        top: 0,
        left: 0,
        height: Variables.lineItemHeight,
    },
    label: {
        flex: 0.3,
        textAlign: "right"
    }
});
  