import { Logger } from 'pino';
import { MetricLogger } from './types.js';
export * from './types.js';
export declare function pinoCloudwatchMetrics({ defaultNamespace }?: {
    defaultNamespace?: string;
}): (logger: Logger) => MetricLogger;
//# sourceMappingURL=index.d.ts.map