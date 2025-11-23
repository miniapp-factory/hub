"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function randomTileValue() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function emptyPositions(grid: number[][]) {
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(grid: number[][]) {
  const empties = emptyPositions(grid);
  if (empties.length === 0) return grid;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = randomTileValue();
  return newGrid;
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function transpose(grid: number[][]) {
  return grid[0].map((_, i) => grid.map(row => row[i]));
}

export function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let g = addRandomTile(grid);
    g = addRandomTile(g);
    setGrid(g);
  }, []);

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let newGrid = grid;
    let moved = false;
    let newScore = score;

    const apply = (arr: number[]) => {
      const merged = slideAndMerge(arr);
      if (!moved && merged.some((v, i) => v !== arr[i])) moved = true;
      return merged;
    };

    if (direction === "left") {
      newGrid = newGrid.map(apply);
    } else if (direction === "right") {
      newGrid = newGrid.map(row => apply(row.reverse()).reverse());
    } else if (direction === "up") {
      newGrid = transpose(newGrid).map(apply);
      newGrid = transpose(newGrid);
    } else if (direction === "down") {
      newGrid = transpose(newGrid).map(row => apply(row.reverse()).reverse());
      newGrid = transpose(newGrid);
    }

    if (!moved) return;

    // Update score
    newGrid.forEach(row => row.forEach(val => {
      if (val > 0 && !grid.flat().includes(val)) newScore += val;
    }));

    setGrid(newGrid);
    setScore(newScore);

    // Check for win
    if (newGrid.flat().includes(2048)) {
      setGameOver(true);
    } else {
      // Add new tile
      const afterTile = addRandomTile(newGrid);
      setGrid(afterTile);
      // Check for game over
      const hasMoves = emptyPositions(afterTile).length > 0 ||
        afterTile.some((row, r) =>
          row.some((val, c) => {
            if (val === 0) return false;
            if (c + 1 < SIZE && afterTile[r][c + 1] === val) return true;
            if (r + 1 < SIZE && afterTile[r + 1][c] === val) return true;
            return false;
          })
        );
      if (!hasMoves) setGameOver(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className="w-16 h-16 flex items-center justify-center rounded-md bg-muted text-xl font-bold"
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button onClick={() => move("up")}>↑</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => move("left")}>←</Button>
          <Button onClick={() => move("down")}>↓</Button>
          <Button onClick={() => move("right")}>→</Button>
        </div>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-semibold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
