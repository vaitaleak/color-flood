import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const SIZES = [8, 12, 16];

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
const COLOR_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];

function createGrid(size: number): number[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.floor(Math.random() * COLORS.length))
  );
}

function flood(grid: number[][], oldColor: number, newColor: number): number[][] {
  if (oldColor === newColor) return grid;
  const size = grid.length;
  const g = grid.map(r => [...r]);
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (queue.length) {
    const [r, c] = queue.shift()!;
    if (g[r][c] !== oldColor) continue;
    g[r][c] = newColor;
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return g;
}

function isUniform(grid: number[][]): boolean {
  const first = grid[0][0];
  return grid.every(row => row.every(cell => cell === first));
}

export default function App() {
  const [sizeIdx, setSizeIdx] = useState(0);
  const size = SIZES[sizeIdx];
  const [grid, setGrid] = useState<number[][]>(() => createGrid(8));
  const [moves, setMoves] = useState(0);
  const [maxMoves, setMaxMoves] = useState(20);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);

  const cellSize = Math.floor((Math.min(width, 500) - 20) / size);

  useEffect(() => {
    if (!started || won || lost) return;
    const iv = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [started, won, lost]);

  const handleColor = useCallback((colorIdx: number) => {
    if (won || lost) return;
    if (colorIdx === grid[0][0]) return;
    if (!started) setStarted(true);

    const newGrid = flood(grid, grid[0][0], colorIdx);
    setGrid(newGrid);
    const nm = moves + 1;
    setMoves(nm);

    if (isUniform(newGrid)) {
      setWon(true);
    } else if (nm >= maxMoves) {
      setLost(true);
    }
  }, [grid, moves, won, lost, maxMoves, started]);

  const newGame = useCallback((idx: number) => {
    const s = SIZES[idx];
    setSizeIdx(idx);
    setGrid(createGrid(s));
    setMoves(0);
    setMaxMoves(Math.floor(s * s * 0.25));
    setWon(false);
    setLost(false);
    setTime(0);
    setStarted(false);
  }, []);

  const progress = () => {
    const first = grid[0][0];
    let count = 0;
    grid.forEach(row => row.forEach(cell => { if (cell === first) count++; }));
    return Math.round((count / (size * size)) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Color Flood</Text>

      <View style={styles.sizes}>
        {SIZES.map((s, i) => (
          <TouchableOpacity key={i} style={[styles.sizeBtn, sizeIdx === i && styles.sizeActive]} onPress={() => newGame(i)}>
            <Text style={[styles.sizeText, sizeIdx === i && styles.sizeTextActive]}>{s}×{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>Moves: {moves}/{maxMoves}</Text>
        <Text style={styles.stat}>Flood: {progress()}%</Text>
        <Text style={styles.stat}>⏱ {time}s</Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: size * cellSize, height: size * cellSize }]}>
          {grid.map((row, r) =>
            row.map((colorIdx, c) => (
              <View key={`${r}-${c}`} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: COLORS[colorIdx] }]} />
            ))
          )}
        </View>
      </View>

      <Text style={styles.pickText}>Pick a color:</Text>
      <View style={styles.palette}>
        {COLORS.map((color, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.paletteBtn, { backgroundColor: color }, grid[0]?.[0] === i && styles.paletteDisabled]}
            onPress={() => handleColor(i)}
            activeOpacity={0.7}
          />
        ))}
      </View>

      {(won || lost) && (
        <View style={styles.overlay}>
          <Text style={styles.resultText}>{won ? '🎉 Flooded!' : '😫 Out of moves!'}</Text>
          <Text style={styles.resultStats}>{moves} moves in {time}s</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => newGame(sizeIdx)}>
            <Text style={styles.playBtnText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', paddingTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  sizes: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  sizeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, backgroundColor: '#16213e' },
  sizeActive: { backgroundColor: '#3498db' },
  sizeText: { color: '#888', fontWeight: 'bold' },
  sizeTextActive: { color: '#fff' },
  stats: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  stat: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  board: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {},
  pickText: { color: '#888', fontSize: 14, marginBottom: 8 },
  palette: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  paletteBtn: { width: 50, height: 50, borderRadius: 25, elevation: 3 },
  paletteDisabled: { opacity: 0.3 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  resultText: { fontSize: 38, fontWeight: 'bold', color: '#fff' },
  resultStats: { fontSize: 16, color: '#aaa', marginTop: 5 },
  playBtn: { marginTop: 15, backgroundColor: '#3498db', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  playBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
