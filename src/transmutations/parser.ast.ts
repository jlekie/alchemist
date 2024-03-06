// import * as Util from 'util';
// import * as Path from 'path';
// import * as FS from 'fs-extra';

// import { createToken, Lexer, CstParser, IRecognizerContext } from 'chevrotain';

// import { Transmutation, FluentTypebox } from '..';

// const identifierToken = createToken({ name: 'identifier', pattern: /[a-zA-Z][\w-]*/ });
// const versionToken = createToken({ name: 'version', pattern: /version/, longer_alt: identifierToken });
// const whitespaceToken = createToken({ name: 'whitespace', pattern: /\s+/, group: Lexer.SKIPPED });
// const lexer = new Lexer([ whitespaceToken, versionToken, identifierToken ]);

// class TestParser extends CstParser {
//     public constructor() {
//         super([ whitespaceToken, versionToken, identifierToken ]);

//         this.performSelfAnalysis();
//     }

//     public versionKeyword = this.RULE('versionKeyword', () => {
//         this.CONSUME(versionToken);
//         this.CONSUME(identifierToken);
//     });
// }
// const testParser = new TestParser();

// const BaseTestVisitor = testParser.getBaseCstVisitorConstructor();

// class TestVisitor extends BaseTestVisitor {
//     public constructor() {
//         super();

//         this.validateVisitor();
//     }

//     public versionKeyword(ctx: any) {
//         // console.log(ctx);

//         return {
//             type: 'VERSION_CLAUSE',
//             version: ctx.identifier[0].image
//         };
//     }
// }
// const testVisitor = new TestVisitor();

// interface AstTransmutationParams {
//     // path: InputTextFileTransmutation['path'];
// }
// class AstTransmutation implements Transmutation.TransmutationModule {
//     public constructor(params: AstTransmutationParams) {
//         // this.path = params.path;
//     }

//     public async transmute(context: unknown) {
//         console.log(context)

//         if (typeof context !== 'string')
//             throw new Error();

//         const tokenized = lexer.tokenize(context);

//         testParser.input = tokenized.tokens;
//         const cst = testParser.versionKeyword();
//         // console.log(Util.inspect(cst, undefined, 10, true))

//         const ast: unknown = testVisitor.visit(cst);
//         console.log(ast);

//         return ast;
//     }
// }

// const OptionsTypeCheck = FluentTypebox.FluentType.object({
//     // nodes: FluentTypebox.FluentType.unknown()
// }).compile();

// export default ((options, params) => {
//     if (!OptionsTypeCheck.check(options))
//         throw new FluentTypebox.FluentTypeCheckError('options validation failed', OptionsTypeCheck, options);

//     return new AstTransmutation({});
// }) satisfies Transmutation.TransmutationModuleFunction;
