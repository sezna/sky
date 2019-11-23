import { Token } from '../../tokenizer';

export interface LiteralExp {
    _type: 'LiteralExp';
    literalValue: LiteralValue; // of course TODO
}

export type LiteralValue =
    | LiteralNumber
    | LiteralScaleDegree
    | LiteralScaleDegreeRhythm
    | LiteralRhythm
    | LiteralPitch
    | LiteralPitchRhythm;

export interface LiteralNumber {
    _type: 'LiteralNumber';
    numericValue: number;
    token: Token;
}

export interface LiteralScaleDegree {
    _type: 'LiteralScaleDegree';
    scaleDegreeNumber: number;
    token: Token;
}

export interface LiteralScaleDegreeRhythm {
    _type: 'LiteralScaleDegreeRhythm';
    scaleDegreeNumber: number;
    rhythm: LiteralRhythm;
    token: Token;
}

export interface LiteralRhythm {
    _type: 'LiteralRhythm';
    rhythmName: RhythmName;
    isDotted: boolean;
    token: Token; // there is no token here in the case it is nested in a pitchRhythm
}

export interface LiteralPitch {
    _type: 'LiteralPitch';
    noteName: string;
    token: Token;
    // TODO midiValue: number;
}

export interface LiteralPitchRhythm {
    _type: 'LiteralPitchRhythm';
    rhythm: LiteralRhythm;
    noteName: string;
    token: Token;
    // TODO midiValue: number;
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