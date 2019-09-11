import * as ParseHelpers from '@jlekie/parse-helpers';
import * as _ from 'lodash';

// export interface IContext {
//     [key: string]: any;
// }

export class Context {
    public static parse(hash: any, qualifier?: string) {
        const payload = ParseHelpers.sanitize('payload', () => {
            if (_.isArray(hash))
                return hash;
            else
                return ParseHelpers.sanitizeHash(hash);
        });

        return new Context(payload, qualifier);
    }

    public payload: Record<string, any> | Array<any>;
    public qualifier?: string;

    public constructor(payload: Record<string, any>, qualifier?: string) {
        this.payload = payload;
        this.qualifier = qualifier;
    }

    public clone() {
        const payload = _.cloneDeep(this.payload);

        return new Context(payload, this.qualifier);
    }

    public toJson() {
        return this.payload;
    }
}