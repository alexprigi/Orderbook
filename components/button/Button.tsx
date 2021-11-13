// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// External/Third party dependencies
import React from 'react';
import { View, TouchableOpacity, TouchableNativeFeedback, Platform, StyleSheet } from 'react-native';
// Internal dependencies
import Label from "@orderbook/label";
import { Colors, Variables } from "@orderbook/theme";

export interface Props {
    text?: String;
    textColor?: String;
    disabled?: Boolean;
    onPress?: () => void;
    additionalStyle?: Object;
}

const Button: React.FC<Props> = ({text, textColor, onPress, disabled, additionalStyle}) => {
    let TouchableCmp: any = TouchableOpacity;

    if (Platform.OS === 'android' && Platform.Version >= 21) {
        TouchableCmp = TouchableNativeFeedback;
    }
    return (
        <View style={{...styles.container, ...additionalStyle}}>
            <TouchableCmp
                disabled={disabled}
                onPress={onPress}>
                <View
                    style={styles.button}>
                    <Label
                        text={text}
                        textColor={textColor}
                    />
                </View>
            </TouchableCmp>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 0,
        borderRadius: 10,
        overflow:
            Platform.OS === 'android' && Platform.Version >= 21
                ? 'hidden'
                : 'visible',
        elevation: 5,
        alignSelf: "center"
    },
    button: { 
        alignSelf: 'flex-start',
        paddingHorizontal: Variables.basicUnit * 2,
        paddingVertical: Variables.basicUnit * 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primaryAccented,
        shadowColor: Colors.divider,
        borderRadius: 10,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 10,
    }
});

export default Button