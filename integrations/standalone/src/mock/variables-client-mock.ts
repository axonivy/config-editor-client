import type {
  Client,
  EditorFileContent,
  Event,
  MetaRequestTypes,
  ValidationMessages,
  VariablesActionArgs,
  VariablesData
} from '@axonivy/variable-editor-protocol';
import { validations, variables, virtualizedVariables } from './data';
import { knownVariables } from './meta';

export class VariablesClientMock implements Client {
  private variablesData: VariablesData = variables;

  constructor(readonly virtualize = false) {
    this.variablesData = variables;
    if (virtualize) {
      this.variablesData.data += '\n' + virtualizedVariables;
    }
  }

  data(): Promise<VariablesData> {
    return Promise.resolve(this.variablesData);
  }

  saveData(saveData: VariablesData): Promise<EditorFileContent> {
    this.variablesData.data = saveData.data;
    return Promise.resolve({ content: '' });
  }

  validate(): Promise<ValidationMessages> {
    return Promise.resolve(validations);
  }

  meta<TMeta extends keyof MetaRequestTypes>(path: TMeta): Promise<MetaRequestTypes[TMeta][1]> {
    switch (path) {
      case 'meta/knownVariables':
        return Promise.resolve(knownVariables);
      default:
        throw Error('mock meta path not programmed');
    }
  }

  action(action: VariablesActionArgs): void {
    console.log(`Action: ${JSON.stringify(action)}`);
  }

  onDataChanged: Event<void>;
}
