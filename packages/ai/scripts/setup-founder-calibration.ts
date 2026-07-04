import { buildFounderCalibrationSetupInputFromEnv, setupFounderCalibrationParticipants } from "../src/founder-calibration-setup.js"

const input = buildFounderCalibrationSetupInputFromEnv()
const result = await setupFounderCalibrationParticipants(input)
console.log(JSON.stringify(result, null, 2))
