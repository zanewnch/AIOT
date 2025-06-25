import {
  connectMongo,
  getMongoDB,
  disconnectMongo,
} from "../infrastructure/mongoConfig";
import { Collection, ObjectId } from "mongodb";

// 定義 MongoDB 集合的介面
interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Device {
  _id?: ObjectId;
  deviceId: string;
  name: string;
  type: string;
  status: "online" | "offline";
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceData {
  _id?: ObjectId;
  deviceId: ObjectId;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: Date;
}

class MongoRepository {
  private usersCollection!: Collection<User>;
  private devicesCollection!: Collection<Device>;
  private deviceDataCollection!: Collection<DeviceData>;

  async initialize(): Promise<void> {
    const db = await connectMongo();
    this.usersCollection = db.collection<User>("users");
    this.devicesCollection = db.collection<Device>("devices");
    this.deviceDataCollection = db.collection<DeviceData>("deviceData");

    // 建立索引以提高查詢效能
    await this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    // Users 集合索引
    await this.usersCollection.createIndex({ email: 1 }, { unique: true });

    // Devices 集合索引
    await this.devicesCollection.createIndex({ deviceId: 1 }, { unique: true });
    await this.devicesCollection.createIndex({ userId: 1 });

    // DeviceData 集合索引
    await this.deviceDataCollection.createIndex({ deviceId: 1 });
    await this.deviceDataCollection.createIndex({ timestamp: 1 });
    await this.deviceDataCollection.createIndex({ deviceId: 1, timestamp: -1 });
  }

  // User 相關操作
  async createUser(
    user: Omit<User, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    const now = new Date();
    const result = await this.usersCollection.insertOne({
      ...user,
      createdAt: now,
      updatedAt: now,
    });
    return result.insertedId;
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.usersCollection.findOne({ _id: new ObjectId(id) });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.usersCollection.findOne({ email });
  }

  // Device 相關操作
  async createDevice(
    device: Omit<Device, "_id" | "createdAt" | "updatedAt">
  ): Promise<ObjectId> {
    const now = new Date();
    const result = await this.devicesCollection.insertOne({
      ...device,
      createdAt: now,
      updatedAt: now,
    });
    return result.insertedId;
  }

  async getDevicesByUserId(userId: string): Promise<Device[]> {
    return await this.devicesCollection
      .find({ userId: new ObjectId(userId) })
      .toArray();
  }

  async updateDeviceStatus(
    deviceId: string,
    status: "online" | "offline"
  ): Promise<boolean> {
    const result = await this.devicesCollection.updateOne(
      { _id: new ObjectId(deviceId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }

  // DeviceData 相關操作
  async insertDeviceData(data: Omit<DeviceData, "_id">): Promise<ObjectId> {
    const result = await this.deviceDataCollection.insertOne(data);
    return result.insertedId;
  }

  async getLatestDeviceData(
    deviceId: string,
    limit: number = 10
  ): Promise<DeviceData[]> {
    return await this.deviceDataCollection
      .find({ deviceId: new ObjectId(deviceId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getDeviceDataByTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<DeviceData[]> {
    return await this.deviceDataCollection
      .find({
        deviceId: new ObjectId(deviceId),
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .sort({ timestamp: 1 })
      .toArray();
  }

  // 清理方法
  async disconnect(): Promise<void> {
    await disconnectMongo();
  }
}

// 匯出單例實例
export const mongoRepo = new MongoRepository();
