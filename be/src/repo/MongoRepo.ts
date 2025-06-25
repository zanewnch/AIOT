import {
  connectMongoDB,
  disconnectMongoDB,
} from "../infrastructure/MongoDBConfig";
import mongoose, { Schema, Document, Model } from "mongoose";

// 定義 Mongoose 文件介面
interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IDevice extends Document {
  deviceId: string;
  name: string;
  type: string;
  status: "online" | "offline";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeviceData extends Document {
  deviceId: mongoose.Types.ObjectId;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: Date;
}

// 定義 Mongoose Schema
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, {
  timestamps: true  // 自動添加 createdAt 和 updatedAt
});

const deviceSchema = new Schema<IDevice>({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ["online", "offline"], required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

const deviceDataSchema = new Schema<IDeviceData>({
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  sensorType: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// 創建索引
deviceDataSchema.index({ deviceId: 1 });
deviceDataSchema.index({ timestamp: 1 });
deviceDataSchema.index({ deviceId: 1, timestamp: -1 });

class MongoRepository {
  private UserModel: Model<IUser>;
  private DeviceModel: Model<IDevice>;
  private DeviceDataModel: Model<IDeviceData>;

  constructor() {
    this.UserModel = mongoose.model<IUser>('User', userSchema);
    this.DeviceModel = mongoose.model<IDevice>('Device', deviceSchema);
    this.DeviceDataModel = mongoose.model<IDeviceData>('DeviceData', deviceDataSchema);
  }

  async initialize(): Promise<void> {
    await connectMongoDB();
    console.log("📦 MongoRepository 初始化完成");
  }

  // User 相關操作
  async createUser(
    user: { name: string; email: string }
  ): Promise<string> {
    const newUser = new this.UserModel(user);
    const result = await newUser.save();
    return result._id?.toString() || '';
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await this.UserModel.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await this.UserModel.findOne({ email });
  }

  // Device 相關操作
  async createDevice(
    device: { deviceId: string; name: string; type: string; status: "online" | "offline"; userId: string }
  ): Promise<string> {
    const newDevice = new this.DeviceModel({
      ...device,
      userId: new mongoose.Types.ObjectId(device.userId)
    });
    const result = await newDevice.save();
    return result._id?.toString() || '';
  }

  async getDevicesByUserId(userId: string): Promise<IDevice[]> {
    return await this.DeviceModel.find({ userId: new mongoose.Types.ObjectId(userId) });
  }

  async updateDeviceStatus(
    deviceId: string,
    status: "online" | "offline"
  ): Promise<boolean> {
    const result = await this.DeviceModel.updateOne(
      { _id: deviceId },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  }

  // DeviceData 相關操作
  async insertDeviceData(data: {
    deviceId: string;
    sensorType: string;
    value: number;
    unit: string;
    timestamp?: Date;
  }): Promise<string> {
    const newDeviceData = new this.DeviceDataModel({
      ...data,
      deviceId: new mongoose.Types.ObjectId(data.deviceId),
      timestamp: data.timestamp || new Date()
    });
    const result = await newDeviceData.save();
    return result._id?.toString() || '';
  }

  async getLatestDeviceData(
    deviceId: string,
    limit: number = 10
  ): Promise<IDeviceData[]> {
    return await this.DeviceDataModel
      .find({ deviceId: new mongoose.Types.ObjectId(deviceId) })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getDeviceDataByTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<IDeviceData[]> {
    return await this.DeviceDataModel
      .find({
        deviceId: new mongoose.Types.ObjectId(deviceId),
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .sort({ timestamp: 1 });
  }

  // 清理方法
  async disconnect(): Promise<void> {
    await disconnectMongoDB();
  }
}

// 匯出單例實例
export const mongoRepo = new MongoRepository();
