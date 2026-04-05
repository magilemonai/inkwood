import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "./store";
import IntroSequence from "./components/IntroSequence";
import PlayingScreen from "./components/PlayingScreen";
import LevelWinScreen from "./components/LevelWinScreen";
import ActTransition from "./components/ActTransition";
import OutroSequence from "./components/OutroSequence";
import DevPanel from "./components/DevPanel";

const screenVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function App() {
  const screen = useGameStore((g) => g.screen);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ minHeight: "100vh" }}
        >
          {screen === "intro" && <IntroSequence />}
          {screen === "playing" && <PlayingScreen />}
          {screen === "levelWin" && <LevelWinScreen />}
          {screen === "actTransition" && <ActTransition />}
          {screen === "outro" && <OutroSequence />}
        </motion.div>
      </AnimatePresence>
      {new URLSearchParams(window.location.search).has("dev") && <DevPanel />}
    </>
  );
}
