const availableIdMap: Record<string, number[]> = {};

export function generateEntityId(entityTag: string) {
  if (!availableIdMap[entityTag]) {
    availableIdMap[entityTag] = Array.from({ length: 100 }, (_, i) => i);
  }

  return (
    availableIdMap[entityTag].shift() ?? Math.floor(Math.random() * 1000000)
  );
}

export function releaseEntityId(entityTag: string, id: number) {
  availableIdMap[entityTag].unshift(id);
}
