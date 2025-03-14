import type { ValidationMessages, VariablesData } from '@axonivy/variable-editor-protocol';

export const variables: VariablesData = {
  context: { app: '', pmv: '', file: '' },
  data: `Variables:
  microsoft-connector:
    # Your Azure Application (client) ID
    appId: MyAppId
    # Secret key from your applications "certificates & secrets"
    # [password]
    secretKey: MySecretKey
    # work with app permissions rather than in delegate of a user
    # set to 'true' if no user consent should be accuired and adjust the 'tenantId' below.
    useAppPermissions: "false"
    # tenant to use for OAUTH2 request.
    # the default 'common' fits for user delegate requests.
    # set the Azure Directory (tenant) ID, for application requests.
    tenantId: common
    # use a static user+password authentication to work in the name of technical user.
    # most insecure but valid, if you must work with user permissions, while no real user is able to consent the action.
    useUserPassFlow:
      enabled: "false"
      # technical user to login
      user: MyUser
      # technical users password
      # [password]
      pass: MyPass
    # permissions to request access to.
    # you may exclude or add some, as your azure administrator allows or restricts them.
    # for sharepoint-demos, the following must be added: Sites.Read.All Files.ReadWrite
    permissions: user.read Calendars.ReadWrite mail.readWrite mail.send
      Tasks.ReadWrite Chat.Read offline_access
    # this property specifies the library used to create and manage HTTP connections for Jersey client. 
    # it sets the connection provider class for the Jersey client.
    # while the default provider works well for most methods, if you specifically need to use the PATCH method, consider switching the provider to:
    #   org.glassfish.jersey.apache.connector.ApacheConnectorProvider
    connectorProvider: org.glassfish.jersey.client.HttpUrlConnectorProvider
  `,
  helpUrl: 'https://dev.axonivy.com'
};

export const virtualizedVariables = `
  more-variables:
    a1: 1
    a2: 2
    a3: 3
    a4: 4
    a5: 5
    a6: 6
    a7: 7
    a8: 8
    a9: 9
    a10: 10
    a11: 11
    a12: 12
    a13: 13
    a14: 14
    a15: 15
    a16: 16
    a17: 17
    a18: 18
    a19: 19
    a20: 20
    a21: 21
    a22: 22
    a23: 23
    a24: 24
    a25: 25
    a26: 26
    a27: 27
    a28: 28
    a29: 29
    a30: 30
    a31: 31
    a32: 32
    a33: 33
    a34: 34
    a35: 35
    a36: 36
    a37: 37
    a38: 38
    a39: 39
    a40: 40
    a41: 41
    a42: 42
    a43: 43
    a44: 44
    a45: 45
    a46: 46
    a47: 47
    a48: 48
    a49: 49
    a50: 50
`;

export const validations: ValidationMessages = [
  {
    message: 'Invalid key',
    path: 'invalidKey',
    property: 'key',
    severity: 'WARNING'
  },
  {
    message: 'Invalid variable 0 key',
    path: 'invalidKey.invalidVariable0',
    property: 'key',
    severity: 'INFO'
  },
  {
    message: 'Invalid variable 0 value warning',
    path: 'invalidKey.invalidVariable0',
    property: 'value',
    severity: 'WARNING'
  },
  {
    message: 'Invalid variable 0 value error',
    path: 'invalidKey.invalidVariable0',
    property: 'value',
    severity: 'ERROR'
  },
  {
    message: 'Invalid variable 1 value',
    path: 'invalidKey.invalidVariable1',
    property: 'value',
    severity: 'INFO'
  }
];
