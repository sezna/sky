import { RuntimeOutput } from '../runtime';
// import { timeSignatureDurationMapping } from '../utils'; TODO pass time signature info down - make it a property

export function renderPitch(input: RuntimeOutput['mainReturn'], duration = 1): string {
    // TODO the <duration> tag which depends on the time signature -- an unimplemented property
    // also the type, which will be passed in for pitch rhythm

    let output = `<note>
  <pitch>
    <step>${input.returnValue.noteName}</step>
    <octave>${input.returnValue.octave}</octave>
    <duration>${duration}</duration>
`;
    if (input.returnValue.rhythmName) {
        output += `  <type>${input.returnValue.rhythmName}</type>\n`;
    }
    if (input.returnValue.accidental) {
        output += `    <alter>${input.returnValue.accidental}</alter>\n`;
    }

    return (
        output +
        `  </pitch>
</note>`
    );
}
