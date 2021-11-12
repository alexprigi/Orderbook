export interface IOrderbookService {

}

export default class OrderbookService implements IOrderbookService{
  URL: string = "wss://www.cryptofacilities.com/ws/v1";
  ws?: WebSocket;
  onOpen: (() => void) | null;
  onClose: (() => void) | null;
  onError: (() => void) | null;
  onMessage: ((response: any) => void) | null;

  constructor(onOpen: (() => void) | null, onClose: (() => void) | null, onError: (() => void) | null, onMessage: ((response: any) => void) | null) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.onMessage = onMessage;
  }

  connect(crypto: any) {
    this.ws = new WebSocket(this.URL);
    this.ws.onopen = () => {
      this.subscribe(crypto);
      this.onOpen && this.onOpen();
    };
    this.ws.onmessage = (e) => {
      const response = e.data && JSON.parse(e.data);
      this.onMessage && this.onMessage(response);
    }
    // this.ws.onerror = this.onError || null;
    // this.ws.onclose = this.onClose || null;
  }

  subscribe(crypto: String) {
    const msg = { "event": "subscribe", "feed": "book_ui_1", "product_ids": [`${crypto}`] };
    this.send(msg);
  }

  unsubscribe(crypto: String) {
    const msg = { "event": "unsubscribe", "feed": "book_ui_1", "product_ids": [`${crypto}`] };
    this.send(msg);
  }

  send(msg: Object) {
    this.ws?.send(JSON.stringify(msg));
  }

  close(){
    this.ws?.close();
  }
};