import {
  BaseRpcClient,
  Emitter,
  createMessageConnection,
  createWebSocketConnection,
  urlBuilder,
  type Connection,
  type Disposable
} from '@axonivy/jsonrpc';
import type { Client, Data, DataContext, NotificationTypes, RequestTypes, ValidationMessages, VariableData } from './types';

export class ClientJsonRpc extends BaseRpcClient implements Client {
  protected onDataChangedEmitter = new Emitter<void>();
  onDataChanged = this.onDataChangedEmitter.event;
  protected override setupConnection(): void {
    super.setupConnection();
    this.toDispose.push(this.onDataChangedEmitter);
    this.onNotification('dataChanged', data => this.onDataChangedEmitter.fire(data));
  }

  data(context: DataContext): Promise<Data> {
    return this.sendRequest('data', context);
  }

  saveData(saveData: Data): Promise<ValidationMessages> {
    return this.sendRequest('saveData', saveData);
  }

  validate(context: DataContext): Promise<ValidationMessages> {
    return this.sendRequest('validate', context);
  }

  overwritables(context: DataContext): Promise<VariableData> {
    return this.sendRequest('overwritables', context);
  }

  sendRequest<K extends keyof RequestTypes>(command: K, args: RequestTypes[K][0]): Promise<RequestTypes[K][1]> {
    return args === undefined ? this.connection.sendRequest(command) : this.connection.sendRequest(command, args);
  }

  onNotification<K extends keyof NotificationTypes>(kind: K, listener: (args: NotificationTypes[K]) => any): Disposable {
    return this.connection.onNotification(kind, listener);
  }

  public static async startWebSocketClient(url: string): Promise<Client> {
    const webSocketUrl = urlBuilder(url, 'ivy-config-lsp');
    const connection = await createWebSocketConnection(webSocketUrl);
    return ClientJsonRpc.startClient(connection);
  }

  public static async startClient(connection: Connection): Promise<Client> {
    const messageConnection = createMessageConnection(connection.reader, connection.writer);
    const client = new ClientJsonRpc(messageConnection);
    client.start();
    connection.reader.onClose(() => client.stop());
    return client;
  }
}
