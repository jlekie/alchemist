import { FluentTypeCheck, FluentTypeBuilderBase, Static } from '@jlekie/fluent-typebox';

export type ExtractTypeSchema<P> = P extends FluentTypeCheck<infer T>
    ? Static<T>
    : P extends FluentTypeBuilderBase<infer T>
        ? Static<T>
        : never;

export type ConstructorParams<T> = {
    [K in keyof T as undefined extends T[K] ? K : never]: T[K] | undefined
} & {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
};

export type ConstructorParameters<T, RK extends keyof T = keyof T, OK extends keyof T = never, E = object> = ConstructorParams<
    Pick<T, RK>
    & Partial<Pick<T, OK>>
> & E;

export class Lazy<T> {
    private factory: () => T;

    private resolvedValue!: T;
    private resolved: boolean = false;

    public constructor(factory: () => T) {
        this.factory = factory;
    }

    public get value() {
        if (!this.resolved) {
            this.resolvedValue = this.factory();
            this.resolved = true;
        }

        return this.resolvedValue;
    }
}
