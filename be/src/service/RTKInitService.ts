import { RTKInitRepository } from '../repo/RTKInitRepo.js';

export class RTKInitService {
  private rtkInitRepository: RTKInitRepository;

  constructor() {
    this.rtkInitRepository = new RTKInitRepository();
  }

  async seedRTKDemo(): Promise<{ message: string; count: number }> {
    const existingCount = await this.rtkInitRepository.count();
    
    if (existingCount > 0) {
      return {
        message: 'RTK demo data already exists',
        count: existingCount
      };
    }

    const dummyData = [
      { latitude: 25.0330, longitude: 121.5654 }, // Taipei
      { latitude: 24.1477, longitude: 120.6736 }, // Taichung
      { latitude: 22.6273, longitude: 120.3014 }, // Kaohsiung
      { latitude: 24.9936, longitude: 121.3010 }, // Yilan
      { latitude: 23.6978, longitude: 120.9605 }, // Chiayi
      { latitude: 25.1276, longitude: 121.7392 }, // Keelung
      { latitude: 24.8068, longitude: 120.9686 }, // Hsinchu
      { latitude: 23.9609, longitude: 121.6015 }, // Hualien
      { latitude: 22.7972, longitude: 121.1561 }, // Taitung
      { latitude: 24.0737, longitude: 120.5420 }, // Yunlin
    ];

    const createdRecords = await this.rtkInitRepository.bulkCreate(dummyData);

    return {
      message: 'RTK demo data created successfully',
      count: createdRecords.length
    };
  }
}