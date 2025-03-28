import React, { useEffect, useState } from "react";
import { randomIntFromInterval, useInterval } from "../lib/utils.jsx";
import "./Board.css";

class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor(value) {
    const node = new LinkedListNode(value);
    this.head = node;
    this.tail = node;
  }
}

const Direction = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

const BOARD_SIZE = 15;
const INITIAL_SPEED = 500; // Slow initial speed
const MIN_SPEED = 200; // Prevents excessive speed-up

const getStartingSnakeLLValue = (board) => {
  const rowSize = board.length;
  const colSize = board[0].length;
  const startingRow = Math.round(rowSize / 3);
  const startingCol = Math.round(colSize / 3);
  const startingCell = board[startingRow][startingCol];
  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  };
};

const Board = () => {
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState(createBoard(BOARD_SIZE));
  const [snake, setSnake] = useState(
    new LinkedList(getStartingSnakeLLValue(board))
  );
  const [snakeCells, setSnakeCells] = useState(new Set([snake.head.value.cell]));
  const [foodCell, setFoodCell] = useState(snake.head.value.cell + 5);
  const [direction, setDirection] = useState(Direction.RIGHT);
  const [isGameOver, setIsGameOver] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED); // Speed state

  useEffect(() => {
    const handleKeydown = (e) => {
      const newDirection = getDirectionFromKey(e.key);
      if (!newDirection) return;

      setDirection((prevDirection) =>
        getOppositeDirection(prevDirection) === newDirection
          ? prevDirection
          : newDirection
      );
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useInterval(() => {
    if (!isGameOver) moveSnake();
  }, speed);

  const moveSnake = () => {
    const currentHeadCoords = { row: snake.head.value.row, col: snake.head.value.col };
    const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction);

    if (isOutOfBounds(nextHeadCoords, board) || snakeCells.has(board[nextHeadCoords.row][nextHeadCoords.col])) {
      handleGameOver();
      return;
    }

    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col];
    const newHead = new LinkedListNode({ row: nextHeadCoords.row, col: nextHeadCoords.col, cell: nextHeadCell });

    snake.head.next = newHead;
    snake.head = newHead;

    const newSnakeCells = new Set(snakeCells);
    newSnakeCells.delete(snake.tail.value.cell);
    newSnakeCells.add(nextHeadCell);

    snake.tail = snake.tail.next || snake.head;

    if (nextHeadCell === foodCell) {
      growSnake(newSnakeCells);
      handleFoodConsumption(newSnakeCells);
    }

    setSnakeCells(newSnakeCells);
  };

  const growSnake = (newSnakeCells) => {
    const growthNodeCoords = getGrowthNodeCoords(snake.tail, direction);
    if (isOutOfBounds(growthNodeCoords, board)) return;

    const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col];
    const newTail = new LinkedListNode({ row: growthNodeCoords.row, col: growthNodeCoords.col, cell: newTailCell });

    newTail.next = snake.tail;
    snake.tail = newTail;
    newSnakeCells.add(newTailCell);
  };

  const handleFoodConsumption = (newSnakeCells) => {
    let nextFoodCell;
    do {
      nextFoodCell = randomIntFromInterval(1, BOARD_SIZE * BOARD_SIZE);
    } while (newSnakeCells.has(nextFoodCell) || foodCell === nextFoodCell);

    setFoodCell(nextFoodCell);
    setScore((prevScore) => prevScore + 1);
    setSpeed((prevSpeed) => Math.max(MIN_SPEED, prevSpeed - 20)); // Gradual speed-up
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const startGame = () => {
    setScore(0);
    const snakeLLStartingValue = getStartingSnakeLLValue(board);
    setSnake(new LinkedList(snakeLLStartingValue));
    setFoodCell(snakeLLStartingValue.cell + 5);
    setSnakeCells(new Set([snakeLLStartingValue.cell]));
    setDirection(Direction.RIGHT);
    setSpeed(INITIAL_SPEED);
    setIsGameOver(false);
  };

  return (
    <>
      <h1>Score: {score}</h1>
      {isGameOver ? (
        <button onClick={startGame} className="start-game-button">
          Start Game
        </button>
      ) : (
        <div className="board">
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="row">
              {row.map((cellValue, cellIdx) => (
                <div key={cellIdx} className={getCellClassName(cellValue, foodCell, snakeCells)}></div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const createBoard = (BOARD_SIZE) => {
  let counter = 1;
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => counter++)
  );
};

const getCoordsInDirection = (coords, direction) => {
  const movement = { UP: [-1, 0], RIGHT: [0, 1], DOWN: [1, 0], LEFT: [0, -1] }[direction];
  return { row: coords.row + movement[0], col: coords.col + movement[1] };
};

const isOutOfBounds = ({ row, col }, board) => row < 0 || col < 0 || row >= board.length || col >= board[0].length;

const getDirectionFromKey = (key) => ({ ArrowUp: "UP", ArrowRight: "RIGHT", ArrowDown: "DOWN", ArrowLeft: "LEFT" }[key] || "");

const getOppositeDirection = (direction) => ({ UP: "DOWN", RIGHT: "LEFT", DOWN: "UP", LEFT: "RIGHT" }[direction]);

const getGrowthNodeCoords = (snakeTail, currentDirection) => {
  return getCoordsInDirection(snakeTail.value, getOppositeDirection(getNextNodeDirection(snakeTail, currentDirection)));
};

const getNextNodeDirection = (node, currentDirection) => {
  if (!node.next) return currentDirection;
  return getDirectionFromKey({ row: node.value.row - node.next.value.row, col: node.value.col - node.next.value.col });
};

const getCellClassName = (cellValue, foodCell, snakeCells) => {
  if (cellValue === foodCell) return "cell cell-red";
  return snakeCells.has(cellValue) ? "cell cell-green" : "cell";
};

export default Board;
