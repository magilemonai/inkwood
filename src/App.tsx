import { useEffect } from "react";
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
import Intro2 from "./components/v2/Intro";
import Outro2 from "./components/v2/Outro";
import EditionToggle from "./components/EditionToggle";
import { isV2Enabled } from "./v2";
import { InputProvider } from "./contexts/InputContext";
import { armAudioPreload } from "./audio";
import { trackPageview } from "./analytics";
import fade from "./styles/Fade.module.css";

// Arm the audio preload as early as possible — the AudioContext is
// created and resumed on the first user gesture anywhere in the app,
// so the first phrase completion doesn't stutter while the context
// warms up.
armAudioPreload();

// Dev mode hook: expose the store on window so external tooling
// (the trailer recorder, e2e harnesses) can drive scene jumps
// without poking the visible dev panel UI.
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dev")) {
  (window as unknown as { __inkwoodStore?: typeof useGameStore }).__inkwoodStore = useGameStore;
}

export default function App() {
  const screen = useGameStore((g) => g.screen);
  const lvl = useGameStore((g) => g.lvl);
  const bg = LEVELS[lvl]?.bg ?? "#060806";

  useEffect(() => {
    const level = LEVELS[lvl];
    const sceneSlug = level?.scene ?? "unknown";
    const sceneTitle = level?.title ?? "Inkwood";
    let path = "/";
    let title = "Inkwood";
    switch (screen) {
      case "intro":
        path = "/intro"; title = "Inkwood — Intro"; break;
      case "playing":
        path = `/play/${sceneSlug}`; title = `Inkwood — ${sceneTitle}`; break;
      case "levelWin":
        path = `/win/${sceneSlug}`; title = `Inkwood — ${sceneTitle} complete`; break;
      case "actTransition":
        path = `/transition/${sceneSlug}`; title = "Inkwood — Act transition"; break;
      case "outro":
        path = "/outro"; title = "Inkwood — Outro"; break;
      case "wander":
        path = "/wander"; title = "Inkwood — Wander"; break;
    }
    trackPageview(path, title);
  }, [screen, lvl]);

  return (
    <InputProvider>
      <PersistentInput />
      <div
        key={screen}
        className={fade.screenFade}
        style={{ background: bg }}
      >
        {/* Inkwood 2 (?v2) has its own intro and outro (components/v2/);
            the shipped ones stay byte-identical for everyone else. */}
        {screen === "intro" && (isV2Enabled() ? <Intro2 /> : <IntroSequence />)}
        {screen === "playing" && <PlayingScreen />}
        {screen === "levelWin" && <LevelWinScreen />}
        {screen === "actTransition" && <ActTransition />}
        {screen === "outro" && (isV2Enabled() ? <Outro2 /> : <OutroSequence />)}
        {screen === "wander" && <WanderScreen />}
      </div>
      {/* Classic | Inkwood 2, pinned on every screen. */}
      <EditionToggle />
      {new URLSearchParams(window.location.search).has("dev") && <DevPanel />}
    </InputProvider>
  );
}
