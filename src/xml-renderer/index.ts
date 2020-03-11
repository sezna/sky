import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

/**
 * Takes the runtime output (the return value from the main function) and renders it into musicXML.
 */
export function render(input: RuntimeOutput): string {
    console.log('XML rendering is unimplemented.');
    const mainReturnType = input.mainReturn.returnType;
    let output = '';

    switch (mainReturnType) {
        case 'pitch':
            output += renderPitch(input.mainReturn);
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered. Failed to render:
${JSON.stringify(input.mainReturn.returnValue, null, 2)}`);
    }
    return output;
}
