
import { OrientationType  as RNOrientationType} from 'react-native-orientation-locker';
export type OrientationType = keyof typeof RNOrientationType;

export type Order = {
  price: number;
  size: number;
  total: number;
}

export interface RenderItem {
  item: Order;
  index: number;
}

export interface RenderableOrderItem {
  title: string;
  data: Order[];
}

export const enum Crypto {
  BTC = "PI_XBTUSD",
  ETH = "PI_ETHUSD"
}