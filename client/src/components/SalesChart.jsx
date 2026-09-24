import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = ({
  type = 'line',
  labels = [],
  data = [],
  title = 'Sales Revenue ($)',
  borderColor = '#ff9900',
  backgroundColor = 'rgba(255, 153, 0, 0.12)'
}) => {
  const chartData = {
    labels: labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: title,
        data: data.length > 0 ? data : [1200, 1900, 2400, 2100, 2900, 3400, 3900],
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: borderColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#131921',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: function (context) {
            return ` ${title}: $${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { family: 'Inter', size: 12 },
          color: '#64748b'
        }
      },
      y: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          font: { family: 'Inter', size: 12 },
          color: '#64748b',
          callback: function (value) {
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      {type === 'bar' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default SalesChart;
