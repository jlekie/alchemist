import * as _ from 'lodash';
import { FluentType as FT, FluentTypeCheck, FluentTypeBuilderBase, Static } from '@jlekie/fluent-typebox';

import { ConstructorParameters } from '../misc';

// const ParamsType = FT.tuple([  ])

// type ParseFunction<ST, CT> = (value: ExtractTypeSchema<ST>) => CT;
// type ParseFunction<ST, CT extends new (params: ConstructorParameters<CT>[0]) => InstanceType<CT>> = (value: ExtractTypeSchema<ST>, Type: new (params: ConstructorParameters<CT>[0]) => InstanceType<CT>) => InstanceType<CT>;

// type ParseFunction<ST, CT> = CT extends new (...args: any[]) => any
//     ? (value: ExtractTypeSchema<ST>, Type: new (params: ConstructorParameters<CT>[0]) => InstanceType<CT>) => InstanceType<CT>
//     : (value: ExtractTypeSchema<ST>) => CT;
// function createParser<ST, CT>(schema: ST, parser: (value: ExtractTypeSchema<ST>) => CT): (value: ST) => CT;
// function createParser<ST, CT extends new (...args: any[]) => any>(schema: ST, Type: CT, parser: (value: ExtractTypeSchema<ST>, Type: new (params: ConstructorParameters<CT>[0]) => InstanceType<CT>) => InstanceType<CT>): (value: ST) => InstanceType<CT>;
// function createParser<ST, CT>(...params: unknown[]): unknown {
//     if (params.length === 2) {
//         const schema = params[0] as ST;
//         const parser = params[1] as (value: ExtractTypeSchema<ST>) => CT;

//         return (value: ExtractTypeSchema<ST>) => parser(value);
//     }
//     else if (params.length === 3) {
//         const schema = params[0] as ST;
//         const Type = params[1] as CT;
//         const parser = params[2] as (value: ExtractTypeSchema<ST>, Type: CT) => CT;

//         return (value: ExtractTypeSchema<ST>) => parser(value, Type);
//     }
//     else {
//         throw new Error('invalid method call');
//     }
// }

export const ExplicitImportDeclarationType = FT.object({
    name: FT.string(),
    alias: FT.string().optional()
});
export const ExplicitImportType = FT.object({
    type: FT.literal('explicit'),
    declarations: ExplicitImportDeclarationType.array().optional()
});
export const EntireModuleImportType = FT.object({
    type: FT.literal('entireModule'),
    variableName: FT.string()
});
export const ModuleDefaultImportType = FT.object({
    type: FT.literal('moduleDefault'),
    variableName: FT.string()
});
export const ImportType = FT.union([ ExplicitImportType, EntireModuleImportType, ModuleDefaultImportType ]);

export const ExplicitExportDeclarationType = FT.object({
    name: FT.string(),
    alias: FT.string().optional()
});
export const ExplicitExportType = FT.object({
    type: FT.literal('explicit'),
    module: FT.string(),
    declarations: ExplicitExportDeclarationType.array().optional()
});
export const EntireModuleExportType = FT.object({
    type: FT.literal('entireModule'),
    module: FT.string()
});
export const DefaultModuleExportType = FT.object({
    type: FT.literal('moduleDefault'),
    variableName: FT.string()
});
export const ExportType = FT.union([ ExplicitExportType, EntireModuleExportType, DefaultModuleExportType ]);

export const DocumentType = FT.object({
    imports: ImportType.array().optional(),
    exports: ExportType.array().optional()
});
export const DocumentTypeChecker = DocumentType.compile();

export enum AccessModifiers {
    Public = 'public',
    Protected = 'protected',
    Private = 'private'
}

export class Document {
    public header: string | undefined;
    public imports: Import[];
    public exports: unknown[];
    public declarations: Declaration[];

    public constructor(params: ConstructorParameters<Document, 'header', 'imports' | 'exports' | 'declarations'>) {
        this.header = params.header;
        this.imports = params.imports ?? [];
        this.exports = params.exports ?? [];
        this.declarations = params.declarations ?? [];
    }
}
// export function parseDocument(value: ExtractTypeSchema<typeof DocumentType>) {
//     return new Document({
//         imports: value.imports?.map(i => parseImport(i)),
//         exports: value.exports
//     });
// }
// export const parseDocument = createParser(DocumentType, Document, (value, Type) => {
//     return new Type({
//         imports: value.imports,
//         exports: value.exports
//     });
// });

// const t = {}
// if (DocumentTypeChecker.check(t)) {
//     const ttt = t;
//     const tt = parseDocument(t);
// }
// export const documentParser: ParseFunction<typeof DocumentType, typeof Document> = (value, Type) => {
//     return new Type({
//         imports: value.imports,
//         exports: value.exports
//     });
// };
// const tmp = createParser(DocumentType, Document, documentParser);

export interface IDeclaration {
    readonly declarationType: string;
}

export class ExplicitImport implements IDeclaration {
    public readonly declarationType = 'import';
    public readonly importType = 'explicit';
    public moduleUri: string;
    public declarations: unknown[];

    public constructor(params: ConstructorParameters<ExplicitImport, 'moduleUri', 'declarations'>) {
        this.moduleUri = params.moduleUri;
        this.declarations = params.declarations ?? [];
    }
}
// export function parseExplicitImport(value: ExtractTypeSchema<typeof ExplicitImportType>) {
//     return new ExplicitImport({
//         declarations: value.declarations
//     });
// }

export class EntireModuleImport implements IDeclaration {
    public readonly declarationType = 'import';
    public readonly importType = 'entireModule';
    public moduleUri: string;
    public variableName: string;

    public constructor(params: ConstructorParameters<ModuleDefaultImport, 'moduleUri' | 'variableName'>) {
        this.moduleUri = params.moduleUri;
        this.variableName = params.variableName;
    }
}
// export function parseEntireModuleImport(value: ExtractTypeSchema<typeof EntireModuleImportType>) {
//     return new EntireModuleImport({
//         variableName: value.variableName
//     });
// }

export class ModuleDefaultImport implements IDeclaration {
    public readonly declarationType = 'import';
    public readonly importType = 'moduleDefault';
    public moduleUri: string;
    public variableName: string;

    public constructor(params: ConstructorParameters<ModuleDefaultImport, 'moduleUri' | 'variableName'>) {
        this.moduleUri = params.moduleUri;
        this.variableName = params.variableName;
    }
}
// export function parseModuleDefaultImport(value: ExtractTypeSchema<typeof ModuleDefaultImportType>) {
//     return new ModuleDefaultImport({
//         variableName: value.variableName
//     });
// }

export type Import = ExplicitImport | EntireModuleImport | ModuleDefaultImport;
// export function parseImport(value: ExtractTypeSchema<typeof ImportType>) {
//     if (value.type === 'explicit')
//         return parseExplicitImport(value);
//     else if (value.type === 'entireModule')
//         return parseEntireModuleImport(value);
//     else if (value.type === 'moduleDefault')
//         return parseModuleDefaultImport(value);
//     else
//         throw new Error();
// }

export class Group implements IDeclaration {
    public readonly declarationType = 'group';
    public declarations: Declaration[];

    public constructor(params: ConstructorParameters<Group, never, 'declarations'>) {
        this.declarations = params.declarations ?? [];
    }
}

export class DeclaredFunction implements IDeclaration {
    public readonly declarationType = 'function';
    public export: boolean;
    public name: string;
    public returnDataType: string | undefined;
    public parameters: MethodParameter[];
    public implementation: Implementation | undefined;

    public constructor(params: ConstructorParameters<DeclaredFunction, 'name', 'export' | 'returnDataType' | 'parameters' |'implementation'>) {
        this.export = params.export ?? false;
        this.name = params.name;
        this.returnDataType = params.returnDataType;
        this.parameters = params.parameters ?? [];
        this.implementation = params.implementation;
    }
}

export class Enumeration implements IDeclaration {
    public readonly declarationType = 'enumeration';
    public name: string;
    public values: EnumerationValue[]
    public export: boolean;

    public constructor(params: ConstructorParameters<Enumeration, 'name', 'values' | 'export'>) {
        this.name = params.name;
        this.values = params.values ?? [];
        this.export = params.export ?? false;
    }
}
export class EnumerationValue implements IDeclaration {
    public readonly declarationType = 'enumerationValue';
    public name: string;
    public value: number | undefined;

    public constructor(params: ConstructorParameters<EnumerationValue, 'name', 'value'>) {
        this.name = params.name;
        this.value = params.value;
    }
}

export class Interface implements IDeclaration {
    public readonly declarationType = 'interface';
    public export: boolean;
    public name: string;
    public members: InterfaceMember[];
    public extends: string[];

    public constructor(params: ConstructorParameters<Interface, 'name', 'export' | 'members' | 'extends'>) {
        this.export = params.export ?? false;
        this.name = params.name;
        this.members = params.members ?? [];
        this.extends = params.extends ?? [];
    }
}

export class InterfaceGroup {
    public readonly memberType = 'group';
    public members: InterfaceMember[];

    public constructor(params: ConstructorParameters<InterfaceGroup, never, 'members'>) {
        this.members = params.members ?? [];
    }
}
export class InterfaceProperty {
    public readonly memberType = 'property';
    public name: string;
    public dataType: string;
    public readonly: boolean;
    public optional: boolean;

    public constructor(params: ConstructorParameters<InterfaceProperty, 'name' | 'dataType', 'readonly' | 'optional'>) {
        this.name = params.name;
        this.dataType = params.dataType;
        this.readonly = params.readonly ?? false;
        this.optional = params.optional ?? false;
    }
}
export class InterfaceMethod {
    public readonly memberType = 'method';
    public name: string;
    public returnDataType: string | undefined;
    public parameters: MethodParameter[];

    public constructor(params: ConstructorParameters<InterfaceMethod, 'name', 'returnDataType' | 'parameters'>) {
        this.name = params.name;
        this.returnDataType = params.returnDataType;
        this.parameters = params.parameters ?? [];
    }
}

export type InterfaceMember = InterfaceProperty | InterfaceMethod;

export class Class implements IDeclaration {
    public readonly declarationType = 'class';
    public export: boolean;
    public name: string;
    public members: ClassMember[];
    public extends: string | undefined;
    public implements: string[];

    public constructor(params: ConstructorParameters<Class, 'name', 'export' | 'members' | 'extends' | 'implements'>) {
        this.export = params.export ?? false;
        this.name = params.name;
        this.members = params.members ?? [];
        this.extends = params.extends;
        this.implements = params.implements ?? [];
    }
}

export class ClassGroup {
    public readonly memberType = 'group';
    public members: ClassMember[];

    public constructor(params: ConstructorParameters<ClassGroup, never, 'members'>) {
        this.members = params.members ?? [];
    }
}

export class ClassProperty {
    public readonly memberType = 'property';
    public name: string;
    public dataType: string;
    public accessModifier: AccessModifiers;
    public readonly: boolean;
    public value: unknown | undefined;

    public constructor(params: ConstructorParameters<ClassProperty, 'name' | 'dataType', 'accessModifier' | 'readonly' | 'value'>) {
        this.name = params.name;
        this.dataType = params.dataType;
        this.accessModifier = params.accessModifier ?? AccessModifiers.Private;
        this.readonly = params.readonly ?? false;
        this.value = params.value;
    }

    // public toJSON() {
    //     return {
    //         memberType: this.memberType,
    //         name: this.name,
    //         dataType: this.dataType,
    //         accessModifier: this.accessModifier,
    //         readonly: this.readonly,
    //         value: this.value
    //     }
    // }
}
export class ClassConstructor {
    public readonly memberType = 'constructor';
    public parameters: MethodParameter[];
    public accessModifier: AccessModifiers;
    public implementation: Implementation | undefined;

    public constructor(params: ConstructorParameters<ClassConstructor, never, 'parameters' | 'accessModifier' | 'implementation'>) {
        this.parameters = params.parameters ?? [];
        this.accessModifier = params.accessModifier ?? AccessModifiers.Public;
        this.implementation = params.implementation;
    }

    // public toJSON() {
    //     return {
    //         memberType: this.memberType,
    //         name: this.name,
    //         parameters: this.parameters.map(p => p.toJSON()),
    //         accessModifier: this.accessModifier,
    //     }
    // }
}
export class ClassMethod {
    public readonly memberType = 'method';
    public name: string;
    public static: boolean;
    public override: boolean;
    public async: boolean;
    public returnDataType: string | undefined;
    public parameters: MethodParameter[];
    public accessModifier: AccessModifiers;
    public implementation: Implementation | undefined;

    public constructor(params: ConstructorParameters<ClassMethod, 'name', 'static' | 'override' | 'async' | 'returnDataType' | 'parameters' | 'accessModifier' | 'implementation'>) {
        this.name = params.name;
        this.static = params.static ?? false;
        this.override = params.override ?? false;
        this.async = params.async ?? false;
        this.returnDataType = params.returnDataType;
        this.parameters = params.parameters ?? [];
        this.accessModifier = params.accessModifier ?? AccessModifiers.Private;
        this.implementation = params.implementation;
    }

    // public toJSON() {
    //     return {
    //         memberType: this.memberType,
    //         name: this.name,
    //         parameters: this.parameters.map(p => p.toJSON()),
    //         accessModifier: this.accessModifier,
    //     }
    // }
}

export class ClassGetter {
    public readonly memberType = 'getter';
    public name: string;
    public dataType: string;
    public accessModifier: AccessModifiers;
    public implementation: Implementation | undefined;

    public constructor(params: ConstructorParameters<ClassGetter, 'name' | 'dataType', 'accessModifier' | 'implementation'>) {
        this.name = params.name;
        this.dataType = params.dataType;
        this.accessModifier = params.accessModifier ?? AccessModifiers.Private;
        this.implementation = params.implementation;
    }
}

export class ClassSetter {
    public readonly memberType = 'setter';
    public name: string;
    public dataType: string;
    public accessModifier: AccessModifiers;
    public implementation: Implementation | undefined;

    public constructor(params: ConstructorParameters<ClassSetter, 'name' | 'dataType', 'accessModifier' | 'implementation'>) {
        this.name = params.name;
        this.dataType = params.dataType
        this.accessModifier = params.accessModifier ?? AccessModifiers.Private;
        this.implementation = params.implementation;
    }
}

export class ClassPrivateField {
    public readonly memberType = 'privateField';
    public name: string;
    public dataType: string;

    public constructor(params: ConstructorParameters<ClassPrivateField, 'name' | 'dataType'>) {
        this.name = params.name;
        this.dataType = params.dataType
    }
}

export class MethodParameter {
    public name: string;
    public dataType: string;
    public optional: boolean;

    public constructor(params: ConstructorParameters<MethodParameter, 'name' | 'dataType', 'optional'>) {
        this.name = params.name;
        this.dataType = params.dataType;
        this.optional = params.optional ?? false;
    }

    // public toJSON() {
    //     return {
    //         name: this.name,
    //         data: this.dataType
    //     }
    // }
}

export class Implementation {
    public templateUri: string
    public context: unknown | undefined;

    public constructor(params: ConstructorParameters<Implementation, 'templateUri', 'context'>) {
        this.templateUri = params.templateUri;
        this.context = params.context;
    }
}

// export class DataType {
//     public dataType: string;

//     public constructor(params: ConstructorParameters<DataType, 'dataType'>) {
//         this.dataType = params.dataType;
//     }
// }

export type ClassMember = ClassGroup | ClassProperty | ClassConstructor | ClassMethod | ClassGetter | ClassSetter | ClassPrivateField;

export type Declaration = Group | Import | DeclaredFunction | Enumeration | Interface | Class;
