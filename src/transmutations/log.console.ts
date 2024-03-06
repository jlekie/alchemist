import { Transmutation } from '..';

class LogConsoleTransmutation implements Transmutation.TransmutationModule {
    public transmute(params: Transmutation.TransmuteContext) {
        return params.observable;
        // console.log('####')
        // params.observable.subscribe(context => {
        //     console.log('CONSOLE.LOG: ', context);
        //     params.next(context);
        // });
    }
}

export default (() => {
    return new LogConsoleTransmutation();
}) satisfies Transmutation.TransmutationModuleFunction;
