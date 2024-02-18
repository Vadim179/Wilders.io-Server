export const Spawners = Object.freeze([{ x: 0, y: 0 }]);

export const GameMap = Object.freeze({
  width: 1000,
  height: 1000,
  entities: [
    { type: "LARGE_ROCK", radius: 60, x: 350, y: 50, id: "rock1" },
    { type: "MEDIUM_DARK_OAK_TREE", radius: 60, x: 500, y: 250, id: "tree1" },
    { type: "LARGE_OAK_TREE", radius: 60, x: 650, y: 150, id: "tree2" },
  ],
});
