export default class InvalidRecorderConfigurationError extends Error{
    constructor(msg: string){
        super(msg);
    }
}