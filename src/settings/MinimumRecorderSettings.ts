import { AdvancedModel, BaudRate, RainCollectorSize } from "vant-environment/structures";
import { UnitConfiguration, UnitSettings } from "vant-environment/units";
import { LogLevel, MinimumLoggerSettings } from "vant-environment/log";
import { CurrentConditionsTaskSettings } from "./RecorderSettings";


type MinimumRecorderSettings = {
    /** The URL to the api. E.g. `http://localhost:8000/api`. Corresponding environment variable: `API`  */
    api: string;
    /** The api key used to communicate with the api. Corresponding environment variable: `API_KEY` */
    key: string;
    /** The weather station model. Default is `PRO 2`. Corresponding environment variable: `MODEL` */
    model: AdvancedModel;
    /** The serial path to the weather station. E.g. `COM3`. Corresponding environment variable: `SERIAL_PATH` */
    path: string;
    /** The default units. **Important**: Has to match the configured vant-api units! Corresponding environment variables: `RAIN_UNIT`; `TEMPERATURE_UNIT`; ...  */
    units?: Partial<UnitConfiguration>;
    /** The baud rate to use. Default is `19200`. This has to match your weather station's settings! Corresponding environment variable: `BAUD_RATE` */
    baudRate: BaudRate;
    /** Whether to prefer environment variables configured in the `.env` file. Default is `false`. */
    preferEnvironmentVariables?: false;
    /** Options that configure logging behaviour. */
    logOptions?: MinimumLoggerSettings;
    /** The weather station's rain collector size. Corresponding environment variable: `RAIN_COLLECTOR_SIZE` */
    rainCollectorSize: RainCollectorSize;
} | {     
    /** The URL to the api. E.g. `http://localhost:8000/api`. Corresponding environment variable: `API`  */
    api?: string;
    /** The api key used to communicate with the api. Corresponding environment variable: `API_KEY` */
    key?: string;
    /** The weather station model. Default is `PRO 2`. Corresponding environment variable: `MODEL` */
    model?: AdvancedModel;
    /** The serial path to the weather station. E.g. `COM3`. Corresponding environment variable: `SERIAL_PATH` */
    path?: string;
    /** The default units. **Important**: Has to match the configured vant-api units! Corresponding environment variables: `RAIN_UNIT`; `TEMPERATURE_UNIT`; ...  */
    units?: Partial<UnitConfiguration>;
    /** The baud rate to use. Default is `19200`. This has to match your weather station's settings! Corresponding environment variable: `BAUD_RATE` */
    baudRate?: BaudRate;
    /** Options that configure the logging behaviour. */
    logOptions?: MinimumLoggerSettings;
    /** Whether to prefer environment variables configured in the `.env` file. Default is `false`. */
    preferEnvironmentVariables: true;
    /** The weather station's rain collector size. Corresponding environment variable: `RAIN_COLLECTOR_SIZE` */
    rainCollectorSize?: RainCollectorSize;
}

export default MinimumRecorderSettings;


export type MinimumCurrentConditionsTaskSettings = {
    /** The update interval as integer (in seconds) for the current conditions. Default value is `1` (which is the minimum). Corresponding environment variable: `CURRENT_CONDITIONS_INTERVAL` */
    interval?: number,
    /** Whether to prefer environment variables configured in the `.env` file. Default is `false`. */
    preferEnvironmentVariables?: boolean,
}