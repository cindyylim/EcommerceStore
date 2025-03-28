import React, { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { Users, Package, ShoppingBag, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const res = await axios.get("/api/analytics");
        setAnalyticsData(res.data.analyticsData);
        setDailySalesData(res.data.dailySalesData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Total Users"
          value={analyticsData.users.toLocaleString()}
          icon={Users}
          color="from-yellow-400 to-teal-700"
        />
        <AnalyticsCard
          title="Total Products"
          value={analyticsData.products.toLocaleString()}
          icon={Package}
          color="from-yellow-400 to-green-700"
        />
        <AnalyticsCard
          title="Total Sales"
          value={analyticsData.totalSales.toLocaleString()}
          icon={ShoppingBag}
          color="from-yellow-400 to-cyan-700"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`$${analyticsData.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="from-yellow-400 to-lime-700"
        />
      </div>
      <motion.div
        className="rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#D1D5DB" />
            <YAxis yAxisId="left" stroke="#D1D5DB" />
            <YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              activeDot={{ r: 8 }}
              name="Sales"
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82F6"
              activeDot={{ r: 8 }}
              name="Revenue"
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default Analytics;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    className={`rounded-lg p-6 shadow-lg overflow-hidden relative ${color}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex justify-between items-center">
      <div className="z-10">
        <p className="text-sm mb-1 font-semibold">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-yellow-900 opacity-30" />
      <div className="absolute -bottom-4 -right-4 text-yellow-800 opacity-50" />
      <Icon className="h-32 w-32"></Icon>
    </div>
  </motion.div>
);
