use combine::parser::char::{letter, spaces};
use combine::{between, choice, many1, parser, sep_by, Parser, tokens, token};

use combine::stream::{Stream};





#[derive(Clone)]
pub struct SyntaxTree {
    steps: Vec<Transition>,
    return_type: Type
}

impl SyntaxTree {
    pub fn new() -> SyntaxTree {
        SyntaxTree {
            steps: Vec::new(),
            return_type: Type::Nothing
        }
    }
}

#[derive(Clone)]
enum Transition {
    /// An expression is something which returns a value and can be evaluated.
    Expression(Expression),
    /// A variable declaration modifies the environment by inserting a value into the environment
    /// with an associated name.
    VarDeclaration {
        name: String,
        var_type: Type, 
        value: Box<SyntaxTree>
    },
    /// A function declaration modifies the environment by inserting a vector of transitions with
    /// an associated name.
    FuncDeclaration {
        name: String,
        argNames: Vec<String>,
        body: Box<SyntaxTree>
    }
}

#[derive(Clone)]
enum Operator {
    ChordalAdd,
    RhythmicAdd,
}

#[derive(Clone)]
enum Expression {
    Op {
        operator: Operator,
        left: Box<SyntaxTree>,
        right: Box<SyntaxTree>,
    },
    Literal {
        value: String,
        val_type: Type
    }

    /*    FuncApp(FuncAppBody),
    Var(VarBody),
    If(IfBody),
    For(ForBody),
    While(WhileBody),
    Literal(LiteralBody)*/
}


#[derive(Clone)]
enum Type { 
    Number,
    Note,
    Chord,
    Nothing
}

#[derive(Debug)]
struct VarDecl {
    name: Vec<char>,
    value: String 
}

pub fn parse(prog_str: String) -> Result<(SyntaxTree, &'static str), &'static str> {
    let mut parser = sky_parser();
    println!("parsed: ");
    let prog =  parser.easy_parse(prog_str.as_str()).unwrap().0;
    for c in prog.name.iter() {
        print!("{:?}", c);
    }
    println!("==");
        print!("{:?}", prog.value);
    return Ok((SyntaxTree::new(), ""));
}

parser! {
//    lazy_static! { static ref note_literal_regex: Regex = Regex::new("(\\^|_)?[1-7](s|e|q|h|w)(\\.?)").unwrap(); }
    fn sky_parser[I]()(I) -> VarDecl
    where [I: Stream<Item = char>] {
//        let note_literal_regex = Regex::new("(\\^|_)?[1-7](s|e|q|h|w)(\\.?)").unwrap();


        // For now, we just support literal expressions.
//        let note_literal = find(&note_literal_regex);

        let var_decl = struct_parser! {
            VarDecl {
                _: tokens("let".chars()),
                _: spaces(),
                name: many1(letter()),
                _: spaces(),
                _: token('='),
                _: spaces(),
                value: tokens("test".chars()).map(|c| c.as_str().to_string()) //note_literal // TODO make this match any expression
            }
        };

        var_decl
    }
}
