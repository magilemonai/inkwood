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
import { V2_SCENES } from "../scenes/v2";
import { isV2Enabled } from "../v2";

interface Props {
  sceneKey: SceneKey;
  progress: number;
}

export default function SceneRenderer({ sceneKey, progress }: Props) {
  // Inkwood 2: redrawn scenes live in scenes/v2/ and take over under the
  // gate; anything not redrawn yet falls through to the shipped scene.
  if (isV2Enabled()) {
    const Override = V2_SCENES[sceneKey];
    if (Override) return <Override progress={progress} />;
  }
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
  }
}
