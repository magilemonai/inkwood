import { useGameStore } from "./store";
import { LEVELS } from "./levels";
import IntroSequence from "./components/IntroSequence";
import PlayingScreen from "./components/PlayingScreen";
import LevelWinScreen from "./components/LevelWinScreen";
import ActTransition from "./components/ActTransition";
import OutroSequence from "./components/OutroSequence";
import WanderScreen from "./components/WanderScreen";
import DevPanel from "./components/DevPanel";
import PersistentInput from "./components/PersistentInput";
import { InputProvider } from "./contexts/InputContext";
import { armAudioPreload } from "./audio";
import fade from "./styles/Fade.module.css";

// Arm the audio preload as early as possible — the AudioContext is
// created and resumed on the first user gesture anywhere in the app,
// so the first phrase completion doesn't stutter while the context
// warms up.
armAudioPreload();

export default function App() {
  const screen = useGameStore((g) => g.screen);
  const lvl = useGameStore((g) => g.lvl);
  const bg = LEVELS[lvl]?.bg ?? "#060806";

  return (
    <InputProvider>
      <PersistentInput />
      <div
        key={screen}
        className={fade.screenFade}
        style={{ background: bg }}
      >
        {screen === "intro" && <IntroSequence />}
        {screen === "playing" && <PlayingScreen />}
        {screen === "levelWin" && <LevelWinScreen />}
        {screen === "actTransition" && <ActTransition />}
        {screen === "outro" && <OutroSequence />}
        {screen === "wander" && <WanderScreen />}
      </div>
      {new URLSearchParams(window.location.search).has("dev") && <DevPanel />}
    </InputProvider>
  );
}
