use std::env;
use std::fs;
use std::path::Path;
#[macro_use]
extern crate lazy_static;
mod parser;
use parser::parse;
#[macro_use]
extern crate combine;
extern crate regex;

fn main() -> Result<(), &'static str> {
    let args: Vec<String> = env::args().collect();
    let path = match args.get(1) {
        Some(path) => path,
        None => return Err("no file path given to compile"),
    };
    println!("Hello, world!");
    let program = match fs::read_to_string(Path::new(path)) {
        Ok(program) => program,
        Err(_) => return Err("failed to read file to string"),
    };

    let _syntax_tree = parse(program);

    Ok(())
}
