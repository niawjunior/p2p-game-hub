"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen overflow-hidden bg-gray-900 text-white p-2">
      <h1 className="text-xl font-bold">🍻 Drunk Challenge Game 🎉</h1>
      <p className="mt-2 text-lg text-gray-300">Choose your role to begin</p>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => router.push("/host")}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 transition text-white font-semibold rounded-lg"
        >
          🎮 Be the Host
        </button>

        <button
          onClick={() => router.push("/phone")}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 transition text-white font-semibold rounded-lg"
        >
          📱 Be a Player
        </button>
      </div>
    </div>
  );
}
