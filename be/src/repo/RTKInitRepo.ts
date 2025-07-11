import { RTKDataModel } from '../models/RTKDataModel.js';

export interface IRTKInitRepository {
    count(): Promise<number>;
    bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]>;
}

export class RTKInitRepository implements IRTKInitRepository {
    async count(): Promise<number> {
        return await RTKDataModel.count();
    }

    async bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]> {
        return await RTKDataModel.bulkCreate(data);
    }
}