use regex::Regex;

#[derive(Clone)]
pub struct SyntaxTree {
    steps: Vec<Transition>,
    return_type: Type
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

struct OpBody {
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


/// Returns `true` if a token contains a literal, and `false` if a token doesn't.
fn is_note_literal(token: &str) -> bool {
    lazy_static! {
        static ref regex: Regex =Regex::new(r"(\^|_)?[1-7](s|e|q|h|w)(\.?)").unwrap();
    }
    return regex.is_match(token);
}

/// Returns `true` if a token contains a numeric literal (0, 1, 2, ...etc), `false` if it doesn't.
fn is_numeric_literal(token: &str) -> bool {
    // Regex compilation is expensive so we wrap this in a lazy static, meaning it is only
    // initialized once and then reused.
    lazy_static! {
        static ref regex: Regex = Regex::new(r"\d+").unwrap();
    }
    return regex.is_match(token);
}

pub fn parse(prog_str: String) -> Result<SyntaxTree, &'static str> {
    let tokens: Vec<&str> = prog_str.split(' ').collect();
    let mut i = 0; 
    let mut syntax_tree = SyntaxTree { steps: Vec::new(), return_type: Type::Nothing};

    while i < tokens.len() {
        let token = tokens[i].trim();
        match token {
            "let" => {
                // If this is a "let" expression, consume the next x tokens as well (let [name] =
                // [value]) until we hit a semicolon
                if i + 3 > tokens.len() {
                    println!("Error while parsing let expression: not enough tokens to consume");
                }
                i += 1;
                let name = tokens[i];
                i += 1;
                let mut rover = tokens[i]; // rover here should be =
                if rover != "=" {
                    println!("Malformed let expression: encountered let {} not followed by an equals sign", name);
                }
                // This is an expression which represents the value of the variable being declared.
                let mut value: Vec<String> = Vec::new();
                while !rover.contains(';') {
                      i += 1;
                      rover = tokens[i];
                      value.push(tokens[i].to_string());
                }
                let value_len = value.len();
                value[value_len - 1] = value[value_len - 1].clone().replace(";", ""); 
                let var_value = parse(value.join(" ")).expect(&format!("Failed to parse body of let expression {}", name));
                syntax_tree.steps.push(Transition::VarDeclaration { name: name.to_string(), value: Box::new(var_value.clone()), var_type: var_value.return_type});
            },
            "fn" => {
                // function declaration
                // of the form fn [name]([args]): [return_type] { [function_body] }
                // e.g. fn get_note(a: Note):Number {
                //      return 1q;
                // }
                //
                i += 1;
                let name = if tokens[i].contains("(") {
                    tokens[i].split("(").collect::Vec<String>()[0];
                } else { tokens[i] };
               
                let args =  // alex you left off here
                

            },
            token if is_note_literal(token) => {
                syntax_tree.return_type = Type::Note;
                syntax_tree.steps.push(Transition::Expression(Expression::Literal { value: token.to_string(), val_type: Type::Note }));
            },
            token if is_numeric_literal(token) => {
                syntax_tree.return_type = Type::Number;
                syntax_tree.steps.push(Transition::Expression(Expression::Literal { value: token.to_string(), val_type: Type::Number }));
            }
            _ => {
                println!("unimplemented token: {}", token);   
            },
    }

        i += 1;
    }

    println!("parsed {} expressions", syntax_tree.steps.len());

    return Ok(syntax_tree);
}
