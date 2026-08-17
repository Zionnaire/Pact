export type AuthStackParamList = {
  Welcome: undefined;
  Login: { inviteCode?: string } | undefined;
  Register: undefined;
  QuickJoin: undefined;
  ForgotPassword: undefined;
  ResetPassword: { identifier: string };
};

export type OnboardingStackParamList = {
  PairingChoice: undefined;
  JoinPact: undefined;
  Intention: undefined;
  Invite: undefined;
  Cycle: undefined;
  FirstDrop: undefined;
  Paired: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Vault: undefined;
  Pulse: undefined;
  Pact: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Drop: undefined;
  Reveal: { cycleId: string };
  Notifications: undefined;
  Talk: undefined;
  Therapist: undefined;
  Safety: undefined;
  Bonded: undefined;
  CycleSettings: undefined;
  EditProfile: undefined;
  DeleteAccount: undefined;
  CompleteProfile: undefined;
};
