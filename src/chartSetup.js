import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement, CategoryScale, LinearScale, LogarithmicScale,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend
);
