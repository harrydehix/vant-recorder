import { defaultUnitSettings, UnitConfiguration } from "vant-environment/units";
import { AdvancedModel, BaudRate, RainCollectorSize } from "vant-environment/structures";
import Recorder from "../Recorder";
import { defaultLoggerSettings, LoggerSettings, LogLevel } from "vant-environment/log";

/**
 * The general settings for the recorder. For example this includes the `url` to your running _vant-api_ instance or the serial `path` to your connected weather station.
 * 
 * To configure the current conditions task call {@link Recorder.configureCurrentConditionsTask}.
 */
export default interface RecorderSettings{
    /** The URL to the api. E.g. `http://localhost:8000/api`. Corresponding environment variable: `API`  */
    api: string,
    /** The api key used to communicate with the api. Corresponding environment variable: `API_KEY` */
    key: string,
    /** The weather station model. Default is `PRO2`. Corresponding environment variable: `MODEL` */
    model: AdvancedModel,
    /** The serial path to the weather station. E.g. `COM3`. Corresponding environment variable: `SERIAL_PATH` */
    path: string,
    /** The default units. **Important**: Has to match the configured vant-api units! Corresponding environment variables: `RAIN_UNIT`, `TEMPERATURE_UNIT`, ...  */
    units: UnitConfiguration,
    /** The baud rate to use. Default is `19200`. This has to match your weather station's settings! Corresponding environment variable: `BAUD_RATE` */
    baudRate: BaudRate,
    /** Whether to prefer environment variables configured in the `.env` file. Default is `false`. */
    preferEnvironmentVariables: boolean,
    /** Options that configure the logging behaviour. */
    logOptions: LoggerSettings,
    /** The weather station's rain collector size. */
    rainCollectorSize?: RainCollectorSize,
}

/**
 * The default recorder settings.
 */
export const defaultRecorderSettings : RecorderSettings = {
    api: "",
    key: "",
    path: "",
    model: "Pro2",
    baudRate: 19200,
    preferEnvironmentVariables: false,
    logOptions: defaultLoggerSettings,
    units: defaultUnitSettings
} 

/**
 * The settings for the current conditions task. This is related to the `api/v1/current` route.
 * Call {@link Recorder.configureCurrentConditionsTask} to configure. If your recorder is already running you have to restart it using `restart()`.
 */
export interface CurrentConditionsTaskSettings{
    /** The update interval as integer (in seconds) for the current conditions. Default value is `1` (which is the minimum). Corresponding environment variable: `CURRENT_CONDITIONS_INTERVAL` */
    interval: number,
    /** Whether to prefer environment variables configured in the `.env` file. Default is `false`. */
    useEnvironmentVariables: boolean,
}

/**
 * The default settings for the current conditions task.
 */
export const defaultCurrentConditionsTaskSettings : CurrentConditionsTaskSettings = {
    interval: 1,
    useEnvironmentVariables: false
}