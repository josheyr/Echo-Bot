module.exports = class Command {
    constructor(command, args, description = "TODO") {
        this.command = command;
        this.args = args;
        this.description = description;
    }

    getCommand(){
        return this.command;
    }

    getArgs(){
        return this.args;
    }

    getArgsAsString(){
        var string = "";
        this.args.forEach(arg => {
            string += (arg.optional ? "[" : "<")
            + arg.name
            + (arg.optional ? "]" : ">") + " "; 
        })

        return string;
    }
}