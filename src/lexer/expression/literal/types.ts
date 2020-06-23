import { Token } from '../../tokenizer';
import { Expression } from '../expression';

export interface LiteralExp {
    _type: 'LiteralExp';
    literalValue: LiteralValue; // of course TODO
    returnType: string;
}

export type LiteralValue =
    | LiteralNumber
    | LiteralScaleDegree
    | LiteralScaleDegreeRhythm
    | LiteralRhythm
    | LiteralPitch
    | LiteralPitchRhythm
    | LiteralBoolean
    | LiteralList;

export interface LiteralNumber {
    _type: 'LiteralNumber';
    numericValue: number;
    token: Token;
    returnType: 'number';
}

export interface LiteralScaleDegree {
    _type: 'LiteralScaleDegree';
    scaleDegreeNumber: number;
    token: Token;
    returnType: 'degree';
}

export interface LiteralScaleDegreeRhythm {
    _type: 'LiteralScaleDegreeRhythm';
    scaleDegreeNumber: number;
    rhythm: LiteralRhythm;
    token: Token;
    returnType: 'degree_rhythm';
}

export interface LiteralRhythm {
    _type: 'LiteralRhythm';
    rhythmName: RhythmName;
    isDotted: boolean;
    token: Token; // there is no token here in the case it is nested in a pitchRhythm
    returnType: 'rhythm';
}

export interface LiteralPitch {
    _type: 'LiteralPitch';
    token: Token;
    pitches: (Pitch | Expression)[];
    returnType: 'pitch';
}

export interface Pitch {
    _type: 'Pitch';
    noteName: string;
    accidental?: Accidental;
    octave: number;
    midiNumber: number;
    pitchNumber: number;
}

/*
export interface LiteralChord {
    _type: 'LiteralChord';
    notes: LiteralPitch[];
    returnType: 'chord'; // TODO should this be a type of pitch?
}
   */

export interface LiteralBoolean {
    _type: 'LiteralBoolean';
    value: boolean;
    token: Token;
    returnType: 'boolean';
}

export interface LiteralPitchRhythm {
    _type: 'LiteralPitchRhythm';
    pitches: (Pitch | Expression)[];
    rhythm: LiteralRhythm;
    token: Token;
    returnType: 'pitch_rhythm';
    // TODO midiValue: number;
}

export interface LiteralList {
    _type: 'LiteralList';
    listContents: Expression[];
    token: Token;
    returnType: string; // of form 'list <type of contents>'
}

export type RhythmName = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second' | 'sixty-fourth';

/// A utility function to determine if a token is a literal.
export function isLiteral(input: Token): boolean {
    return [
        'boolean-literal',
        'scale-degree-literal',
        'numeric-literal',
        'pitch-literal',
        'pitch-rhythm-literal',
        'scale-degree-rhythm-literal',
    ].includes(input.tokenType);
}

export type Accidental = 'sharp' | 'flat' | 'natural';
