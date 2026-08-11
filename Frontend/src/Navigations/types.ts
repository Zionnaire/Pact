export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: { hasInvite?: boolean } | undefined;
};

export type OnboardingStackParamList = {
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
};
