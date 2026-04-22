import type { SceneKey } from "../types";
import GardenScene from "../scenes/GardenScene";
import CottageScene from "../scenes/CottageScene";
import StarScene from "../scenes/StarScene";
import WellScene from "../scenes/WellScene";
import BridgeScene from "../scenes/BridgeScene";
import LibraryScene from "../scenes/LibraryScene";
import StonesScene from "../scenes/StonesScene";
import SanctumScene from "../scenes/SanctumScene";
import TreeScene from "../scenes/TreeScene";
import WorldScene from "../scenes/WorldScene";

interface Props {
  sceneKey: SceneKey;
  progress: number;
}

/** Compile-time exhaustiveness helper — any new SceneKey will be flagged
 *  by TypeScript here until a corresponding case is added below. */
function assertNever(x: never): never {
  throw new Error(`Unhandled scene key: ${String(x)}`);
}

export default function SceneRenderer({ sceneKey, progress }: Props) {
  switch (sceneKey) {
    case "garden": return <GardenScene progress={progress} />;
    case "cottage": return <CottageScene progress={progress} />;
    case "stars": return <StarScene progress={progress} />;
    case "well": return <WellScene progress={progress} />;
    case "bridge": return <BridgeScene progress={progress} />;
    case "library": return <LibraryScene progress={progress} />;
    case "stones": return <StonesScene progress={progress} />;
    case "sanctum": return <SanctumScene progress={progress} />;
    case "tree": return <TreeScene progress={progress} />;
    case "world": return <WorldScene progress={progress} />;
    default: return assertNever(sceneKey);
  }
}
