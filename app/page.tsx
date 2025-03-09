"use client";
import { useRouter } from "next/navigation";

const games = [
  {
    id: "drunk-wheel-challenge",
    name: "Drunk Wheel Challenge",
    description: "Spin the wheel & take a challenge!",
    icon: "🍻",
    hostPath: "/games/drunk-wheel-challenge/host",
    playerPath: "/games/drunk-wheel-challenge/player",
  },
  {
    id: "roll-dice",
    name: "Roll Dice",
    description: "Roll the dice and take a challenge!",
    icon: "🎲",
    hostPath: "/games/roll-dice/host",
    playerPath: "/games/roll-dice/player",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 P2P Game Hub 🚀</h1>
      <p className="text-lg text-gray-300 mb-6">
        Choose a game to host or join as a player
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center transition transform hover:scale-105"
          >
            <div className="text-5xl">{game.icon}</div>
            <h2 className="text-xl font-semibold mt-2">{game.name}</h2>
            <p className="text-gray-400 mt-1">{game.description}</p>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => router.push(game.hostPath)}
                disabled={game.hostPath === "#"}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  game.hostPath === "#"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 transition text-white"
                }`}
              >
                🎮 Be the Host
              </button>

              <button
                onClick={() => router.push(game.playerPath)}
                disabled={game.playerPath === "#"}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  game.playerPath === "#"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 transition text-white"
                }`}
              >
                📱 Be a Player
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
