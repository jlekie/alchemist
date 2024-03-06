import _ from 'lodash';
import { ConstructorParameters } from './misc';

export interface ContextMatchParams {
    included: Record<string, string>;
    excluded: Record<string, string>;
}
export class Context<T = unknown> {
    public static create<T>(payload: T, { labels, metadata }: Partial<{ labels?: Record<string, string | string[] | null | undefined> | undefined, metadata?: Record<string, unknown> | undefined }> = {}) {
        return new Context<T>({
            payload,
            labels,
            metadata
        });
    }

    public payload: T;
    public labels: Record<string, string[]>;
    public metadata: Record<string, unknown>;

    public constructor(params: { payload: T, labels?: Record<string, string | string[] | null | undefined> | undefined, metadata?: Record<string, unknown> | undefined }) {
        this.payload = params.payload;
        this.labels = _.transform(params.labels ?? {}, (labels, value, key) => {
            if (value)
                labels[key] = typeof value === 'string' ? [ value ] : value
        }, {} as Record<string, string[]>);
        this.metadata = params.metadata ?? {};
    }

    public forward<FT>(payload: FT, { labels, metadata }: Partial<{ labels?: Record<string, string | string[] | null | undefined> | undefined, metadata?: Record<string, unknown> | undefined }> = {}) {
        return Context.create<FT>(payload, {
            labels: {
                ...this.labels,
                ..._(labels).toPairs().filter(p => p[1] !== undefined).fromPairs().value()
            },
            metadata: {
                ...this.metadata,
                ..._(metadata).toPairs().filter(p => p[1] !== undefined).fromPairs().value()
            }
        });
    }

    public isMatch({ included = {}, excluded = {} }: ContextMatchParams) {
        return _.every(included, (value, key) => {
            return this.labels[key]?.some(l => l === value) ?? false;
        }) || !_.some(excluded, (value, key) => {
            return this.labels[key]?.some(l => l === value) ?? false;
        });
    }
}
