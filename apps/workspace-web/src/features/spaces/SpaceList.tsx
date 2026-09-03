import type { PrototypeSpace } from "./space-model";
import "./spaces.css";

export function SpaceList({
  spaces,
  selectedSpaceId,
  onSelect,
  renderIcon,
}: {
  spaces: readonly PrototypeSpace[];
  selectedSpaceId: string;
  onSelect: (spaceId: string) => void;
  renderIcon: (icon: PrototypeSpace["iconKey"]) => React.ReactNode;
}) {
  return (
    <div className="space-list">
      {spaces.map((space) => (
        <button aria-pressed={selectedSpaceId === space.id} className={selectedSpaceId === space.id ? "space-item selected" : "space-item"} key={space.id} onClick={() => onSelect(space.id)} type="button">
          <span className="space-icon">{renderIcon(space.iconKey)}</span>
          <span className="space-copy"><strong>{space.label}</strong><small>{space.description}</small></span>
          <span className="space-count" aria-label={`${space.unreadPresentationCount} 条演示未读`}>{space.presentationCount}</span>
        </button>
      ))}
    </div>
  );
}
