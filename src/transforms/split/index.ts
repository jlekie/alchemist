import * as _ from 'lodash';

import { TransformationHandler, Context } from '../..';

export const name = 'Split';

export const handler: TransformationHandler = (context, options, params) => {
    const splitContexts: Context[] = [];

    if (_.isArray(context.payload)) {
        splitContexts.push(...context.payload.map(c => Context.parse(c)));
    }
    else {
        for (const key in context.payload) {
            splitContexts.push(Context.parse(context.payload[key], key));
        }
    }

    return splitContexts;
};