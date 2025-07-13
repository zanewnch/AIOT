import { createSequelizeInstance } from './config/database.js';
import { RTKDataModel } from './models/RTKDataModel.js';

async function addTestRTKData() {
  const sequelize = createSequelizeInstance();
  
  try {
    await sequelize.sync();
    console.log('🔗 Database connected');

    // Add some test RTK data
    const testData = [
      { latitude: 25.033964, longitude: 121.564468 }, // Taipei
      { latitude: 25.047924, longitude: 121.517081 }, // Taipei Station
      { latitude: 25.042467, longitude: 121.513015 }, // Presidential Office
      { latitude: 25.076817, longitude: 121.540137 }, // Shilin Night Market
    ];

    for (const data of testData) {
      await RTKDataModel.create(data);
      console.log(`✅ Added RTK data: lat=${data.latitude}, lng=${data.longitude}`);
    }

    console.log('🎉 Test data added successfully!');
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await sequelize.close();
  }
}

addTestRTKData();