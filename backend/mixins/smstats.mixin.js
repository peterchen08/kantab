var swStats = require('swagger-stats');
var swaggerSpec = require('../../swagger.json');
var promClient = require('prom-client');
const tlBucket = 60000;


const swMiddleware = swStats.getMiddleware({
	name: 'swagger-stats',
	timelineBucketDuration: tlBucket,
	uriPath: '/dashboard',
	swaggerSpec: swaggerSpec,
});

// clears the promclient registry
const clearPrometheusMetrics = promClient.register.getMetricsAsJSON().then((metrics) =>
	metrics.forEach((metric) => {
		// let metric = metrics[metricId];
		promClient.register.removeSingleMetric(metric.name);
	}),
);

module.exports = function(){};
module.exports.swStats = swStats;
module.exports.swMiddleware = swMiddleware;
module.exports.clearPrometheusMetrics = clearPrometheusMetrics;