import * as ParseHelpers from '@jlekie/parse-helpers';
import * as _ from 'lodash';

// export interface IContext {
//     [key: string]: any;
// }

export interface ContextOptions {
    qualifier?: string;
    keys?: string[];
}

export class Context {
    public static parse(hash: any, options?: ContextOptions | string) {
        const payload = ParseHelpers.sanitize('payload', () => {
            if (_.isArray(hash))
                return hash;
            else
                return ParseHelpers.sanitizeHash(hash);
        });

        return new Context(payload, options);
    }

    public payload: Record<string, any> | Array<any>;
    public qualifier?: string;
    public keys?: string[];

    public constructor(payload: Record<string, any>, options?: ContextOptions | string) {
        this.payload = payload;

        const parsedOptions = (() => {
            if (!options)
                return {};

            if (_.isString(options))
                return { qualifier: options };
            else
                return options;
        })();

        this.qualifier = parsedOptions.qualifier;
        this.keys = parsedOptions.keys;
    }

    public clone() {
        const payload = _.cloneDeep(this.payload);

        return new Context(payload, {
            qualifier: this.qualifier,
            keys: this.keys
        });
    }

    public toJson() {
        return this.payload;
    }
}