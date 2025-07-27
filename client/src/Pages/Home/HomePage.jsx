import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Database, Globe, Activity } from 'lucide-react';
import { appConfig, getTotalEndpoints, buildApiUrl } from './config';

const HomePage = () => {
  const [serviceStatus, setServiceStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const checkServiceHealth = async (service) => {
    const startTime = Date.now();
    try {
      const response = await fetch(buildApiUrl(service.healthEndpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        return { 
          status: 'online', 
          data, 
          responseTime,
          lastChecked: new Date().toISOString()
        };
      } else {
        return { 
          status: 'offline', 
          error: response.statusText,
          responseTime,
          lastChecked: new Date().toISOString()
        };
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      return { 
        status: 'offline', 
        error: error.message,
        responseTime,
        lastChecked: new Date().toISOString()
      };
    }
  };

  useEffect(() => {
    const checkAllServices = async () => {
      const statuses = {};

      for (const service of appConfig.services) {
        const result = await checkServiceHealth(service);
        statuses[service.id] = result;
      }

      setServiceStatus(statuses);
      setLoading(false);
    };

    checkAllServices();

    const interval = setInterval(checkAllServices, appConfig.api.healthCheckInterval);

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    if (loading) return 'checking';

    const statuses = Object.values(serviceStatus);
    const onlineServices = statuses.filter((s) => s.status === 'online').length;
    const totalServices = statuses.length;

    if (onlineServices === totalServices) return 'all-operational';
    if (onlineServices > totalServices / 2) return 'partial-outage';
    return 'major-outage';
  };

  const getStatusMessage = () => {
    const overall = getOverallStatus();
    switch (overall) {
      case 'checking':
        return appConfig.statusMessages.checking;
      case 'all-operational':
        return appConfig.statusMessages.allOperational;
      case 'partial-outage':
        return appConfig.statusMessages.partialOutage;
      case 'major-outage':
        return appConfig.statusMessages.majorOutage;
      default:
        return appConfig.statusMessages.unknown;
    }
  };

  const getStatusColor = () => {
    const overall = getOverallStatus();
    switch (overall) {
      case 'checking':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'all-operational':
        return 'text-white bg-white/10 border-white/30';
      case 'partial-outage':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'major-outage':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const StatusIndicator = ({ status, compact = false }) => {
    if (loading) {
      return (
        <div className={`flex items-center ${compact ? 'text-sm' : ''}`}>
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
          <span className="font-medium text-gray-400">Checking...</span>
        </div>
      );
    }

    if (status === 'online') {
      return (
        <div className={`flex items-center ${compact ? 'text-sm' : ''}`}>
          <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
          <span className="font-medium text-white">Operational</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center ${compact ? 'text-sm' : ''}`}>
        <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
        <span className="font-medium text-red-400">Offline</span>
      </div>
    );
  };

  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    if (typeof bytes === 'string' && bytes.includes('MB')) return bytes;
    
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatCpuUsage = (cpuArray) => {
    if (!cpuArray || !Array.isArray(cpuArray)) return 'N/A';
    const average = cpuArray.reduce((sum, cpu) => sum + cpu, 0) / cpuArray.length;
    return `${average.toFixed(1)}%`;
  };

  // Helper function to format uptime
  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    if (typeof uptime === 'string') return uptime;
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const HealthMetrics = ({ healthData, responseTime }) => {
    if (!healthData?.data || !appConfig.healthDisplay.showDetailedMetrics) return null;

    const { application, system } = healthData.data;

    return (
      <div className="mt-4 p-4 bg-black/20 rounded-xl border border-gray-700/30">
        <h5 className="text-sm font-semibold text-white mb-3">Health Metrics</h5>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Response Time */}
          {appConfig.healthDisplay.metricsToShow.responseTime && (
            <div className="flex justify-between">
              <span className="text-gray-400">Response Time:</span>
              <span className="text-white font-medium">{responseTime}ms</span>
            </div>
          )}

          {/* Environment */}
          {appConfig.healthDisplay.metricsToShow.environment && application?.environment && (
            <div className="flex justify-between">
              <span className="text-gray-400">Environment:</span>
              <span className="text-white font-medium capitalize">{application.environment}</span>
            </div>
          )}

          {/* Uptime */}
          {appConfig.healthDisplay.metricsToShow.uptime && application?.uptime && (
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime:</span>
              <span className="text-white font-medium">{formatUptime(application.uptime)}</span>
            </div>
          )}

          {/* Memory Usage */}
          {appConfig.healthDisplay.metricsToShow.memoryUsage && application?.memoryUsage && (
            <div className="flex justify-between">
              <span className="text-gray-400">Heap Used:</span>
              <span className="text-white font-medium">{formatMemory(application.memoryUsage.heapUsed)}</span>
            </div>
          )}

          {/* CPU Usage */}
          {appConfig.healthDisplay.metricsToShow.cpuUsage && system?.cpuUsage && (
            <div className="flex justify-between">
              <span className="text-gray-400">CPU Usage:</span>
              <span className="text-white font-medium">{formatCpuUsage(system.cpuUsage)}</span>
            </div>
          )}

          {/* Free Memory */}
          {system?.freeMemory && (
            <div className="flex justify-between">
              <span className="text-gray-400">Free Memory:</span>
              <span className="text-white font-medium">{formatMemory(system.freeMemory)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-[rgba(255,255,255,0.8)] opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-[rgba(255,255,255,0.8)]/20 rounded-full backdrop-blur-sm border border-[rgba(255,255,255,0.8)]/30">
              {appConfig.company.name}
                {/* <img 
                  src={appConfig.company.logoPath} 
                  alt={`${appConfig.company.name} logo`} 
                  
                /> */}
              </div>
            </div>

            <h1 className="text-6xl font-bold text-white mb-4">
              {appConfig.company.fullName}
            </h1>
            <div className="text-sm text-[rgba(255,255,255,0.8)] mb-6">
              {appConfig.company.tagline}
            </div>
            <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {appConfig.company.description}
            </p>

            <div className={`inline-flex items-center px-8 py-4 rounded-2xl border-2 ${getStatusColor()} backdrop-blur-sm`}>
              <div className="flex items-center space-x-3">
                {loading ? (
                  <Clock className="w-6 h-6 animate-spin" />
                ) : getOverallStatus() === 'all-operational' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span className="text-xl font-semibold">{getStatusMessage()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="bg-[rgba(255,255,255,0.8)]/10 backdrop-blur-sm rounded-3xl p-8 border border-[rgba(255,255,255,0.8)]/20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-black/30 rounded-2xl p-6 border border-[rgba(255,255,255,0.8)]/20">
              <Database className="w-8 h-8 text-[rgba(255,255,255,0.8)] mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{appConfig.services.length}</div>
              <div className="text-gray-300 font-medium">Total Services</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-6 border border-[rgba(255,255,255,0.8)]/20">
              <Globe className="w-8 h-8 text-[rgba(255,255,255,0.8)] mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{getTotalEndpoints()}</div>
              <div className="text-gray-300 font-medium">Total Endpoints</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-6 border border-[rgba(255,255,255,0.8)]/20">
              <CheckCircle className="w-8 h-8 text-[rgba(255,255,255,0.8)] mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">
                {Object.values(serviceStatus).filter((s) => s?.status === 'online').length}
              </div>
              <div className="text-gray-300 font-medium">Services Online</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-6 border border-[rgba(255,255,255,0.8)]/20">
              <Activity className="w-8 h-8 text-[rgba(255,255,255,0.8)] mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{appConfig.company.uptimeTarget}</div>
              <div className="text-gray-300 font-medium">Uptime Target</div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {appConfig.services.map((service, index) => {
            const Icon = service.icon;
            const status = serviceStatus[service.id];

            return (
              <div
                key={service.id}
                className="bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-lg hover:shadow-2xl hover:border-[rgba(255,255,255,0.8)]/30 transition-all duration-300 overflow-hidden"
              >
 
                <div className="p-8 border-b border-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${service.color} text-white shadow-lg`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                        <p className="text-gray-400 mb-3 leading-relaxed">{service.description}</p>
                        <div className="flex items-center space-x-4">
                          <StatusIndicator status={status?.status} compact />
                          <span className="text-sm text-gray-500">{service.endpoints.length} endpoints</span>
                          {status?.responseTime && (
                            <span className="text-sm text-gray-500">{status.responseTime}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="p-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Available Endpoints:</h4>
                  <div className="grid gap-3">
                    {service.endpoints.map((endpoint, endpointIndex) => (
                      <div
                        key={endpointIndex}
                        className="flex items-center space-x-3 p-3 bg-black/30 rounded-xl border border-gray-700/30 hover:border-[rgba(255,255,255,0.8)]/30 transition-colors"
                      >
                        <div className="w-2 h-2 bg-[rgba(255,255,255,0.8)] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-300 font-medium">{endpoint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        <div className="text-center mt-16 bg-[rgba(255,255,255,0.8)]/10 backdrop-blur-sm rounded-3xl p-8 border border-[rgba(255,255,255,0.8)]/20">
          <h3 className="text-xl font-semibold text-white mb-4">Monitoring Information</h3>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <div className="font-semibold mb-2 text-[rgba(255,255,255,0.8)]">Real-time Updates</div>
              <p className="text-sm">{appConfig.monitoring.realTimeUpdates}</p>
            </div>
            <div>
              <div className="font-semibold mb-2 text-[rgba(255,255,255,0.8)]">Last Updated</div>
              <p className="text-sm">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <div className="font-semibold mb-2 text-[rgba(255,255,255,0.8)]">Service Coverage</div>
              <p className="text-sm">{appConfig.monitoring.serviceCoverage}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[rgba(255,255,255,0.8)]/10 backdrop-blur-sm rounded-3xl p-8 border border-[rgba(255,255,255,0.8)]/20">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">System Health Metrics</h3>
          
          {(() => {
            // Get health data from the main health service or first available online service
            const healthService = serviceStatus['health'] || Object.values(serviceStatus).find(s => s?.status === 'online' && s?.data?.data);
            
            if (!healthService?.data?.data) {
              return (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No health metrics available</div>
                  <div className="text-sm text-gray-500">Services must be online to display health data</div>
                </div>
              );
            }

            const { application, system } = healthService.data.data;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {/* Environment */}
                {appConfig.healthDisplay.metricsToShow.environment && application?.environment && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Environment:</span>
                    <span className="text-white font-medium capitalize">{application.environment}</span>
                  </div>
                )}

                {/* Uptime */}
                {appConfig.healthDisplay.metricsToShow.uptime && application?.uptime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span className="text-white font-medium">{formatUptime(application.uptime)}</span>
                  </div>
                )}

                {/* Memory Usage */}
                {appConfig.healthDisplay.metricsToShow.memoryUsage && application?.memoryUsage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heap Used:</span>
                    <span className="text-white font-medium">{formatMemory(application.memoryUsage.heapUsed)}</span>
                  </div>
                )}

                {/* CPU Usage */}
                {appConfig.healthDisplay.metricsToShow.cpuUsage && system?.cpuUsage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Usage:</span>
                    <span className="text-white font-medium">{formatCpuUsage(system.cpuUsage)}</span>
                  </div>
                )}

                {/* Free Memory */}
                {system?.freeMemory && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Free Memory:</span>
                    <span className="text-white font-medium">{formatMemory(system.freeMemory)}</span>
                  </div>
                )}

                {/* Total Memory */}
                {system?.totalMemory && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Memory:</span>
                    <span className="text-white font-medium">{formatMemory(system.totalMemory)}</span>
                  </div>
                )}

                {/* Heap Total */}
                {application?.memoryUsage?.heapTotal && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heap Total:</span>
                    <span className="text-white font-medium">{formatMemory(application.memoryUsage.heapTotal)}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default HomePage;