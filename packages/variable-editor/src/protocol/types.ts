export type Data = { context: DataContext; data: string };
export type VariableData = { name: string; value: string; descripton: string };
export type DataContext = { app: string; pmv: string; file: string };

export type ValidationMessage = { message: string; path: string; severity: number };
export type ValidationMessages = Array<ValidationMessage>;

export interface RequestTypes {
  data: [any, any];
  saveData: [any, any];
  validate: [any, any];
  overwritables: [any, any];
}

export interface NotificationTypes {
  dataChanged: void;
}

export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable;
}

export interface Disposable {
  dispose(): void;
}

export interface Client {
  data(context: DataContext): Promise<Data>;
  saveData(saveData: Data): Promise<ValidationMessages>;
  validate(validate: DataContext): Promise<ValidationMessages>;
  overwritables(context: DataContext): Promise<VariableData>;
  onDataChanged: Event<void>;
}

export interface ClientContext {
  client: Client;
}
