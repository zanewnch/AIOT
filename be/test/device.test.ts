import { DeviceType, DeviceStatus, Device } from "../src/models/Device";

/* 
create the dummy data for testing
*/
const device_data: Device[] = [
  new Device(
    "1",
    "Temperature Sensor",
    "sensor",
    "online",
    "Conference Room A",
    { model: "TS-100", manufacturer: "SensorCorp" },
    new Date("2023-10-01T12:00:00Z")
  ),
  new Device(
    "2",
    "Light Controller",
    "controller",
    "online",
    "Conference Room B",
    { model: "LC-200", manufacturer: "ControlTech" },
    new Date("2023-10-02T12:00:00Z")
  ),
  new Device(
    "3",
    "Actuator 3000",
    "actuator",
    "offline",
    "Conference Room C",
    { model: "AC-3000", manufacturer: "ActuatorInc" },
    new Date("2023-10-03T12:00:00Z")
  ),
];

/* 
because we do not want use the real ORM function, we have to use the mock way to intercept the original function.

for example, if we use the mock way, the original function will not use the real ORM script, but use the mock function instead.
*/
jest.mock("../src/repositories/DeviceRepo", () => {
  return {
    DeviceRepo: jest.fn().mockImplementation(() => {
      return {
        createDevice: jest.fn().mockResolvedValue(device_data)
      };
    })
  };
});

describe("create device", () => {
  test("create a device with valid data", () => {});
});
