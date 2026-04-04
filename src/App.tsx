import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "./store";
import TitleScreen from "./components/TitleScreen";
import PlayingScreen from "./components/PlayingScreen";
import LevelWinScreen from "./components/LevelWinScreen";
import GameWinScreen from "./components/GameWinScreen";

const screenVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function App() {
  const screen = useGameStore((g) => g.screen);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        {screen === "title" && <TitleScreen />}
        {screen === "playing" && <PlayingScreen />}
        {screen === "levelWin" && <LevelWinScreen />}
        {screen === "gameWin" && <GameWinScreen />}
      </motion.div>
    </AnimatePresence>
  );
}
