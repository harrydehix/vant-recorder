import Recorder from "./Recorder";
import log from "./log";

let recorder : Recorder | undefined;
async function main(){    
    recorder = await Recorder.create({
        preferEnvironmentVariables: true,
    });

    recorder.configureCurrentConditionsTask({
        interval: 1,
        preferEnvironmentVariables: true,
    });

    recorder.start();
}

main();

// do something when app is closing
process.on('exit', () => {
    log.info("Exiting!");
});


async function shutdownGracefully(){
    log.info("Shutting down gracefully...");
    recorder?.stop();
    process.exit();
}

// catches ctrl+c event
process.on('SIGINT', () => {
    log.warn("Received SIGINT event!");
    shutdownGracefully();
});

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => {
    log.warn("Received kill (SIGNUSR1) signal!");
    shutdownGracefully();
});
process.on('SIGUSR2', () => {
    log.warn("Received kill (SIGNUSR2) signal!");
    shutdownGracefully();
});
process.on('SIGTERM', () => {
    log.warn("Received kill (SIGTERM) signal!");
    shutdownGracefully();
});

// catches uncaught exceptions
process.on('uncaughtException', (err) => {
    log.error("Uncaught exception!");
    log.error(err);
    shutdownGracefully();
});