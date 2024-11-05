import type {
  ProjectVarNode,
  ValidationResult,
  VariablesActionArgs,
  VariablesData,
  VariablesEditorDataContext,
  VariablesSaveDataArgs
} from './editor';

export type EditorProps = { context: VariablesEditorDataContext; directSave?: boolean };
export type SaveArgs = VariablesSaveDataArgs & { directSave?: boolean };

export type ValidationMessages = Array<ValidationResult>;

export interface MetaRequestTypes {
  'meta/knownVariables': [VariablesEditorDataContext, ProjectVarNode];
}

export interface RequestTypes extends MetaRequestTypes {
  data: [VariablesEditorDataContext, VariablesData];
  saveData: [SaveArgs, ValidationMessages];
  validate: [VariablesEditorDataContext, ValidationMessages];
}

export interface NotificationTypes {
  action: VariablesActionArgs;
}

export interface OnNotificationTypes {
  dataChanged: void;
}

export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable;
}

export interface Disposable {
  dispose(): void;
}

export interface Client {
  data(context: VariablesEditorDataContext): Promise<VariablesData>;
  saveData(saveArgs: SaveArgs): Promise<ValidationMessages>;
  validate(validate: VariablesEditorDataContext): Promise<ValidationMessages>;
  meta<TMeta extends keyof MetaRequestTypes>(path: TMeta, args: MetaRequestTypes[TMeta][0]): Promise<MetaRequestTypes[TMeta][1]>;
  action(action: VariablesActionArgs): void;
  onDataChanged: Event<void>;
}

export interface ClientContext {
  client: Client;
}