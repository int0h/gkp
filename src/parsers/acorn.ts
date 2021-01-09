import {Parser, DynamicDepMeta} from '../types';
import * as acornWalk from 'acorn-walk'
import * as acorn from 'acorn';

function findRequires(filename: string, jsCode: string): any[] {
    const requires: string[] = [];
    let ast: acorn.Node;
    try {
        ast = acorn.parse(jsCode, {
            allowHashBang: true
        });
    } catch (e) {
        console.error(`failed to parse file: ${filename}`);
        throw e;
    } 
    acornWalk.simple(ast, {
        CallExpression: (node: any) => {
            if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
                requires.push(node);
            }
        }
    });
    return requires;
}

export const parse: Parser = (filename: string, code) => {
    const deps: string[] = [];
    const dynamicDeps: DynamicDepMeta[] = [];

    findRequires(filename, code).forEach(r => {
        const arg = r.arguments[0];
        if (arg.type === 'Literal') {
            deps.push(arg.value as string)
        } else {
            dynamicDeps.push({
                code: code.slice(r.start, r.end),
                line: code.slice(0, r.start).match(/\n/g)?.length ?? 0 + 1,
                column: 0
            });
        }
    });

    return {deps, dynamicDeps};
};