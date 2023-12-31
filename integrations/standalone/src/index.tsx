import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { YAMLVariablesTable } from '@axonivy/config-editor';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
    <React.StrictMode>
        <YAMLVariablesTable />
    </React.StrictMode>
);
