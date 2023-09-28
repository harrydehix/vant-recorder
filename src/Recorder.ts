import { VantPro2Interface, VantVueInterface } from "vantjs/interfaces";
import superagent from "superagent";
import RecorderSettings, { CurrentConditionsTaskSettings, defaultCurrentConditionsTaskSettings, defaultRecorderSettings } from "./settings/RecorderSettings";
import merge from "lodash.merge";
import MinimumRecorderSettings, { MinimumCurrentConditionsTaskSettings } from "./settings/MinimumRecorderSettings";
import dotenv from "dotenv";
import validator from "validator";
import { configureLogger } from "vant-environment/log";
import { PressureUnit, RainUnit, SolarRadiationUnit, TemperatureUnit, WindUnit, PressureUnits, RainUnits, SolarRadiationUnits, TemperatureUnits, WindUnits } from "vant-environment/units";
import { AdvancedModels, BaudRates, RainCollectorSizes } from "vant-environment/structures";
import InvalidRecorderConfigurationError from "./InvalidRecorderConfigurationError";
import { RichRealtimeData } from "vant-environment/structures";
import { DeepReadonly } from "ts-essentials";
import { sleep } from "vant-environment/utils";
import log from "./log";

/**
 * The recorder is the counter-part to the `startVantageAPI()` function.
 * It repeatedly sends weather data to a running vant-api instance via _HTTP requests_.
 * 
 * To get the weather data is utilizes a {@link VantPro2Interface} or a {@link VantVueInterface}. 
 * Only works on Vantage Pro 2 and Vue (having firmware dated after April 24, 2002 / v1.90 or above).
 * 
 * The recorder is structured in multiple _tasks_ which are responsibly for different kinds of weather data.
 * Currently there are following tasks:
 * - **Current Conditions**: Uploads rich realtime data very often (configurable, default: every `1s`) [route: `api/v1/current`]
 * 
 * To create a recorder write:
 * ```ts
 * const recorder = await Recorder.create(...);
 * ```
 * 
 * To configure the current conditions task write:
 * ```ts
 * recorder.configureCurrentConditionsTask(...);
 * ```
 * 
 * To start the recorder write:
 * ```ts
 * recorder.start();
 * ```
 */
class Recorder {
    public readonly settings : DeepReadonly<RecorderSettings>;
    public readonly interface : VantVueInterface | VantPro2Interface;

    private currentConditionsTaskSettings? : CurrentConditionsTaskSettings;
    private realtimeRecorderTimeout? : NodeJS.Timeout;
    private running: boolean;

    private constructor(settings: RecorderSettings, device: VantVueInterface | VantPro2Interface){
        this.settings = settings;
        this.interface = device;
        this.running = false;
    }

    /**
     * Creates a new recorder with the passed settings. Throws an {@link InvalidRecorderConfigurationError} if the settings are invalid.
     * 
     * It is also possible to configure your recorder using a `.env` file. To enable this feature pass `useEnvironmentVariables: true`.
     * 
     * **Example**:
     * ```ts
     * // create recorder
     * const recorder = await Recorder.create({
     *      path: "COM5",
     *      api: "http://localhost:8000/api",
     *      rainCollectorSize: "0.2mm",
     *      model: "Pro2",
     *      ....
     * });
     * 
     * // configure realtime recordings
     * recorder.configureRealtimeRecording({ interval: 10 });
     * 
     * // start recorder
     * recorder.start();
     * ```
     * @param settings 
     * @returns a recorder instance
     * @throws {@link InvalidRecorderConfigurationError} if the settings are invalid
     */
    public static create = async(recorderSettings: MinimumRecorderSettings) => {
        const settings = (merge(defaultRecorderSettings, recorderSettings)) as RecorderSettings;
       
        if(settings.preferEnvironmentVariables){
            Recorder.loadEnvironmentVariablesAndConfigureLogger(settings);
        }else{
            configureLogger(log, settings.logOptions, "vant-recorder");
        }

        Recorder.validateSettings(settings);

        let device = await this.createDeviceInterface(settings);

        return new Recorder(settings, device);
    }

    private static async createDeviceInterface(settings: RecorderSettings){
        log.info(`Connecting to device ${settings.path} (${settings.model})...`);
        let device;
        if(settings.model === "Pro2"){
            device = await VantPro2Interface.create({
                path: settings.path!,
                rainCollectorSize: settings.rainCollectorSize!,
            });
        }else{
            device = await VantVueInterface.create({
                path: settings.path!,
                rainCollectorSize: settings.rainCollectorSize!,
            });
        }
        log.info(`Connected!`);
        return device;
    }

    private static loadEnvironmentVariablesAndConfigureLogger(settings: RecorderSettings){
        const invalidEnvironmentVariables = []
        dotenv.config();

        if(process.env.API && validator.isURL(process.env.API, {require_tld: false})){
            settings.api = process.env.API;
        }else{
            invalidEnvironmentVariables.push("API");
        }

        if(process.env.API_KEY){
            settings.key = process.env.API_KEY;
        }else{
            invalidEnvironmentVariables.push("API_KEY");
        }

        if(process.env.BAUD_RATE && validator.isIn(process.env.BAUD_RATE, BaudRates)){
            settings.baudRate = parseInt(process.env.BAUD_RATE!) as any;
        }else{
            invalidEnvironmentVariables.push("BAUD_RATE");
        }

        if(process.env.MODEL && validator.isIn(process.env.MODEL, AdvancedModels)){
            settings.model = process.env.MODEL as any;
        }else{
            invalidEnvironmentVariables.push("MODEL");
        }

        if(process.env.SERIAL_PATH){
            settings.path = process.env.SERIAL_PATH;
        }else{
            invalidEnvironmentVariables.push("SERIAL_PATH");
        }

        if(process.env.LOG_LEVEL && validator.isIn(process.env.LOG_LEVEL, ["debug", "info", "warn", "error"])){
            settings.logOptions.logLevel = process.env.LOG_LEVEL as any;
        }else{
            invalidEnvironmentVariables.push("LOG_LEVEL");
        }

        if(process.env.RAIN_COLLECTOR_SIZE && validator.isIn(process.env.RAIN_COLLECTOR_SIZE, RainCollectorSizes)){
            settings.rainCollectorSize = process.env.RAIN_COLLECTOR_SIZE as any;
        }else{
            invalidEnvironmentVariables.push("RAIN_COLLECTOR_SIZE");
        }

        if(process.env.CONSOLE_LOG && validator.isBoolean(process.env.CONSOLE_LOG)){
            settings.logOptions.consoleLog = process.env.CONSOLE_LOG === "true";
        }else{
            invalidEnvironmentVariables.push("CONSOLE_LOG");
        }

        if(process.env.FILE_LOG && validator.isBoolean(process.env.FILE_LOG)){
            settings.logOptions.fileLog = process.env.FILE_LOG === "true";
        }else{
            invalidEnvironmentVariables.push("FILE_LOG");
        }

        if(process.env.LOG_ERROR_INFORMATION && validator.isBoolean(process.env.LOG_ERROR_INFORMATION)){
            settings.logOptions.logErrorInformation = process.env.LOG_ERROR_INFORMATION === "true";
        }else{
            invalidEnvironmentVariables.push("LOG_ERROR_INFORMATION");
        }
        if(process.env.RAIN_UNIT && validator.isIn(process.env.RAIN_UNIT, RainUnits)){
            settings.units!.rain = process.env.RAIN_UNIT as RainUnit;
        }else{
            invalidEnvironmentVariables.push("RAIN_UNIT");
        }

        if(process.env.TEMPERATURE_UNIT && validator.isIn(process.env.TEMPERATURE_UNIT, TemperatureUnits)){
            settings.units!.temperature = process.env.TEMPERATURE_UNIT as TemperatureUnit;
        }else{
            invalidEnvironmentVariables.push("TEMPERATURE_UNIT");
        }

        if(process.env.PRESSURE_UNIT && validator.isIn(process.env.PRESSURE_UNIT, PressureUnits)){
            settings.units!.pressure = process.env.PRESSURE_UNIT as PressureUnit;
        }else{
            invalidEnvironmentVariables.push("PRESSURE_UNIT");
        }

        if(process.env.SOLAR_RADIATION_UNIT &&  validator.isIn(process.env.SOLAR_RADIATION_UNIT, SolarRadiationUnits)){
            settings.units!.solarRadiation = process.env.SOLAR_RADIATION_UNIT as SolarRadiationUnit;
        }else{
            invalidEnvironmentVariables.push("SOLAR_RADIATION_UNIT");
        }

        if(process.env.WIND_UNIT && validator.isIn(process.env.WIND_UNIT, WindUnits)){
            settings.units!.wind = process.env.WIND_UNIT as WindUnit;
        }else{
            invalidEnvironmentVariables.push("WIND_UNIT");
        }

        configureLogger(log, settings.logOptions, "vant-recorder");

        for(const invalidEnvironmentVariable of invalidEnvironmentVariables){
            log.warn(`Invalid or missing environment variable '${invalidEnvironmentVariable}'!`)
        }

         log.debug("Loaded environment variables!");
    }

    private static validateSettings(settings: RecorderSettings){
        if(!settings.path){
            log.error("No serial path specified!");
            throw new InvalidRecorderConfigurationError("No serial path specified!");
        }

        if(!settings.rainCollectorSize){
            log.error("No rain collector size specified!");
            throw new InvalidRecorderConfigurationError("No rain collector size specified!");;
        }

        if(!settings.api){
            log.error("No api url specified!");
            throw new InvalidRecorderConfigurationError("No api url specified!");;
        }

        if(!settings.baudRate){
            log.error("No baud rate specified!");
            throw new InvalidRecorderConfigurationError("No baud rate specified!");;
        }

        if(!settings.model){
            log.error("No weather station model specified!");
            throw new InvalidRecorderConfigurationError("No weather station model specified!");;
        }
    }

    /**
     * Configures the current conditions task. This is related to the `/api/v1/current` route.
     * Pass your desired settings to configure and enable the task, pass `false` to disable it.
     * 
     * It is also possible to configure your recorder using a `.env` file. To enable this feature pass `useEnvironmentVariables: true`.
     * 
     * To start all your configured tasks run `start()`.
     * @param settings 
     * @throws {@link InvalidRecorderConfigurationError} if the settings are invalid
     */
    public configureCurrentConditionsTask = (settings : MinimumCurrentConditionsTaskSettings | false) => {
        if(!settings){
            this.currentConditionsTaskSettings = undefined;
        }else{
            this.currentConditionsTaskSettings = merge(defaultCurrentConditionsTaskSettings, settings);

            const invalidEnvironmentVariables = [];
            if(settings.preferEnvironmentVariables){
                const interval = process.env.CURRENT_CONDITIONS_INTERVAL;
                if(interval && validator.isInt(interval, { min: 1 })){
                    this.currentConditionsTaskSettings.interval = parseInt(interval);
                }else{
                    invalidEnvironmentVariables.push("CURRENT_CONDITIONS_INTERVAL");
                }
            }

            if(settings.preferEnvironmentVariables){
                for(const invalidEnvironmentVariable of invalidEnvironmentVariables){
                    log.warn(`Invalid or missing environment variable '${invalidEnvironmentVariable}'!`)
                }
            }

            if(!this.currentConditionsTaskSettings?.interval || this.currentConditionsTaskSettings?.interval < 1){
                throw new InvalidRecorderConfigurationError("The current conditions interval has to be greater or equal to 1.");
            }
        }
    }

    /**
     * Return whether the current conditions task is configured.
     * @returns whether the current conditions task is configured
     */
    public currentConditionsConfigured = () => this.currentConditionsTaskSettings !== undefined;

    /**
     * Return the set up current conditions task's interval.
     * @returns the set up current conditions task's interval
     */
    public currentConditionsInterval = () => this.currentConditionsTaskSettings?.interval;

    /** Starts the recorder. Tasks that have
     *  been configured using `configure*Task(...)` will be started.
     *  
     *  Does nothing if the recorder already has been started. */
    public start = () => {
        if(this.running){
            return;
        }
        this.running = true;
        log.info("Started recorder!");
        if (this.currentConditionsTaskSettings) { 
            this.updateCurrentConditions();
        }
    }

    /** Stops the recorder. Clears all currently running recording tasks. 
     * 
     *  Does nothing if the recorder already has been stopped.
    */
    public stop = () => {
        if(this.running){
            log.info("Stopped recorder!")
            clearTimeout(this.realtimeRecorderTimeout);
            this.running = false;
        }
    }

    /**
     * Restarts the recorder. Useful if you changed the recorder's settings while it was already running.
     */
    public restart = () => {
        log.info("Restarting recorder!");
        this.stop();
        this.start();
    }

    /**
     * Updates the current conditions.
     * This is done by getting a rich realtime data package using the interface and sending it to the api using a `POST` request.
     * @hidden
     */
    protected updateCurrentConditions = async() => {
        // Get rich realtime record
        let record : RichRealtimeData | undefined;
        do{
            try{
                record = await this.interface.getRichRealtimeData();
            }catch(err){
                log.error("Failed to get realtime record from interface.");
                log.error(err);
                log.info("Retrying...");
                await sleep(1000);
            }
        }while(record == undefined);

        // Send post request
        log.info("New realtime record (" + record.time + ")");
        superagent
            .post(this.settings.api + "/v1/current")
            .disableTLSCerts()
            .send(record)
            .set('accept', 'json')
            .set('x-api-key', this.settings.key)
            .end((err, res: superagent.Response) => {
                if(!res || !res.ok){
                    log.error(`Failed to send realtime record to '${this.settings.api}'!`);  
                    if(res && res.body && res.body.message){
                        log.error("Server message: '" + res.body.message + "'");
                    }else{
                        log.error("Is your api running?");
                        log.error(err);
                    }
                }else{
                    log.debug("Sent realtime record (" + record!.time + ") successfully!");
                }
            });

        // Calculate next record time
        const newRecordTime = new Date(record.time);
        newRecordTime.setSeconds(record.time.getSeconds() + this.currentConditionsTaskSettings?.interval!);
        newRecordTime.setMilliseconds(0);
        const timeoutTime = newRecordTime.getTime() - record.time.getTime();
        this.realtimeRecorderTimeout = setTimeout(this.updateCurrentConditions, timeoutTime);
    }
}

export default Recorder;