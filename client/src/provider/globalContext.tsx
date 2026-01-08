import { createContext } from "react";

export type Pick = {
  question: string;
  type: string;
  options: Array<string>;
};

export type Player = {
  id: string;
  name: string;
};

export type GlobalData = {
  // Public data (no auth required)
  leaderboard: Array<{ username: string; score: number }>;
  allResponses: Array<Record<string, unknown>>;
  questions: Array<Record<string, unknown>>;
  fantasyLeaderboard: Array<Record<string, unknown>>;
  pickQuestions: Array<Pick>;
  editsAllowed: boolean;
  
  // Authenticated data (requires auth)
  userResponses: Array<string | number>;
  availablePlayers: { [key: string]: Player[] };
  userLineup: { [key: string]: string };
  
  // Loading states
  publicDataLoading: boolean;
  authDataLoading: boolean;
  
  // Methods
  fetchPublicData: () => Promise<void>;
  fetchAuthData: () => Promise<void>;
  setUserResponses: (responses: Array<string | number>) => void;
  setUserLineup: (lineup: { [key: string]: string }) => void;
  setEditsAllowed: (allowed: boolean) => void;
};

export const GlobalContext = createContext<GlobalData>({
  leaderboard: [],
  allResponses: [],
  questions: [],
  fantasyLeaderboard: [],
  pickQuestions: [],
  editsAllowed: false,
  userResponses: [],
  availablePlayers: {},
  userLineup: {},
  publicDataLoading: true,
  authDataLoading: false,
  fetchPublicData: async () => {},
  fetchAuthData: async () => {},
  setUserResponses: () => {},
  setUserLineup: () => {},
  setEditsAllowed: () => {},
});
