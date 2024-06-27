import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  BrowsersView,
  useBrowser,
  type BrowserNode
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { useState } from 'react';

export const OverwriteDialog = () => {
  const VariableBrowser = ({ applyFn }: { applyFn?: (value?: string) => void }) => {
    const nodes: Array<BrowserNode> = [
      {
        value: 'microsoft',
        info: 'MyApp Value and Description',
        icon: IvyIcons.Folders,
        children: [
          {
            value: 'connector',
            info: '',
            icon: IvyIcons.Folders,
            children: [
              {
                value: 'AppId',
                info: 'MyAppId the application id',
                icon: IvyIcons.Quote,
                children: []
              }
            ]
          }
        ]
      }
    ];
    const variableBrowser = useBrowser(nodes);
    return (
      <BrowsersView
        browsers={[
          {
            name: 'Variables',
            icon: IvyIcons.Bend,
            browser: variableBrowser
          }
        ]}
        apply={(value, type) => {
          console.log('apply', value, type);
          if (applyFn) applyFn(value?.cursor);
        }}
      />
    );
  };

  const [dialogState, setDialogState] = useState(false);

  return (
    <Dialog open={dialogState} onOpenChange={setDialogState}>
      <DialogTrigger asChild>
        <Button icon={IvyIcons.FileImport} aria-label='Overwrite variable' />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Overwrite variable from dependent projects</DialogTitle>
        </DialogHeader>
        <VariableBrowser
          applyFn={() => {
            setDialogState(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
