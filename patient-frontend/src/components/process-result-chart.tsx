'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart 
} from 'recharts';

interface ProcessResult {
  success: boolean;
  patient: {
    weight: {
      value: number;
      unit: string;
    };
    height: {
      value: number;
      unit: string;
    };
  };
  results: [number, number][];
}

interface AdvancedProcessResultChartProps {
  data: ProcessResult;
}

export default function AdvancedProcessResultChart({ data }: AdvancedProcessResultChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  
  const chartData = data.results.map(([value, index]) => ({
    index,
    value,
  }));

  const values = data.results.map(([value]) => value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate BMI if we have weight and height in compatible units
  const calculateBMI = () => {
    const weight = data.patient.weight;
    const height = data.patient.height;
    
    if (weight.unit === 'kg' && height.unit === 'm') {
      return (weight.value / (height.value * height.value)).toFixed(1);
    }
    return 'N/A';
  };

  const bmi = calculateBMI();

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Process Results Analysis</h3>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'line' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'area' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setChartType('area')}
          >
            Area Chart
          </button>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800">Max</div>
          <div className="text-xl font-bold text-blue-900">{maxValue}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-medium text-green-800">Min</div>
          <div className="text-xl font-bold text-green-900">{minValue}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-800">Average</div>
          <div className="text-xl font-bold text-purple-900">{avgValue.toFixed(1)}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-sm font-medium text-orange-800">BMI</div>
          <div className="text-xl font-bold text-orange-900">{bmi}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full border rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Data Distribution</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Data Points:</span>
              <span className="font-medium">{chartData.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Range:</span>
              <span className="font-medium">{minValue} - {maxValue}</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Deviation:</span>
              <span className="font-medium">
                {Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avgValue, 2), 0) / values.length).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Patient Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="font-medium">
                {data.patient.weight.value} {data.patient.weight.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Height:</span>
              <span className="font-medium">
                {data.patient.height.value} {data.patient.height.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>BMI Category:</span>
              <span className="font-medium">
                {bmi !== 'N/A' && parseFloat(bmi) < 18.5 ? 'Underweight' :
                 parseFloat(bmi) < 25 ? 'Normal' :
                 parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}