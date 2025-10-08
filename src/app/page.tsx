'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { SetupWizard } from '@/components/scorecard/SetupWizard';
import { ScoreCard } from '@/components/scorecard/ScoreCard';
import { GameModeSelect } from '@/components/scorecard/GameModeSelect';
import { MultiplayerSetup } from '@/components/scorecard/MultiplayerSetup';
import { WaitingRoom } from '@/components/scorecard/WaitingRoom';
import { CourseSetup } from '@/components/scorecard/CourseSetup';
import type { Player, Hole } from '@/lib/types-multiplayer';
import { createMultiplayerGame, joinGameByCode, useGameData, convertDBToRound, useFindGameByRoomCode, startGameRealtime } from '@/lib/multiplayer';
import { STANDARD_9_HOLES, STANDARD_18_HOLES } from '@/lib/constants';
import { generatePlayerId, db, id } from '@/lib/db';

type AppFlow =
  | 'welcome'
  | 'player-setup'
  | 'course-setup'
  | 'lobby'
  | 'playing';

export default function Home() {
  const { state, startNewRound, resetGame, loadRound, syncRoundData } = useGame();
  const { session, setPlayerName, clearSession } = usePlayerAuth();

  const [flow, setFlow] = useState<AppFlow>('welcome');
  const [tempGameId, setTempGameId] = useState<string>('');
  const [tempRoomCode, setTempRoomCode] = useState<string>('');
  const [tempCourseName, setTempCourseName] = useState<string>('');
  const [tempHoles, setTempHoles] = useState<Hole[]>([]);
  const [joinRoomCode, setJoinRoomCode] = useState<string>(''); // For searching games
  const [showCourseSelect, setShowCourseSelect] = useState(false);

  // Subscribe to multiplayer game data if we have a gameId
  // Always call hooks unconditionally (Rules of Hooks)
  const gameDataQuery = useGameData(tempGameId || '');
  const gameSearchQuery = useFindGameByRoomCode(joinRoomCode || '');

  const gameData = tempGameId ? gameDataQuery.data : null;
  const gameSearchData = joinRoomCode ? gameSearchQuery.data : null;

  // Get current lobby state from database
  const lobbyPlayers = gameData?.players || [];
  const lobbyGame = gameData?.games?.[0];
  const lobbyHoles = gameData?.holes || [];
  const lobbyScores = gameData?.scores || [];

  // Simple effect to detect when game starts (for non-host players)
  useEffect(() => {
    if (flow === 'lobby' && !session?.isHost && lobbyGame?.isStarted && lobbyHoles.length > 0 && lobbyPlayers.length > 0) {
      // Game has started - load it
      const round = convertDBToRound(lobbyGame, lobbyPlayers, lobbyHoles, lobbyScores);
      loadRound(round);
      setFlow('playing');
    }
  }, [flow, session, lobbyGame?.isStarted, lobbyHoles.length, lobbyPlayers.length, lobbyGame, lobbyScores, loadRound]);

  // Effect to sync real-time score updates while playing
  useEffect(() => {
    if (flow === 'playing' && state.round?.gameMode === 'multiplayer' && lobbyGame && lobbyPlayers.length > 0 && lobbyHoles.length > 0) {
      // Sync round data WITHOUT resetting navigation
      const updatedRound = convertDBToRound(lobbyGame, lobbyPlayers, lobbyHoles, lobbyScores);
      syncRoundData(updatedRound);
    }
  }, [lobbyScores, lobbyPlayers, lobbyGame, lobbyHoles, flow, state.round?.gameMode, syncRoundData]);

  const handleCreateLobby = async (hostName: string) => {
    try {
      // Create player ID for the host
      const hostPlayerId = generatePlayerId();

      // Set player session
      setPlayerName(hostName, hostPlayerId, true);

      // Show course setup first
      setFlow('course-setup');
    } catch (error) {
      console.error('Failed to start setup:', error);
      alert('Failed to start setup. Please try again.');
    }
  };

  const handleCourseSetupComplete = async (holes: Hole[], courseName: string) => {
    if (!session) return;

    try {
      // Now create the game with holes already configured
      const { gameId, roomCode } = await createMultiplayerGame(
        session.playerName,
        session.playerId,
        courseName,
        holes
      );

      setTempGameId(gameId);
      setTempRoomCode(roomCode);
      setFlow('lobby');
    } catch (error) {
      console.error('Failed to create lobby:', error);
      alert('Failed to create lobby. Please try again.');
    }
  };

  const handleJoinLobby = async (playerName: string, roomCode: string) => {
    // Generate player ID and set session first
    const playerId = generatePlayerId();
    setPlayerName(playerName, playerId, false);

    // Then search for the game
    setJoinRoomCode(roomCode.toUpperCase());
  };

  // Effect to handle joining when game is found
  useEffect(() => {
    // Don't run if we're already in lobby, no room code, or no session
    if (!joinRoomCode || flow === 'lobby' || !session) return;

    // Don't run if we don't have search results yet
    if (!gameSearchData) return;

    if (gameSearchData.games && gameSearchData.games.length > 0) {
      const game = gameSearchData.games[0];
      const allPlayers = gameSearchData.players || [];

      // Filter players for this specific game
      const gamePlayers = allPlayers.filter(p => p.gameId === game.id);

      // Check if this player is already in the game
      if (gamePlayers.some(p => p.id === session.playerId)) {
        console.log('Player already in game, navigating to lobby');
        setTempGameId(game.id);
        setTempRoomCode(game.roomCode);
        setJoinRoomCode('');
        setFlow('lobby');
        return;
      }

      const playerNumber = gamePlayers.length + 1;

      if (playerNumber > 6) {
        alert('Game is full (max 6 players)');
        setJoinRoomCode('');
        return;
      }

      const handleJoin = async () => {
        try {
          await joinGameByCode(
            session.playerName,
            session.playerId,
            game.id,
            playerNumber
          );

          setTempGameId(game.id);
          setTempRoomCode(game.roomCode);
          setJoinRoomCode(''); // Clear search
          setFlow('lobby');
        } catch (error: unknown) {
          console.error('Failed to join:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to join game.';
          alert(errorMessage);
          setJoinRoomCode('');
        }
      };

      handleJoin();
    } else if (gameSearchData.games && gameSearchData.games.length === 0) {
      alert('Game not found. Please check the room code.');
      setJoinRoomCode('');
    }
  }, [gameSearchData, joinRoomCode, flow, session]);

  const handleStartGameFromLobby = async () => {
    if (!lobbyGame || !lobbyPlayers.length || !lobbyHoles.length || !tempGameId) return;

    try {
      // Mark game as started in database
      await startGameRealtime(tempGameId);

      // Host loads the round and starts playing
      const round = convertDBToRound(lobbyGame, lobbyPlayers, lobbyHoles, lobbyScores);
      loadRound(round);
      setFlow('playing');
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleLeaveLobby = () => {
    clearSession();
    setTempGameId('');
    setTempRoomCode('');
    setTempCourseName('');
    setTempHoles([]);
    setShowCourseSelect(false);
    setFlow('welcome');
  };

  const handleNewRound = () => {
    resetGame();
    clearSession();
    setTempGameId('');
    setTempRoomCode('');
    setTempCourseName('');
    setTempHoles([]);
    setShowCourseSelect(false);
    setFlow('welcome');
  };

  // Show scorecard if playing
  if (flow === 'playing' || state.isSetupComplete) {
    return <ScoreCard onNewRound={handleNewRound} />;
  }

  // Show course setup (for host before lobby)
  if (flow === 'course-setup' && session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <CourseSetup
            onComplete={handleCourseSetupComplete}
            onBack={() => setFlow('player-setup')}
          />
        </div>
      </div>
    );
  }

  // Show lobby
  if (flow === 'lobby' && session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <WaitingRoom
            roomCode={tempRoomCode}
            gameId={tempGameId}
            players={lobbyPlayers.map(p => ({
              id: p.id,
              name: p.name,
              color: p.color,
              handicap: p.handicap,
              playerNumber: p.playerNumber,
              hasFinished: false,
              joinedAt: p.joinedAt,
            }))}
            isHost={session.isHost}
            onStartGame={handleStartGameFromLobby}
            onCancel={handleLeaveLobby}
          />
        </div>
      </div>
    );
  }

  // Show player setup (create or join)
  if (flow === 'player-setup') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <MultiplayerSetup
            onCreateGame={handleCreateLobby}
            onJoinGame={handleJoinLobby}
            onBack={() => setFlow('welcome')}
          />
        </div>
      </div>
    );
  }

  // Welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          🏌️ Sticks and Stones
        </h1>
        <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
          Golf Score Tracker
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setFlow('player-setup')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
          >
            Let&apos;s Play a Round
          </button>
          <p className="text-sm text-gray-500">
            Create a game or join with a room code
          </p>
        </div>
      </div>
    </div>
  );
}
