// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

// External/Third party dependencies
import React from 'react';
import {
    Text
} from 'react-native';
// Internal dependencies
import { Colors } from "@orderbook/theme";

export interface Props {
    text?: String;
    textColor?: String;
    additionalStyle?: Object;
}

const Label: React.FC<Props> = ({text, textColor, additionalStyle}) => {
    return (
        <Text style={{ color: textColor || Colors.primaryText, ...additionalStyle}}>
            {text}
        </Text>
    );
};

export default Label