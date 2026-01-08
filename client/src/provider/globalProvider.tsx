import { useMemo, useState, useEffect, useCallback, ReactNode } from "react";
import axios from "axios";
import { GlobalContext, Pick, Player } from "./globalContext";
import API_BASE_URL from "../config/api";

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  // Public data state
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const [allResponses, setAllResponses] = useState<Array<Record<string, unknown>>>([]);
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([]);
  const [fantasyLeaderboard, setFantasyLeaderboard] = useState<Array<Record<string, unknown>>>([]);
  const [pickQuestions, setPickQuestions] = useState<Array<Pick>>([]);
  const [editsAllowed, setEditsAllowed_] = useState(false);
  
  // Authenticated data state
  const [userResponses, setUserResponses_] = useState<Array<string | number>>([]);
  const [availablePlayers, setAvailablePlayers] = useState<{ [key: string]: Player[] }>({});
  const [userLineup, setUserLineup_] = useState<{ [key: string]: string }>({});
  
  // Loading states
  const [publicDataLoading, setPublicDataLoading] = useState(true);
  const [authDataLoading, setAuthDataLoading] = useState(false);
  
  // Flag to track if public data has been fetched
  const [publicDataFetched, setPublicDataFetched] = useState(false);
  
  // Flag to track if auth data has been fetched
  const [authDataFetched, setAuthDataFetched] = useState(false);

  // Fetch public data (no auth required)
  const fetchPublicData = useCallback(async () => {
    if (publicDataFetched) return; // Don't fetch if already fetched
    
    setPublicDataLoading(true);
    try {
      // Fetch all public data in parallel
      const [scoresRes, responsesRes, fantasyRes, infoRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/getTotalUserScores`),
        axios.get(`${API_BASE_URL}/api/information/getAllResponses`),
        axios.get(`${API_BASE_URL}/api/fantasy/leaderboard`),
        axios.get(`${API_BASE_URL}/api/information/getInfo`)
      ]);

      setLeaderboard(scoresRes.data.userScores || []);
      setAllResponses(responsesRes.data.responses || []);
      setQuestions(responsesRes.data.questions || []);
      setFantasyLeaderboard(fantasyRes.data.leaderboard || []);
      setPickQuestions(infoRes.data.information.options || []);
      setEditsAllowed_(infoRes.data.information.editsAllowed || false);
      
      setPublicDataFetched(true);
    } catch (err) {
      console.error('Error fetching public data:', err);
    } finally {
      setPublicDataLoading(false);
    }
  }, [publicDataFetched]);

  // Fetch authenticated data (requires auth)
  const fetchAuthData = useCallback(async () => {
    if (authDataFetched) return; // Don't fetch if already fetched
    
    setAuthDataLoading(true);
    try {
      // Fetch all authenticated data in parallel
      const [playersRes, lineupRes, responsesRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/fantasy/availablePlayers`, {
          params: { position: 'ALL' }
        }),
        axios.get(`${API_BASE_URL}/api/fantasy/lineup`),
        axios.post(`${API_BASE_URL}/api/information/findResponse`)
      ]);

      // Process available players
      if (playersRes.status === 'fulfilled') {
        const allPlayers = playersRes.value.data.availablePlayers;
        const players: { [key: string]: Player[] } = {};
        players['QB'] = allPlayers.QB || [];
        players['RB1'] = allPlayers.RB || [];
        players['RB2'] = allPlayers.RB || [];
        players['WR1'] = allPlayers.WR || [];
        players['WR2'] = allPlayers.WR || [];
        players['TE'] = allPlayers.TE || [];
        players['FLEX'] = allPlayers.FLEX || [];
        players['PK'] = allPlayers.PK || [];
        players['DEF'] = allPlayers.DEF || [];
        setAvailablePlayers(players);
      }

      // Process user lineup
      if (lineupRes.status === 'fulfilled') {
        const lineupData = lineupRes.value.data;
        if (lineupData && lineupData.lineup?.lineup) {
          setUserLineup_(lineupData.lineup.lineup);
        }
      }

      // Process user responses
      if (responsesRes.status === 'fulfilled') {
        setUserResponses_(responsesRes.value.data.response || []);
      }
      
      setAuthDataFetched(true);
    } catch (err) {
      console.error('Error fetching authenticated data:', err);
    } finally {
      setAuthDataLoading(false);
    }
  }, [authDataFetched]);

  // Fetch public data on mount
  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  // Fetch authenticated data if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchAuthData();
    }
  }, [fetchAuthData]);

  const setUserResponses = useCallback((responses: Array<string | number>) => {
    setUserResponses_(responses);
  }, []);

  const setUserLineup = useCallback((lineup: { [key: string]: string }) => {
    setUserLineup_(lineup);
  }, []);

  const setEditsAllowed = useCallback((allowed: boolean) => {
    setEditsAllowed_(allowed);
  }, []);

  // Memoized value of the global context
  const contextValue = useMemo(
    () => ({
      leaderboard,
      allResponses,
      questions,
      fantasyLeaderboard,
      pickQuestions,
      editsAllowed,
      userResponses,
      availablePlayers,
      userLineup,
      publicDataLoading,
      authDataLoading,
      fetchPublicData,
      fetchAuthData,
      setUserResponses,
      setUserLineup,
      setEditsAllowed,
    }),
    [
      leaderboard,
      allResponses,
      questions,
      fantasyLeaderboard,
      pickQuestions,
      editsAllowed,
      userResponses,
      availablePlayers,
      userLineup,
      publicDataLoading,
      authDataLoading,
      fetchPublicData,
      fetchAuthData,
      setUserResponses,
      setUserLineup,
      setEditsAllowed,
    ]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
