import { TableService } from './services/TableService';

async function testRTKFetch() {
  console.log('🧪 Testing RTK data fetch...');
  
  try {
    // Test direct RTK data fetch
    console.log('1. Testing direct getRTKData()...');
    const directData = await TableService.getRTKData();
    console.log('✅ Direct fetch result:', directData);
    
    // Test via getTableData
    console.log('2. Testing via getTableData("RTK")...');
    const tableData = await TableService.getTableData('RTK');
    console.log('✅ Table data fetch result:', tableData);
    
    // Compare results
    if (JSON.stringify(directData) === JSON.stringify(tableData)) {
      console.log('✅ Both methods return identical data');
    } else {
      console.log('❌ Methods return different data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', testRTKFetch);
}

export { testRTKFetch };