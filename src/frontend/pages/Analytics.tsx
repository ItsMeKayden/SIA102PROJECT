import '../styles/Pages.css';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
} from 'recharts';
import { FiTrendingUp, FiUsers, FiRotateCw, FiCalendar } from 'react-icons/fi';
import { getAnalyticsStats, getMonthlyConsultations, getWeeklyPerformance } from '../../backend/services/analyticsService';
import type { AnalyticsStats } from '../../types';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getMonth() + 1}-2026`);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = [2025, 2026, 2027]; // Adjust as needed
  const [monthlyConsultations, setMonthlyConsultations] = useState<{ month: string, count: number }[]>([]);
  const [monthlyPerformanceData, setMonthlyPerformanceData] = useState<{ month: string, value: number }[]>([]);
  const [performanceInsight, setPerformanceInsight] = useState<string>('');
  const [consultationInsight, setConsultationInsight] = useState<string>('');
  const [doctorInsight, setDoctorInsight] = useState<string>('');
  const [returnRateInsight, setReturnRateInsight] = useState<string>('');
  const [attendanceInsight, setAttendanceInsight] = useState<string>('');
  const [visitTrendsInsight, setVisitTrendsInsight] = useState<string>('');

  const generatePerformanceInsight = (data: { month: string, value: number }[]) => {
    if (data.length === 0) {
      setPerformanceInsight('No data available');
      return;
    }

    // Find best month
    const bestMonth = data.reduce((prev, current) => current.value > prev.value ? current : prev);
    
    // Calculate trend (first half vs second half average)
    const midpoint = Math.floor(data.length / 2);
    const firstHalfAvg = data.slice(0, midpoint).reduce((sum, m) => sum + m.value, 0) / midpoint;
    const secondHalfAvg = data.slice(midpoint).reduce((sum, m) => sum + m.value, 0) / (data.length - midpoint);
    const trendDirection = secondHalfAvg > firstHalfAvg ? 'upward' : 'downward';
    const trendPercent = Math.round(Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100));

    // Check last month vs average
    const lastMonth = data[data.length - 1];
    const overallAvg = Math.round(data.reduce((sum, m) => sum + m.value, 0) / data.length);
    const lastMonthStatus = lastMonth.value > overallAvg ? 'above average' : 'below average';

    // Generate insight
    let insight = `✓ ${bestMonth.month} was the top performing month (${bestMonth.value}% score). `;
    insight += `Overall performance shows a ${trendDirection} trend with ${trendPercent}% change. `;
    insight += `Current month is ${lastMonthStatus} (${lastMonth.value}% vs ${overallAvg}% average).`;

    setPerformanceInsight(insight);
  };

  const generateStatInsights = (statsData: AnalyticsStats) => {
    // Total Consultations Insight
    const consultCount = statsData.totalConsultations;
    if (consultCount === 0) {
      setConsultationInsight('No consultation data available');
    } else if (consultCount > 10) {
      setConsultationInsight(`Strong activity: ${consultCount} consultations indicate high clinic engagement`);
    } else if (consultCount > 5) {
      setConsultationInsight(`Moderate activity: ${consultCount} consultations this period`);
    } else {
      setConsultationInsight(`Low activity: Consider outreach to increase consultations`);
    }

    // Average Patients Per Doctor Insight
    const avgPatients = statsData.avgPatientsPerDoctor;
    if (avgPatients >= 5) {
      setDoctorInsight(`Each doctor manages ${avgPatients.toFixed(1)} patients on average - high workload`);
    } else if (avgPatients >= 2) {
      setDoctorInsight(`Each doctor manages ${avgPatients.toFixed(1)} patients on average - good balance`);
    } else {
      setDoctorInsight(`Each doctor manages ${avgPatients.toFixed(1)} patients - capacity available`);
    }

    // Patient Return Rate Insight
    const returnRate = statsData.patientReturnRate;
    if (returnRate >= 50) {
      setReturnRateInsight(`Excellent retention: ${returnRate.toFixed(1)}% of patients return - strong loyalty`);
    } else if (returnRate >= 20) {
      setReturnRateInsight(`Good retention: ${returnRate.toFixed(1)}% of patients return`);
    } else if (returnRate > 0) {
      setReturnRateInsight(`${returnRate.toFixed(1)}% patient return rate - focus on retention strategies`);
    } else {
      setReturnRateInsight('No returning patients yet - continue building trust');
    }

    // Attendance Rate Insight
    const attendRate = statsData.attendanceRate;
    if (attendRate >= 95) {
      setAttendanceInsight(`Outstanding: ${Math.round(attendRate)}% staff attendance rate`);
    } else if (attendRate >= 85) {
      setAttendanceInsight(`Good: ${Math.round(attendRate)}% staff attendance rate`);
    } else if (attendRate >= 70) {
      setAttendanceInsight(`Fair: ${Math.round(attendRate)}% attendance - monitor closely`);
    } else {
      setAttendanceInsight(`Low: ${Math.round(attendRate)}% attendance - address absences`);
    }
  };

  const generateVisitTrendsInsight = (data: { month: string; count: number }[]) => {
    if (data.length === 0) {
      setVisitTrendsInsight('No visit data available');
      return;
    }

    // Find peak month
    const peakMonth = data.reduce((prev, current) => current.count > prev.count ? current : prev);
    
    // Calculate average
    const avgVisits = Math.round(data.reduce((sum, m) => sum + m.count, 0) / data.length);
    
    // Calculate trend
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstHalfAvg = Math.round(firstHalf.reduce((sum, m) => sum + m.count, 0) / firstHalf.length);
    const secondHalfAvg = Math.round(secondHalf.reduce((sum, m) => sum + m.count, 0) / secondHalf.length);
    const trendDirection = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
    const trendChange = Math.round(Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100));

    // Generate insights
    let insight = `• Peak: ${peakMonth.month} with ${peakMonth.count} visits. `;
    insight += `• Average: ${avgVisits} visits/month. `;
    insight += `• Trend: ${trendDirection} by ${trendChange}%. `;
    insight += `• Action: ${secondHalfAvg < firstHalfAvg ? 'Visit volume declining - consider marketing initiatives' : 'Strong upward momentum - maintain current strategies'}`;

    setVisitTrendsInsight(insight);
  };

  const fetchAnalyticsData = async (month?: string) => {
    setLoading(true);
    try {
      const { data: analytics, error: analyticsError } = await getAnalyticsStats(month);

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
        setError(`Failed to load analytics data: ${analyticsError}`);
        return;
      }

      if (!analytics) {
        console.warn('No analytics data returned');
        setError('Failed to load analytics data: No data returned');
        return;
      }

      setStats(analytics);
      generateStatInsights(analytics);
    } catch (error) {
      console.error('Analytics fetch exception:', error);
      setError(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyConsultations = async () => {
    try {
      const { data, error } = await getMonthlyConsultations();
      if (error) {
        console.error('Monthly consultations error:', error);
        return;
      }
      if (data) {
        setMonthlyConsultations(data);
        generateVisitTrendsInsight(data);
      }
    } catch (error) {
      console.error('Monthly consultations fetch exception:', error);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchMonthlyConsultations();
    // Don't fetch monthly performance on initial load - wait for month selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch data when month changes
  useEffect(() => {
    const [month, year] = selectedMonth.split('-');
    const monthIndex = parseInt(month);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthYear = `${monthNames[monthIndex - 1]} ${year}`;
    
    const loadMonthData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, consultRes, perfRes] = await Promise.all([
          getAnalyticsStats(monthYear),
          getMonthlyConsultations(),
          getWeeklyPerformance(monthYear)
        ]);
        
        if (analyticsRes.error) {
          console.error('Analytics error:', analyticsRes.error);
        } else if (analyticsRes.data) {
          setStats(analyticsRes.data);
          generateStatInsights(analyticsRes.data);
        }
        
        if (consultRes.error) {
          console.error('Consultations error:', consultRes.error);
        } else if (consultRes.data) {
          setMonthlyConsultations(consultRes.data);
          generateVisitTrendsInsight(consultRes.data);
        }
        
        if (perfRes.error) {
          console.error('Performance error:', perfRes.error);
        } else if (perfRes.data) {
          // Map week data to the same format as monthly data for the chart
          const mappedData = perfRes.data.map(item => ({
            month: item.week,
            value: item.value
          }));
          setMonthlyPerformanceData(mappedData);
          generatePerformanceInsight(mappedData);
        }
      } catch (error) {
        console.error('Failed to load month data:', error);
        setError(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadMonthData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div style={{ 
        padding: 'max(12px, 2vw)', 
        width: '100%', 
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: 'max(12px, 2vw)', 
        width: '100%', 
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  // Chart data variables

  return (
    <div style={{ 
      padding: 'max(12px, 2vw)', 
      width: '100%', 
      maxWidth: '1400px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Staff Activity Overview */}
      <Box sx={{ 
        padding: { xs: '8px 0', sm: '12px 0' }, 
        mb: { xs: 1.5, sm: 2 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        flexWrap: { xs: 'wrap', md: 'nowrap' }
      }}>
        <Typography sx={{ fontSize: { xs: '20px', sm: '24px', md: '28px' }, fontWeight: 'bold' }}>Staff Activity Overview</Typography>
        <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 }, flexShrink: 0 }}>
          <InputLabel id="month-year-picker-label" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Month/Year</InputLabel>
          <Select
            labelId="month-year-picker-label"
            value={selectedMonth}
            label="Month/Year"
            onChange={e => setSelectedMonth(e.target.value)}
            sx={{ fontSize: { xs: '12px', sm: '14px' } }}
          >
            {years.flatMap(year => months.map((month, idx) => (
              <MenuItem key={`${month}-${year}`} value={`${idx + 1}-${year}`} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{`${month} ${year}`}</MenuItem>
            )))}
          </Select>
        </FormControl>
      </Box>

      

      {/* Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1, sm: 1.5, md: 2 },
          mb: { xs: 2, md: 4 },
          width: '100%',
        }}
      >
        {/* Total Consultation */}
        <Card sx={{ background: '#ffffff', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <FiTrendingUp size={32} color="#22c55e" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                Total Consultations
              </Typography>
              <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 'bold', color: '#22c55e' }}>
                {stats ? `${stats.totalConsultations}` : '--'}
              </Typography>
              <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#666', lineHeight: 1.3, mt: 0.5 }}>
                {consultationInsight}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Avg Patients Per Doctor */}
        <Card sx={{ background: '#ffffff', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <FiUsers size={32} color="#3b82f6" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                Avg Patients Per Doctor
              </Typography>
              <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 'bold', color: '#3b82f6' }}>
                {stats ? `${stats.avgPatientsPerDoctor.toFixed(1)}` : '--'}
              </Typography>
              <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#666', lineHeight: 1.3, mt: 0.5 }}>
                {doctorInsight}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Patient Return Rate */}
        <Card sx={{ background: '#ffffff', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <FiRotateCw size={32} color="#f59e0b" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                Patient Return Rate
              </Typography>
              <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 'bold', color: '#f59e0b' }}>
                {stats ? `${stats.patientReturnRate.toFixed(1)}%` : '--'}
              </Typography>
              <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#666', lineHeight: 1.3, mt: 0.5 }}>
                {returnRateInsight}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card sx={{ background: '#ffffff', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <FiCalendar size={32} color="#22c55e" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                Attendance Rate
              </Typography>
              <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 'bold', color: '#22c55e' }}>
                {stats ? `${Math.round(stats.attendanceRate)}%` : '--'}
              </Typography>
              <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, color: '#666', lineHeight: 1.3, mt: 0.5 }}>
                {attendanceInsight}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>


      {/* Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: { xs: 1.5, md: 3 },
          mb: 4,
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* Monthly Performance */}
        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', minHeight: { xs: 'auto', md: '420px' } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: { xs: '14px', sm: '15px', md: '16px' }, fontWeight: 'bold', color: '#3b82f6' }}>
                Monthly Performance
              </Typography>
            </Box>
            <Box sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto' }}>
              {monthlyPerformanceData && monthlyPerformanceData.length > 0 ? (
                <LineChart width={500} height={300} data={monthlyPerformanceData} margin={{ top: 5, right: 30, bottom: 5, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} width={35} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%', color: '#9ca3af' }}>
                  <Typography>No data available</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ borderTop: '2px solid #d1d5db', pt: 1.5, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: { xs: '14px', sm: '16px', md: '18px' } }}>📌</Typography>
                <Box>
                  <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, fontWeight: 'bold', color: '#666', mb: 0.5 }}>
                    Insight
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#555', lineHeight: 1.4 }}>
                    {performanceInsight}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right Column: Patient Visit Trends and Insight & Alerts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 3 }, width: '100%' }}>
          {/* Patient Visit Trends */}
          <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', gap: 2 }}>
              <Typography sx={{ fontSize: { xs: '14px', sm: '15px', md: '16px' }, fontWeight: 'bold', mb: 1 }}>
                Patient Visit Trends
              </Typography>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto' }}>
                {monthlyConsultations && monthlyConsultations.length > 0 ? (
                  <BarChart width={500} height={300} data={monthlyConsultations} margin={{ top: 5, right: 30, bottom: 5, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} width={35} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%', color: '#9ca3af' }}>
                    <Typography>No data available</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Insight & Alerts Card */}
          <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Typography sx={{ fontSize: { xs: '16px', sm: '18px', md: '20px' }, flexShrink: 0 }}>✓</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, fontWeight: 'bold', mb: 1 }}>
                    Insight & Alerts
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#555', lineHeight: 1.5, word: 'break-word', overflowWrap: 'break-word' }}>
                    {visitTrendsInsight}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </div>
  );
};

export default Analytics;
