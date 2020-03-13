import { RuntimeOutput } from '../runtime';
// import { timeSignatureDurationMapping } from '../utils'; TODO pass time signature info down - make it a property

export function renderPitch(input: RuntimeOutput['mainReturn'], duration = 1): string {
    // TODO the <duration> tag which depends on the time signature -- an unimplemented property
    // also the type, which iwll be passed in for pitch rhythm
    return `<note>
  <pitch>
    <step>${input.returnValue.noteName}</step>
    <octave>${input.returnValue.octave}</octave>
    <duration>${duration}</duration>
    ${input.returnValue.rhythmName ? `<type>${input.returnValue.rhythmName}</type>` : ''}
  </pitch>
<\note>`;
}
