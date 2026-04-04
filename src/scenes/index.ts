import type { SceneKey, SceneProps } from "../types";
import GardenScene from "./GardenScene";
import CottageScene from "./CottageScene";
import StarScene from "./StarScene";
import WellScene from "./WellScene";
import BridgeScene from "./BridgeScene";
import LibraryScene from "./LibraryScene";
import StonesScene from "./StonesScene";
import SanctumScene from "./SanctumScene";
import TreeScene from "./TreeScene";
import WorldScene from "./WorldScene";

const SCENES: Record<SceneKey, React.ComponentType<SceneProps>> = {
  garden: GardenScene,
  cottage: CottageScene,
  stars: StarScene,
  well: WellScene,
  bridge: BridgeScene,
  library: LibraryScene,
  stones: StonesScene,
  sanctum: SanctumScene,
  tree: TreeScene,
  world: WorldScene,
};

export function getSceneComponent(key: SceneKey) {
  return SCENES[key];
}
