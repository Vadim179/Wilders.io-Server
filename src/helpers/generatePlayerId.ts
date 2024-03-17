const availableIds = new Array(100).fill(0).map((_, i) => i + 1);

export function generatePlayerId() {
  return availableIds.shift() ?? Math.floor(Math.random() * 1000000);
}

export function releasePlayerId(id: number) {
  availableIds.unshift(id);
}
