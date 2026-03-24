import { Unit, } from './types.js';
export * from './types.js';
function buildEMF({ metrics, dimensions, namespace, }) {
    const metricDefs = Object.entries(metrics).map(([name, v]) => ({
        Name: name,
        Unit: typeof v === 'object' && v.unit ? v.unit : Unit.None,
    }));
    const metricValues = Object.fromEntries(Object.entries(metrics).map(([name, v]) => [
        name,
        typeof v === 'object' ? v.value : v,
    ]));
    const stringifiedDimensions = Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, String(value)]));
    return {
        _aws: {
            Timestamp: Date.now(),
            CloudWatchMetrics: [
                {
                    Namespace: namespace,
                    Dimensions: [Object.keys(dimensions)],
                    Metrics: metricDefs,
                },
            ],
        },
        ...stringifiedDimensions,
        ...metricValues,
    };
}
export function pinoCloudwatchMetrics({ defaultNamespace = 'Pino' } = {}) {
    return (logger) => {
        const extended = Object.create(logger);
        extended.increment = function (metricName) {
            return extended.metric({
                [metricName]: { value: 1, unit: Unit.Count },
            });
        };
        extended.metric = function (metrics) {
            const ctx = {
                metrics,
                dimensions: {},
                namespace: defaultNamespace,
            };
            const proxy = Object.create(logger);
            proxy.dimensions = (dims) => {
                ctx.dimensions = { ...ctx.dimensions, ...dims };
                return proxy;
            };
            proxy.namespace = (ns) => {
                ctx.namespace = ns;
                return proxy;
            };
            ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach((level) => {
                proxy[level] = (objOrMsg, maybeMsg, ...args) => {
                    const emf = buildEMF(ctx);
                    let obj = {};
                    let msg = maybeMsg;
                    if (typeof objOrMsg === 'object' && objOrMsg !== null) {
                        obj = objOrMsg;
                    }
                    else if (typeof objOrMsg === 'string') {
                        msg = objOrMsg;
                        args.unshift(maybeMsg);
                    }
                    const merged = { ...emf, ...obj };
                    return logger[level](merged, msg, ...args);
                };
            });
            return proxy;
        };
        return extended;
    };
}
